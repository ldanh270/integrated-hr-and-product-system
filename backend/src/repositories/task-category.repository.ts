import { CreateTaskCategoryDto, TaskCategory, ITaskCategoryRepository, UpdateTaskCategoryDto } from "@/types"
import { PrismaClient, TaskCategory as PrismaTaskCategory } from "@prisma/client"
import { BaseRepository } from "./base.repository.ts"

export class PrismaTaskCategoryRepository extends BaseRepository implements ITaskCategoryRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  private mapToDomain(category: PrismaTaskCategory): TaskCategory {
    return {
      id: category.id,
      projectId: category.projectId,
      name: category.name,
      createdAt: category.createdAt,
    }
  }

  async findByProject(projectId: string): Promise<TaskCategory[]> {
    const categories = await this.prisma.taskCategory.findMany({
      where: { projectId },
      orderBy: { name: "asc" },
    })
    return categories.map((c) => this.mapToDomain(c))
  }

  async findById(id: string): Promise<TaskCategory | null> {
    const category = await this.prisma.taskCategory.findUnique({
      where: { id },
    })
    return category ? this.mapToDomain(category) : null
  }

  async create(projectId: string, data: CreateTaskCategoryDto): Promise<TaskCategory> {
    const category = await this.prisma.taskCategory.create({
      data: {
        projectId,
        name: data.name,
      },
    })
    return this.mapToDomain(category)
  }

  async update(id: string, data: UpdateTaskCategoryDto): Promise<TaskCategory | null> {
    const category = await this.prisma.taskCategory.update({
      where: { id },
      data: {
        name: data.name,
      },
    })
    return this.mapToDomain(category)
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.taskCategory.delete({
      where: { id },
    })
    return true
  }
}
