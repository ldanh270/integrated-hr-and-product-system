import {
  CreateProjectDto,
  Project,
  ProjectListQuery,
  IProjectRepository,
  PaginatedProjectsDto,
  UpdateProjectDto,
} from "@/types"

import { Prisma, PrismaClient, Project as PrismaProject, Employee as PrismaEmployee } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

type PrismaProjectWithRelations = PrismaProject & {
  teamLeader?: PrismaEmployee | null
  createdBy?: PrismaEmployee
}

export class PrismaProjectRepository extends BaseRepository implements IProjectRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  protected mapToDomain(project: PrismaProjectWithRelations): Project {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      techStack: project.techStack,
      status: project.status as any,
      taskCreationPolicy: project.taskCreationPolicy as any,
      startDate: project.startDate,
      expectedEndDate: project.expectedEndDate,
      actualEndDate: project.actualEndDate,
      teamLeaderId: project.teamLeaderId,
      createdById: project.createdById,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      teamLeader: project.teamLeader
        ? {
            id: project.teamLeader.id,
            fullName: project.teamLeader.fullName,
            email: project.teamLeader.email,
          }
        : null,
      createdBy: project.createdBy
        ? {
            id: project.createdBy.id,
            fullName: project.createdBy.fullName,
            email: project.createdBy.email,
          }
        : undefined,
    }
  }

  async findById(id: string): Promise<Project | null> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        teamLeader: true,
        createdBy: true,
      },
    })
    return project ? this.mapToDomain(project) : null
  }

  async findByName(name: string): Promise<Project | null> {
    const project = await this.prisma.project.findUnique({
      where: { name },
      include: {
        teamLeader: true,
        createdBy: true,
      },
    })
    return project ? this.mapToDomain(project) : null
  }

  async listProjects(
    query: ProjectListQuery,
    userId: string,
    userRole: string
  ): Promise<PaginatedProjectsDto> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query

    const skip = (page - 1) * limit
    const where: Prisma.ProjectWhereInput = {}

    // 1. Phân quyền hiển thị danh sách dự án
    if (userRole !== "admin" && userRole !== "general_manager") {
      where.OR = [
        { teamLeaderId: userId },
        {
          members: {
            some: {
              employeeId: userId,
              removedAt: null,
            },
          },
        },
      ]
    }

    // 2. Lọc theo trạng thái
    if (status) {
      where.status = status as any
    }

    // 3. Tìm kiếm theo tên hoặc mô tả
    if (search) {
      where.OR = [
        ...(where.OR || []),
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    // 4. Lấy dữ liệu phân trang
    const [total, projects] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          teamLeader: true,
          createdBy: true,
        },
      }),
    ])

    return {
      data: projects.map((p) => this.mapToDomain(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async createProject(data: CreateProjectDto & { createdById: string }): Promise<Project> {
    const project = await this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        techStack: data.techStack || [],
        status: data.status as any,
        taskCreationPolicy: data.taskCreationPolicy as any,
        startDate: data.startDate ? new Date(data.startDate) : null,
        expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
        teamLeaderId: data.teamLeaderId,
        createdById: data.createdById,
      },
      include: {
        teamLeader: true,
        createdBy: true,
      },
    })
    return this.mapToDomain(project)
  }

  async updateProject(id: string, data: UpdateProjectDto): Promise<Project | null> {
    const updateData: Prisma.ProjectUpdateInput = {
      name: data.name,
      description: data.description,
      techStack: data.techStack,
      status: data.status as any,
      taskCreationPolicy: data.taskCreationPolicy as any,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : undefined,
      actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : undefined,
      teamLeaderId: data.teamLeaderId,
    }

    if (data.startDate === null) updateData.startDate = null
    if (data.expectedEndDate === null) updateData.expectedEndDate = null
    if (data.actualEndDate === null) updateData.actualEndDate = null
    if (data.teamLeaderId === null) updateData.teamLeaderId = null

    const project = await this.prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        teamLeader: true,
        createdBy: true,
      },
    })
    return this.mapToDomain(project)
  }

  async deleteProject(id: string): Promise<boolean> {
    await this.prisma.project.delete({
      where: { id },
    })
    return true
  }

  async addMember(projectId: string, employeeId: string): Promise<boolean> {
    await this.prisma.projectMember.upsert({
      where: {
        projectId_employeeId: { projectId, employeeId },
      },
      create: {
        projectId,
        employeeId,
      },
      update: {
        removedAt: null,
      },
    })
    return true
  }

  async removeMember(projectId: string, employeeId: string): Promise<boolean> {
    await this.prisma.projectMember.delete({
      where: {
        projectId_employeeId: { projectId, employeeId },
      },
    })
    return true
  }

  async isMember(projectId: string, employeeId: string): Promise<boolean> {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_employeeId: { projectId, employeeId },
      },
    })
    return member !== null && member.removedAt === null
  }

  async getMembers(projectId: string): Promise<any[]> {
    const members = await this.prisma.projectMember.findMany({
      where: { projectId, removedAt: null },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            position: true,
          },
        },
      },
    })
    return members.map((m) => m.employee)
  }
}