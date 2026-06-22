import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { ROLE } from "@/configs/entities/employee.config.ts"
import { DEFAULT_PROJECT_TASK_STATUSES } from "@/configs/entities/project.config.ts"
import {
  ProjectTaskStatus,
  CreateProjectTaskStatusDto,
  UpdateProjectTaskStatusDto,
  IProjectTaskStatusRepository,
  IProjectRepository,
  ITaskRepository,
  IProjectTaskStatusService,
} from "@/types"
import { AppError } from "@/utils/error.util.ts"
import { mapStatusNameToEnum } from "@/utils/status-mapping.util.ts"

const LAYER_NAME = "ProjectTaskStatusService"

export class ProjectTaskStatusService implements IProjectTaskStatusService {
  constructor(
    private repository: IProjectTaskStatusRepository,
    private projectRepository: IProjectRepository,
    private taskRepository: ITaskRepository
  ) {}

  private isAuthorizedAdminOrGM(userRole: string): boolean {
    return userRole === ROLE.ADMIN || userRole === ROLE.GENERAL_MANAGER
  }

  private async checkProjectAccess(projectId: string, userId: string, userRole: string, writeAccess = false): Promise<void> {
    if (this.isAuthorizedAdminOrGM(userRole)) {
      return
    }

    const project = await this.projectRepository.findById(projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    const isTL = project.teamLeaderId === userId
    if (writeAccess) {
      if (!isTL) {
        throw new AppError("Access denied. Only Team Leaders or Managers can modify project statuses.", HttpStatusCode.FORBIDDEN, LAYER_NAME)
      }
    } else {
      const isMember = await this.projectRepository.isMember(projectId, userId)
      if (!isTL && !isMember) {
        throw new AppError("Access denied to this project's statuses.", HttpStatusCode.FORBIDDEN, LAYER_NAME)
      }
    }
  }

  async getStatus(id: string, userId: string, userRole: string): Promise<ProjectTaskStatus | null> {
    const status = await this.repository.findById(id)
    if (!status) {
      throw new AppError("Status not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }
    await this.checkProjectAccess(status.projectId, userId, userRole)
    return status
  }

  async listStatuses(projectId: string, userId: string, userRole: string): Promise<ProjectTaskStatus[]> {
    await this.checkProjectAccess(projectId, userId, userRole)
    return this.repository.listByProjectId(projectId)
  }

  async createStatus(data: CreateProjectTaskStatusDto, userId: string, userRole: string): Promise<ProjectTaskStatus> {
    await this.checkProjectAccess(data.projectId, userId, userRole, true)

    const existing = await this.repository.findByProjectAndName(data.projectId, data.name)
    if (existing) {
      throw new AppError("Status name already exists in this project", HttpStatusCode.CONFLICT, LAYER_NAME)
    }

    if (data.order === undefined) {
      const maxOrder = await this.repository.getMaxOrder(data.projectId)
      data.order = maxOrder + 1
    }

    if (data.isDefault) {
      await this.repository.clearDefaultStatus(data.projectId)
    } else {
      const list = await this.repository.listByProjectId(data.projectId)
      if (list.length === 0) {
        data.isDefault = true
      }
    }

    return this.repository.create(data)
  }

  async updateStatus(id: string, data: UpdateProjectTaskStatusDto, userId: string, userRole: string): Promise<ProjectTaskStatus | null> {
    const status = await this.repository.findById(id)
    if (!status) {
      throw new AppError("Status not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }
    await this.checkProjectAccess(status.projectId, userId, userRole, true)

    if (data.name && data.name !== status.name) {
      const existing = await this.repository.findByProjectAndName(status.projectId, data.name)
      if (existing) {
        throw new AppError("Status name already exists in this project", HttpStatusCode.CONFLICT, LAYER_NAME)
      }
    }

    if (data.isDefault) {
      await this.repository.clearDefaultStatus(status.projectId)
    } else if (data.isDefault === false && status.isDefault) {
      throw new AppError("Cannot unset default status. Please set another status as default instead.", HttpStatusCode.BAD_REQUEST, LAYER_NAME)
    }

    const updated = await this.repository.update(id, data)

    if (updated && (data.name !== undefined || data.isCompleted !== undefined)) {
      const legacyEnumStatus = mapStatusNameToEnum(updated.name, updated.isCompleted)
      await this.taskRepository.syncLegacyStatus(updated.id, legacyEnumStatus)
    }

    return updated
  }

  async deleteStatus(id: string, fallbackStatusId: string | undefined, userId: string, userRole: string): Promise<boolean> {
    const status = await this.repository.findById(id)
    if (!status) {
      throw new AppError("Status not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }
    await this.checkProjectAccess(status.projectId, userId, userRole, true)

    if (status.isDefault) {
      throw new AppError("Cannot delete the default status. Please set another status as default first.", HttpStatusCode.BAD_REQUEST, LAYER_NAME)
    }

    const list = await this.repository.listByProjectId(status.projectId)
    if (list.length <= 1) {
      throw new AppError("Cannot delete the only status in the project.", HttpStatusCode.BAD_REQUEST, LAYER_NAME)
    }

    if (fallbackStatusId) {
      if (fallbackStatusId === id) {
        throw new AppError("Fallback status cannot be the same as the status being deleted.", HttpStatusCode.BAD_REQUEST, LAYER_NAME)
      }
      const fallback = await this.repository.findById(fallbackStatusId)
      if (!fallback || fallback.projectId !== status.projectId) {
        throw new AppError("Fallback status not found or belongs to another project.", HttpStatusCode.BAD_REQUEST, LAYER_NAME)
      }
      await this.taskRepository.updateTasksStatusId(status.projectId, id, fallbackStatusId)
      const legacyEnum = mapStatusNameToEnum(fallback.name, fallback.isCompleted)
      await this.taskRepository.syncLegacyStatus(fallbackStatusId, legacyEnum as ReturnType<typeof mapStatusNameToEnum>)
    } else {
      await this.taskRepository.updateTasksStatusId(status.projectId, id, null)
    }

    return this.repository.delete(id)
  }

  async createDefaultStatuses(projectId: string): Promise<ProjectTaskStatus[]> {
    const created: ProjectTaskStatus[] = []
    for (const item of DEFAULT_PROJECT_TASK_STATUSES) {
      const status = await this.repository.create({
        projectId,
        name: item.name,
        color: item.color,
        order: item.order,
        isDefault: item.isDefault,
        isCompleted: item.isCompleted,
      })
      created.push(status)
    }
    return created
  }
}
