import {
  ProjectTaskStatus,
  CreateProjectTaskStatusDto,
  UpdateProjectTaskStatusDto,
  IProjectTaskStatusRepository,
} from "@/types"
import { PrismaClient, ProjectTaskStatus as PrismaProjectTaskStatus } from "@prisma/client"
import { BaseRepository } from "./base.repository.ts"

export class ProjectTaskStatusRepository extends BaseRepository implements IProjectTaskStatusRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  private mapToDomain(status: PrismaProjectTaskStatus): ProjectTaskStatus {
    return {
      id: status.id,
      projectId: status.projectId,
      name: status.name,
      color: status.color,
      order: status.order,
      isDefault: status.isDefault,
      isCompleted: status.isCompleted,
      createdAt: status.createdAt,
      updatedAt: status.updatedAt,
    }
  }

  async findById(id: string): Promise<ProjectTaskStatus | null> {
    const status = await this.prisma.projectTaskStatus.findUnique({
      where: { id },
    })
    return status ? this.mapToDomain(status) : null
  }

  async findByProjectAndName(projectId: string, name: string): Promise<ProjectTaskStatus | null> {
    const status = await this.prisma.projectTaskStatus.findUnique({
      where: {
        projectId_name: {
          projectId,
          name,
        },
      },
    })
    return status ? this.mapToDomain(status) : null
  }

  async listByProjectId(projectId: string): Promise<ProjectTaskStatus[]> {
    const list = await this.prisma.projectTaskStatus.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    })
    return list.map(this.mapToDomain)
  }

  async create(data: CreateProjectTaskStatusDto): Promise<ProjectTaskStatus> {
    const status = await this.prisma.projectTaskStatus.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        color: data.color || "#A3A3A3",
        order: data.order ?? 0,
        isDefault: data.isDefault ?? false,
        isCompleted: data.isCompleted ?? false,
      },
    })
    return this.mapToDomain(status)
  }

  async update(id: string, data: UpdateProjectTaskStatusDto): Promise<ProjectTaskStatus | null> {
    const status = await this.prisma.projectTaskStatus.update({
      where: { id },
      data: {
        name: data.name,
        color: data.color,
        order: data.order,
        isDefault: data.isDefault,
        isCompleted: data.isCompleted,
      },
    })
    return this.mapToDomain(status)
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.projectTaskStatus.delete({
      where: { id },
    })
    return true
  }

  async findDefaultStatus(projectId: string): Promise<ProjectTaskStatus | null> {
    const status = await this.prisma.projectTaskStatus.findFirst({
      where: { projectId, isDefault: true },
    })
    return status ? this.mapToDomain(status) : null
  }

  async clearDefaultStatus(projectId: string): Promise<void> {
    await this.prisma.projectTaskStatus.updateMany({
      where: { projectId, isDefault: true },
      data: { isDefault: false },
    })
  }

  async getMaxOrder(projectId: string): Promise<number> {
    const aggregate = await this.prisma.projectTaskStatus.aggregate({
      where: { projectId },
      _max: {
        order: true,
      },
    })
    return aggregate._max.order ?? -1
  }
}
