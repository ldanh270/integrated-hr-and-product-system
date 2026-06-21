import {
  CreateProjectDto,
  Project,
  ProjectListQuery,
  IProjectRepository,
  PaginatedProjectsDto,
  UpdateProjectDto,
  GanttDataDto,
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

  /**
   * Maps Prisma project data to domain model
   * Transforms database representation to business logic representation
   */
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

  /**
   * Finds a project by its unique ID
   * Returns null if project does not exist
   */
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

  /**
   * Finds a project by its name
   * Returns null if no project with that name exists
   */
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

  /**
   * Lists projects with pagination and filtering
   * Applies role-based access control:
   * - Admins/GMs: see all projects
   * - Others: see only projects where they are leader or member
   * Supports filtering by status and search by name/description
   */
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

    // Project list visibility authorization
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

    // Filter by status
    if (status) {
      where.status = status as any
    }

    // Search by name or description
    if (search) {
      where.OR = [
        ...(where.OR || []),
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    // Retrieve paginated data
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

  /**
   * Creates a new project in the database
   * Initializes empty tech stack array if not provided
   */
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

  /**
   * Updates an existing project
   * Handles null values to allow clearing optional fields
   * Returns updated project or null if not found
   */
  async updateProject(id: string, data: UpdateProjectDto): Promise<Project | null> {
   const updateData: Prisma.ProjectUncheckedUpdateInput = {
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

  /**
   * Permanently deletes a project from the database
   * Returns true if successful
   */
  async deleteProject(id: string): Promise<boolean> {
    await this.prisma.project.delete({
      where: { id },
    })
    return true
  }

  /**
   * Adds an employee as a member to a project
   * Uses upsert to restore deleted members or create new ones
   * Returns true if successful
   */
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

  /**
   * Removes a member from a project
   * Permanently deletes the project member record
   * Returns true if successful
   */
  async removeMember(projectId: string, employeeId: string): Promise<boolean> {
    await this.prisma.projectMember.delete({
      where: {
        projectId_employeeId: { projectId, employeeId },
      },
    })
    return true
  }

  /**
   * Checks if an employee is an active member of a project
   * Active members have removedAt = null
   */
  async isMember(projectId: string, employeeId: string): Promise<boolean> {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_employeeId: { projectId, employeeId },
      },
    })
    return member !== null && member.removedAt === null
  }

  /**
   * Retrieves all active members of a project with their details
   * Only includes members with removedAt = null
   */
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
    return members.map((m) => ({
      id: `${m.projectId}_${m.employeeId}`,
      projectId: m.projectId,
      employeeId: m.employeeId,
      joinedAt: m.joinedAt,
      removedAt: m.removedAt,
      employee: m.employee,
    }))
  }

  /**
   * Retrieves tasks, members, and approved leave days for Gantt Chart visualization
   */
  async getGanttData(projectId: string): Promise<GanttDataDto> {
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            position: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    const members = await this.prisma.projectMember.findMany({
      where: { projectId, removedAt: null },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            position: true,
          },
        },
      },
    })

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { teamLeaderId: true },
    })

    // Collect all employee IDs of project members + team leader
    const employeeIds = members.map((m) => m.employeeId)
    if (project?.teamLeaderId && !employeeIds.includes(project.teamLeaderId)) {
      employeeIds.push(project.teamLeaderId)
    }

    // Get all approved leave applications for these employees
    const leaveDays = await this.prisma.application.findMany({
      where: {
        employeeId: { in: employeeIds },
        status: "approved",
        type: "leave",
      },
      select: {
        id: true,
        employeeId: true,
        startDate: true,
        endDate: true,
        reason: true,
      },
    })

    return {
      tasks,
      members: members.map((m) => m.employee),
      leaveDays,
    }
  }
}