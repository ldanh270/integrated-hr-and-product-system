import {
  ProjectRole,
  CreateProjectRoleDto,
  UpdateProjectRoleDto,
  IProjectRoleRepository,
} from "@/types"
import { PrismaClient, ProjectRole as PrismaProjectRole } from "@prisma/client"
import { BaseRepository } from "./base.repository.ts"

export class ProjectRoleRepository extends BaseRepository implements IProjectRoleRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  private mapToDomain(role: PrismaProjectRole): ProjectRole {
    return {
      id: role.id,
      projectId: role.projectId,
      name: role.name,
      code: role.code,
      allowedTaskTrackers: role.allowedTaskTrackers,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }
  }

  async list(projectId: string): Promise<ProjectRole[]> {
    const list = await this.prisma.projectRole.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    })
    return list.map(r => this.mapToDomain(r))
  }

  async findById(id: string): Promise<ProjectRole | null> {
    const role = await this.prisma.projectRole.findUnique({
      where: { id },
    })
    return role ? this.mapToDomain(role) : null
  }

  async findByCode(projectId: string, code: string): Promise<ProjectRole | null> {
    const role = await this.prisma.projectRole.findUnique({
      where: {
        projectId_code: {
          projectId,
          code,
        },
      },
    })
    return role ? this.mapToDomain(role) : null
  }

  async create(projectId: string, data: CreateProjectRoleDto & { code: string }): Promise<ProjectRole> {
    const role = await this.prisma.projectRole.create({
      data: {
        projectId,
        name: data.name,
        code: data.code,
        allowedTaskTrackers: data.allowedTaskTrackers || [],
      },
    })
    return this.mapToDomain(role)
  }

  async update(id: string, data: UpdateProjectRoleDto & { code?: string }): Promise<ProjectRole | null> {
    const role = await this.prisma.projectRole.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        allowedTaskTrackers: data.allowedTaskTrackers,
      },
    })
    return this.mapToDomain(role)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.projectRole.delete({
      where: { id },
    })
  }

  async createMany(projectId: string, roles: Array<{ name: string; code: string; allowedTaskTrackers: string[] }>): Promise<void> {
    await this.prisma.projectRole.createMany({
      data: roles.map(r => ({
        projectId,
        name: r.name,
        code: r.code,
        allowedTaskTrackers: r.allowedTaskTrackers,
      })),
    })
  }
}
