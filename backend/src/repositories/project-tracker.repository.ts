import {
  ProjectTracker,
  CreateProjectTrackerDto,
  UpdateProjectTrackerDto,
  IProjectTrackerRepository,
} from "@/types"
import { PrismaClient, ProjectTracker as PrismaProjectTracker } from "@prisma/client"
import { BaseRepository } from "./base.repository.ts"

export class ProjectTrackerRepository extends BaseRepository implements IProjectTrackerRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  private mapToDomain(tracker: PrismaProjectTracker): ProjectTracker {
    return {
      id: tracker.id,
      projectId: tracker.projectId,
      name: tracker.name,
      code: tracker.code,
      isActive: tracker.isActive,
      createdAt: tracker.createdAt,
      updatedAt: tracker.updatedAt,
    }
  }

  async list(projectId: string): Promise<ProjectTracker[]> {
    const list = await this.prisma.projectTracker.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    })
    return list.map(t => this.mapToDomain(t))
  }

  async findById(id: string): Promise<ProjectTracker | null> {
    const tracker = await this.prisma.projectTracker.findUnique({
      where: { id },
    })
    return tracker ? this.mapToDomain(tracker) : null
  }

  async create(projectId: string, data: CreateProjectTrackerDto & { code: string }): Promise<ProjectTracker> {
    const tracker = await this.prisma.projectTracker.create({
      data: {
        projectId,
        name: data.name,
        code: data.code,
        isActive: data.isActive ?? true,
      },
    })
    return this.mapToDomain(tracker)
  }

  async update(id: string, data: UpdateProjectTrackerDto & { code?: string }): Promise<ProjectTracker | null> {
    const tracker = await this.prisma.projectTracker.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        isActive: data.isActive,
      },
    })
    return this.mapToDomain(tracker)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.projectTracker.delete({
      where: { id },
    })
  }

  async createMany(projectId: string, trackers: Array<{ name: string; code: string; isActive: boolean }>): Promise<void> {
    await this.prisma.projectTracker.createMany({
      data: trackers.map(t => ({
        projectId,
        name: t.name,
        code: t.code,
        isActive: t.isActive,
      })),
    })
  }
}
