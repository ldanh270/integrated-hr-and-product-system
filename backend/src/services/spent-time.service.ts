import { ROLE } from "@/configs/entities/employee.config.ts"
import {
  PROJECT_MEMBER_WORK_MODE,
  SPENT_TIME_STATUS,
  SPENT_TIME_WORK_TIME_TYPE,
} from "@/configs/entities/project.config.ts"
import { SPENT_TIME_RULES } from "@/configs/rules/project.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { IAttendanceRepository } from "@/types/attendance.types.ts"
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

/**
 * Part-time project workflow (Spent Time):
 * - PT logs hours on tasks → status pending → lead approves → payroll uses approved rows × hourlyRate.
 * - Remote PT: no GPS; onsite PT: must check-in once per day before logging (see validateBusinessRules).
 * - Full-time employees use weekly schedules + attendance; this service is the PT time source.
 */
export class SpentTimeService implements ISpentTimeService {
  constructor(
    private repository: ISpentTimeRepository,
    private taskRepository: ITaskRepository,
    private projectRepository: IProjectRepository,
    private attendanceRepository: IAttendanceRepository,
  ) {}

  private isAuthorizedAdminOrGM(userRole: string): boolean {
    return userRole === ROLE.ADMIN || userRole === ROLE.GENERAL_MANAGER
  }

  /** Ensures only project TL (or Admin/GM) can approve/reject Spent Time for that project. */
  private async assertProjectLeadAccess(
    projectId: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    if (this.isAuthorizedAdminOrGM(userRole)) return

    const project = await this.projectRepository.findById(projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }
    if (project.teamLeaderId !== userId) {
      throw new AppError("Access denied", HttpStatusCode.FORBIDDEN, LAYER_NAME)
    }
  }

  /** Validates estimate cap and onsite PT daily GPS check-in before create/update. */
  private async validateBusinessRules(
    taskId: string,
    employeeId: string,
    hours: number,
    date: Date | string,
    excludeId?: string,
  ): Promise<void> {
    const task = await this.taskRepository.findById(taskId)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    if (SPENT_TIME_RULES.ENFORCE_ESTIMATE_CAP && task.estimatedTime != null) {
      // Prevent unapproved overrun; lead can still reject if estimate was wrong.
      const currentTotal = await this.repository.sumTaskHours(taskId, excludeId)
      if (currentTotal + hours > task.estimatedTime) {
        throw new AppError(
          `Tổng giờ làm (${(currentTotal + hours).toFixed(1)}h) vượt ước tính (${task.estimatedTime}h)`,
          HttpStatusCode.UNPROCESSABLE_ENTITY,
          LAYER_NAME,
        )
      }
    }

    const member = await this.projectRepository.getMember(task.projectId, employeeId)
    if (member?.workMode === PROJECT_MEMBER_WORK_MODE.ONSITE) {
      // Onsite PT must GPS check-in once per day before logging hours (no GPS per SpentTime entry).
      const attendance = await this.attendanceRepository.findByEmployeeAndDate(employeeId, date)
      if (!attendance?.checkInAt) {
        throw new AppError(
          "Nhân viên onsite phải check-in trước khi ghi Spent Time",
          HttpStatusCode.UNPROCESSABLE_ENTITY,
          LAYER_NAME,
        )
      }
    }
  }

  /** Returns one log — employee sees own rows; project TL/Admin/GM see project queue entries. */
  async getSpentTime(id: string, userId: string, userRole: string): Promise<SpentTime | null> {
    const record = await this.repository.findById(id)
    if (!record) {
      throw new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    if (!this.isAuthorizedAdminOrGM(userRole) && record.employeeId !== userId) {
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

  /** Lists logs with project-based access control — non-admins scoped to member/TL projects. */
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
        query.employeeId = userId
      }
    }

    return this.repository.list(query)
  }

  /** Logs PT hours on a task — row starts pending; payroll picks up only after lead approval. */
  async createSpentTime(data: CreateSpentTimeDto, userId: string, userRole: string): Promise<SpentTime> {
    const task = await this.taskRepository.findById(data.taskId)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    if (!this.isAuthorizedAdminOrGM(userRole)) {
      data.employeeId = userId

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

    const employeeId = data.employeeId ?? userId
    await this.validateBusinessRules(data.taskId, employeeId, data.hours, data.date)

    // Repository persists status=pending; payroll only picks up after lead approval.
    return this.repository.create(data)
  }

  /** Updates a pending log — approved/rejected rows are locked (payroll audit trail). */
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

    if (record.status !== SPENT_TIME_STATUS.PENDING) {
      // Approved/rejected logs are payroll inputs — immutable after lead decision.
      throw new AppError("Chỉ có thể sửa log đang chờ duyệt", HttpStatusCode.CONFLICT, LAYER_NAME)
    }

    if (!this.isAuthorizedAdminOrGM(userRole) && record.employeeId !== userId) {
      throw new AppError("Access denied to update this log", HttpStatusCode.FORBIDDEN, LAYER_NAME)
    }

    const nextHours = data.hours ?? record.hours
    const nextDate = data.date ?? record.date
    await this.validateBusinessRules(record.taskId, record.employeeId, nextHours, nextDate, id)

    return this.repository.update(id, data)
  }

  /** Deletes a pending log only — approved/rejected rows cannot be removed. */
  async deleteSpentTime(id: string, userId: string, userRole: string): Promise<boolean> {
    const record = await this.repository.findById(id)
    if (!record) {
      throw new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    if (record.status !== SPENT_TIME_STATUS.PENDING) {
      // Approved/rejected logs are payroll inputs — immutable after lead decision.
      throw new AppError("Chỉ có thể xóa log đang chờ duyệt", HttpStatusCode.CONFLICT, LAYER_NAME)
    }

    if (!this.isAuthorizedAdminOrGM(userRole) && record.employeeId !== userId) {
      throw new AppError("Access denied to delete this log", HttpStatusCode.FORBIDDEN, LAYER_NAME)
    }

    return this.repository.delete(id)
  }

  /** Lead approves hours — row becomes eligible for PT payroll in the next run. */
  async approveSpentTime(id: string, userId: string, userRole: string): Promise<SpentTime> {
    // Only project TL / Admin / GM may approve — gates payroll-eligible hours.
    const record = await this.repository.findById(id)
    if (!record) {
      throw new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    const task = await this.taskRepository.findById(record.taskId)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    await this.assertProjectLeadAccess(task.projectId, userId, userRole)

    if (record.status !== SPENT_TIME_STATUS.PENDING) {
      throw new AppError("Log đã được xử lý", HttpStatusCode.CONFLICT, LAYER_NAME)
    }

    const updated = await this.repository.approve(id, userId)
    if (!updated) {
      throw new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }
    return updated
  }

  /** Lead rejects with reason — hours excluded from payroll and task spent totals. */
  async rejectSpentTime(
    id: string,
    reason: string,
    userId: string,
    userRole: string,
  ): Promise<SpentTime> {
    const record = await this.repository.findById(id)
    if (!record) {
      throw new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    const task = await this.taskRepository.findById(record.taskId)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    await this.assertProjectLeadAccess(task.projectId, userId, userRole)

    if (record.status !== SPENT_TIME_STATUS.PENDING) {
      throw new AppError("Log đã được xử lý", HttpStatusCode.CONFLICT, LAYER_NAME)
    }

    const updated = await this.repository.reject(id, userId, reason)
    if (!updated) {
      throw new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }
    return updated
  }
}
