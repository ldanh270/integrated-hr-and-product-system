// Import shared type definitions for creating, updating, and representing task categories, and repository interface
import { CreateTaskCategoryDto, TaskCategory, ITaskCategoryRepository, UpdateTaskCategoryDto } from "@/types"
// Import Prisma client and Prisma task category model definition
import { PrismaClient, TaskCategory as PrismaTaskCategory } from "@prisma/client"
// Import the base repository class which contains the shared Prisma client instance
import { BaseRepository } from "./base.repository.ts"
// Import database sorting configuration
import { SORT_ORDER } from "@/configs/system/db.config.ts"

// Repository class implementation for task categories using Prisma ORM
export class PrismaTaskCategoryRepository extends BaseRepository implements ITaskCategoryRepository {
  // Pass the PrismaClient instance to the parent BaseRepository constructor
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  // Private helper to map a database-specific Prisma model to a clean domain-specific task category type
  private mapToDomain(category: PrismaTaskCategory): TaskCategory {
    return {
      id: category.id,
      projectId: category.projectId,
      name: category.name,
      createdAt: category.createdAt,
    }
  }

  // Retrieve all task categories under a specific project, ordered alphabetically by name
  async findByProject(projectId: string): Promise<TaskCategory[]> {
    const categories = await this.prisma.taskCategory.findMany({
      where: { projectId },
      orderBy: { name: SORT_ORDER.ASC },
    })
    // Map the database entities to domain entities and return the list
    return categories.map((c) => this.mapToDomain(c))
  }

  // Find a specific task category by its unique ID
  async findById(id: string): Promise<TaskCategory | null> {
    const category = await this.prisma.taskCategory.findUnique({
      where: { id },
    })
    // Return mapped domain entity if found, otherwise return null
    return category ? this.mapToDomain(category) : null
  }

  // Create a new task category associated with a specific project
  async create(projectId: string, data: CreateTaskCategoryDto): Promise<TaskCategory> {
    const category = await this.prisma.taskCategory.create({
      data: {
        projectId,
        name: data.name,
      },
    })
    // Return the mapped newly created domain entity
    return this.mapToDomain(category)
  }

  // Update properties of an existing task category by its ID
  async update(id: string, data: UpdateTaskCategoryDto): Promise<TaskCategory | null> {
    const category = await this.prisma.taskCategory.update({
      where: { id },
      data: {
        name: data.name,
      },
    })
    // Return the mapped updated domain entity
    return this.mapToDomain(category)
  }

  // Remove a task category from the database by its ID
  async delete(id: string): Promise<boolean> {
    await this.prisma.taskCategory.delete({
      where: { id },
    })
    // Return true indicating successful deletion
    return true
  }
}

