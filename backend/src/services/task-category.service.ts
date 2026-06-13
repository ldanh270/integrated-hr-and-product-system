import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  CreateTaskCategoryDto,
  TaskCategory,
  ITaskCategoryRepository,
  IProjectRepository,
  ITaskCategoryService,
  UpdateTaskCategoryDto,
} from "@/types"
import { AppError } from "@/utils/error.util.ts"
import { ROLE } from "@/configs/entities/employee.config.ts"

const LAYER_NAME = "TaskCategoryService"

export class TaskCategoryService implements ITaskCategoryService {
  constructor(
    private repository: ITaskCategoryRepository,
    private projectRepository: IProjectRepository
  ) {}

  private isAuthorizedAdminOrGM(userRole: string): boolean {
    return userRole === ROLE.ADMIN || userRole === ROLE.GENERAL_MANAGER
  }

  private async checkProjectAccess(projectId: string, userId: string, userRole: string): Promise<any> {
    const project = await this.projectRepository.findById(projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    if (!this.isAuthorizedAdminOrGM(userRole)) {
      const isTL = project.teamLeaderId === userId
      const isMember = await this.projectRepository.isMember(projectId, userId)

      if (!isTL && !isMember) {
        throw new AppError("Access denied to this project's categories", HttpStatusCode.FORBIDDEN, LAYER_NAME)
      }
    }
    return project
  }

  private async checkProjectWriteAccess(projectId: string, userId: string, userRole: string): Promise<void> {
    const project = await this.projectRepository.findById(projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    if (!this.isAuthorizedAdminOrGM(userRole)) {
      const isTL = project.teamLeaderId === userId
      if (!isTL) {
        throw new AppError("Only Project Leaders or Managers can manage categories", HttpStatusCode.FORBIDDEN, LAYER_NAME)
      }
    }
  }

  async listByProject(projectId: string, userId: string, userRole: string): Promise<TaskCategory[]> {
    await this.checkProjectAccess(projectId, userId, userRole)
    return this.repository.findByProject(projectId)
  }

  async create(
    projectId: string,
    data: CreateTaskCategoryDto,
    userId: string,
    userRole: string
  ): Promise<TaskCategory> {
    await this.checkProjectWriteAccess(projectId, userId, userRole)

    // Enforce unique name per project
    const existing = await this.repository.findByProject(projectId)
    const duplicate = existing.find((c: TaskCategory) => c.name.toLowerCase() === data.name.toLowerCase())
    if (duplicate) {
      throw new AppError("Category name already exists in this project", HttpStatusCode.BAD_REQUEST, LAYER_NAME)
    }

    return this.repository.create(projectId, data)
  }

  async update(
    projectId: string,
    categoryId: string,
    data: UpdateTaskCategoryDto,
    userId: string,
    userRole: string
  ): Promise<TaskCategory> {
    await this.checkProjectWriteAccess(projectId, userId, userRole)

    const category = await this.repository.findById(categoryId)
    if (!category || category.projectId !== projectId) {
      throw new AppError("Category not found in this project", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    if (data.name) {
      const existing = await this.repository.findByProject(projectId)
      const duplicate = existing.find(
        (c: TaskCategory) => c.id !== categoryId && c.name.toLowerCase() === data.name!.toLowerCase()
      )
      if (duplicate) {
        throw new AppError("Category name already exists in this project", HttpStatusCode.BAD_REQUEST, LAYER_NAME)
      }
    }

    const updated = await this.repository.update(categoryId, data)
    if (!updated) {
      throw new AppError("Failed to update category", HttpStatusCode.INTERNAL_SERVER_ERROR, LAYER_NAME)
    }

    return updated
  }

  async delete(projectId: string, categoryId: string, userId: string, userRole: string): Promise<void> {
    await this.checkProjectWriteAccess(projectId, userId, userRole)

    const category = await this.repository.findById(categoryId)
    if (!category || category.projectId !== projectId) {
      throw new AppError("Category not found in this project", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    await this.repository.delete(categoryId)
  }
}
