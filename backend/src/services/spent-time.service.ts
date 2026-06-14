import { ROLE } from "@/configs/entities/employee.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  CreateSpentTimeDto,
  IProjectRepository,
  ISpentTimeRepository,
  ISpentTimeService,
  ITaskRepository,
  SpentTime,
  SpentTimeQuery,
  UpdateSpentTimeDto,
} from "@/types"
import { AppError } from "@/utils/error.util.ts"

const LAYER_NAME = "SpentTimeService"

export class SpentTimeService implements ISpentTimeService {
  constructor(
    private repository: ISpentTimeRepository,
    private taskRepository: ITaskRepository,
    private projectRepository: IProjectRepository,
  ) {}

  /**
   * Checks if user has Admin or General Manager role
   */
  private isAuthorizedAdminOrGM(userRole: string): boolean {
    return userRole === ROLE.ADMIN || userRole === ROLE.GENERAL_MANAGER
  }

  /**
   * Retrieves a single spent time log with access control
   */
  async getSpentTime(id: string, userId: string, userRole: string): Promise<SpentTime | null> {
    const record = await this.repository.findById(id)
    if (!record) {
      throw new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    if (!this.isAuthorizedAdminOrGM(userRole) && record.employeeId !== userId) {
      // Check if user is Team Leader of the task's project
      const task = await this.taskRepository.findById(record.taskId)
      if (task) {
        const project = await this.projectRepository.findById(task.projectId)
        if (project && project.teamLeaderId === userId) {
          return record
        }
      }
      throw new AppError("Access denied", HttpStatusCode.FORBIDDEN, LAYER_NAME)
    }

    return record
  }

  /**
   * Lists spent time logs based on query with project-based access control
   */
  async listSpentTimes(query: SpentTimeQuery, userId: string, userRole: string): Promise<SpentTime[]> {
    if (!this.isAuthorizedAdminOrGM(userRole)) {
      if (query.projectId) {
        const project = await this.projectRepository.findById(query.projectId)
        if (!project) {
          throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
        }
        const isTL = project.teamLeaderId === userId
        const isMember = await this.projectRepository.isMember(query.projectId, userId)
        if (!isTL && !isMember) {
          throw new AppError("Access denied to this project's logs", HttpStatusCode.FORBIDDEN, LAYER_NAME)
        }
      } else if (query.taskId) {
        const task = await this.taskRepository.findById(query.taskId)
        if (!task) {
          throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
        }
        const project = await this.projectRepository.findById(task.projectId)
        if (!project) {
          throw new AppError("Associated project not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
        }
        const isTL = project.teamLeaderId === userId
        const isMember = await this.projectRepository.isMember(task.projectId, userId)
        if (!isTL && !isMember) {
          throw new AppError("Access denied to this task's logs", HttpStatusCode.FORBIDDEN, LAYER_NAME)
        }
      } else {
        // Non-admins listing without filtering by task/project are restricted to their own logs
        query.employeeId = userId
      }
    }

    return this.repository.list(query)
  }

  /**
   * Logs a new spent time entry
   */
  async createSpentTime(data: CreateSpentTimeDto, userId: string, userRole: string): Promise<SpentTime> {
    const task = await this.taskRepository.findById(data.taskId)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    // Standardize assignee/employee ID
    if (!this.isAuthorizedAdminOrGM(userRole)) {
      data.employeeId = userId

      // Check if user is member of the task's project
      const project = await this.projectRepository.findById(task.projectId)
      if (!project) {
        throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
      }
      const isTL = project.teamLeaderId === userId
      const isMember = await this.projectRepository.isMember(task.projectId, userId)
      if (!isTL && !isMember) {
        throw new AppError("Access denied to log time for this project", HttpStatusCode.FORBIDDEN, LAYER_NAME)
      }
    } else if (!data.employeeId) {
      data.employeeId = userId
    }

    return this.repository.create(data)
  }

  /**
   * Updates an existing spent time entry
   */
  async updateSpentTime(
    id: string,
    data: UpdateSpentTimeDto,
    userId: string,
    userRole: string,
  ): Promise<SpentTime | null> {
    const record = await this.repository.findById(id)
    if (!record) {
      throw new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    if (!this.isAuthorizedAdminOrGM(userRole) && record.employeeId !== userId) {
      throw new AppError("Access denied to update this log", HttpStatusCode.FORBIDDEN, LAYER_NAME)
    }

    return this.repository.update(id, data)
  }

  /**
   * Deletes a spent time entry
   */
  async deleteSpentTime(id: string, userId: string, userRole: string): Promise<boolean> {
    const record = await this.repository.findById(id)
    if (!record) {
      throw new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    if (!this.isAuthorizedAdminOrGM(userRole) && record.employeeId !== userId) {
      throw new AppError("Access denied to delete this log", HttpStatusCode.FORBIDDEN, LAYER_NAME)
    }

    return this.repository.delete(id)
  }
}
