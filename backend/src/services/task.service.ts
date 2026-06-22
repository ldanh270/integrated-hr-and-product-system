import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { TASK_STATUS } from "@/configs/entities/project.config.ts"
import {
  CreateTaskDto,
  Task,
  TaskListQuery,
  ITaskRepository,
  IProjectRepository,
  IEmployeeRepository,
  ITaskService,
  PaginatedTasksDto,
  UpdateTaskDto,
  IProjectTaskStatusRepository,
} from "@/types"
import { AppError } from "@/utils/error.util.ts"
import { ROLE } from "@/configs/entities/employee.config.ts"
import { mapStatusNameToEnum } from "@/utils/status-mapping.util.ts"

const LAYER_NAME = "TaskService"

export class TaskService implements ITaskService {
  constructor(
    private repository: ITaskRepository,
    private projectRepository: IProjectRepository,
    private employeeRepository: IEmployeeRepository,
    private statusRepository?: IProjectTaskStatusRepository
  ) {}

  /**
   * Checks if user has Admin or General Manager role
   */
  private isAuthorizedAdminOrGM(userRole: string): boolean {
    return userRole === ROLE.ADMIN || userRole === ROLE.GENERAL_MANAGER
  }

  /**
   * Retrieves a task with project-based access control
   * Admins/GMs can view any task
   * Others can only view if they are in the project (leader or member)
   * Throws error if task not found or user lacks access
   */
  async getTask(id: string, userId: string, userRole: string): Promise<Task | null> {
    const task = await this.repository.findById(id)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    // Check access permission to the project containing the task
    if (!this.isAuthorizedAdminOrGM(userRole)) {
      const project = await this.projectRepository.findById(task.projectId)
      if (!project) {
        throw new AppError("Associated project not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
      }

      const isTL = project.teamLeaderId === userId
      const isMember = await this.projectRepository.isMember(task.projectId, userId)

      if (!isTL && !isMember) {
        throw new AppError("Access denied to this project's tasks", HttpStatusCode.FORBIDDEN, LAYER_NAME)
      }
    }

    return task
  }

  /**
   * Lists tasks with project-based access control
   * Non-admins must provide projectId and be member/leader of that project
   * Admins can list tasks across all projects
   * Throws error if user lacks access to specified project
   */
  async listTasks(query: TaskListQuery, userId: string, userRole: string): Promise<PaginatedTasksDto> {
    // If not GM/Admin, projectId is required and the user must belong to that project to view tasks
    if (!this.isAuthorizedAdminOrGM(userRole)) {
      if (!query.projectId) {
        throw new AppError(
          "Project ID is required to view tasks",
          HttpStatusCode.BAD_REQUEST,
          LAYER_NAME
        )
      }

      const project = await this.projectRepository.findById(query.projectId)
      if (!project) {
        throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
      }

      const isTL = project.teamLeaderId === userId
      const isMember = await this.projectRepository.isMember(query.projectId, userId)

      if (!isTL && !isMember) {
        throw new AppError("Access denied to this project's tasks", HttpStatusCode.FORBIDDEN, LAYER_NAME)
      }
    }

    return this.repository.listTasks(query)
  }

  /**
   * Creates a new task in a project
   * Enforces project's task creation policy (leader_only or all_members)
   * Validates assignee is a member or leader of the project
   * Only Admins, GMs, project leaders, or members (if policy allows) can create
   * Throws error if user lacks permission or data is invalid
   */
  async createTask(data: CreateTaskDto, userId: string, userRole: string): Promise<Task> {
    const project = await this.projectRepository.findById(data.projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    const isGM = this.isAuthorizedAdminOrGM(userRole)
    const isTL = project.teamLeaderId === userId

    // Apply the project's task creation policy
    if (!isGM && !isTL) {
      const isMember = await this.projectRepository.isMember(data.projectId, userId)
      if (!isMember) {
        throw new AppError("You are not a member of this project", HttpStatusCode.FORBIDDEN, LAYER_NAME)
      }

      // Check policy
      if (project.taskCreationPolicy === "leader_only") {
        throw new AppError(
          "Only Team Leaders or Managers can create tasks in this project",
          HttpStatusCode.FORBIDDEN,
          LAYER_NAME
        )
      }
    }

    //Constraint: The person assigned the task (Assignee) must belong to that project.
    if (data.assigneeId) {
      const assignee = await this.employeeRepository.findById(data.assigneeId)
      if (!assignee) {
        throw new AppError("Assignee employee not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
      }

      const assigneeIsTL = project.teamLeaderId === data.assigneeId
      const assigneeIsMember = await this.projectRepository.isMember(data.projectId, data.assigneeId)
      if (!assigneeIsTL && !assigneeIsMember) {
        throw new AppError(
          "Assignee must be a member or the leader of this project",
          HttpStatusCode.BAD_REQUEST,
          LAYER_NAME
        )
      }
    }

    if (data.parentTaskId) {
      const parent = await this.repository.findById(data.parentTaskId)
      if (!parent) {
        throw new AppError("Parent task not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
      }
    }

    // Resolve dynamic status
    let statusId = data.statusId
    let statusEnum = data.status

    if (this.statusRepository) {
      if (statusId) {
        const customStatus = await this.statusRepository.findById(statusId)
        if (!customStatus || customStatus.projectId !== data.projectId) {
          throw new AppError("Invalid task status for this project", HttpStatusCode.BAD_REQUEST, LAYER_NAME)
        }
        statusEnum = mapStatusNameToEnum(customStatus.name, customStatus.isCompleted) as any
      } else {
        const defaultStatus = await this.statusRepository.findDefaultStatus(data.projectId)
        if (defaultStatus) {
          statusId = defaultStatus.id
          statusEnum = mapStatusNameToEnum(defaultStatus.name, defaultStatus.isCompleted) as any
        }
      }
    }

    return this.repository.createTask({
      ...data,
      status: statusEnum,
      statusId,
      createdById: userId,
    })
  }

  /**
   * Updates an existing task
   * Only Admins, GMs, project team leader, task creator, or assignee can update
   * Validates new assignee is a member or leader of the project
   * Throws error if user lacks permission or task not found
   */
  async updateTask(
    id: string,
    data: UpdateTaskDto,
    userId: string,
    userRole: string
  ): Promise<Task | null> {
    const task = await this.repository.findById(id)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    const project = await this.projectRepository.findById(task.projectId)
    if (!project) {
      throw new AppError("Associated project not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    const isGM = this.isAuthorizedAdminOrGM(userRole)
    const isTL = project.teamLeaderId === userId
    const isCreator = task.createdById === userId
    const isAssignee = task.assigneeId === userId

    // Update permissions: GM, Project Team Leader, Creator, or Assignee
    if (!isGM && !isTL && !isCreator && !isAssignee) {
      throw new AppError(
        "You do not have permission to update this task",
        HttpStatusCode.FORBIDDEN,
        LAYER_NAME
      )
    }

    // Check if the new Assignee is part of the project.
    if (data.assigneeId) {
      const assignee = await this.employeeRepository.findById(data.assigneeId)
      if (!assignee) {
        throw new AppError("Assignee employee not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
      }

      const assigneeIsTL = project.teamLeaderId === data.assigneeId
      const assigneeIsMember = await this.projectRepository.isMember(task.projectId, data.assigneeId)
      if (!assigneeIsTL && !assigneeIsMember) {
        throw new AppError(
          "Assignee must be a member or the leader of this project",
          HttpStatusCode.BAD_REQUEST,
          LAYER_NAME
        )
      }
    }

    if (data.parentTaskId) {
      const parent = await this.repository.findById(data.parentTaskId)
      if (!parent) {
        throw new AppError("Parent task not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
      }
      if (data.parentTaskId === id) {
        throw new AppError("A task cannot be its own parent", HttpStatusCode.BAD_REQUEST, LAYER_NAME)
      }
    }

    // Resolve dynamic status updates and permissions
    let statusId = data.statusId
    let statusEnum = data.status

    if (this.statusRepository && statusId !== undefined && statusId !== task.statusId) {
      if (statusId === null) {
        // Keep statusEnum as undefined or legacy status unchanged
      } else {
        const customStatus = await this.statusRepository.findById(statusId)
        if (!customStatus || customStatus.projectId !== task.projectId) {
          throw new AppError("Invalid task status for this project", HttpStatusCode.BAD_REQUEST, LAYER_NAME)
        }
        statusEnum = mapStatusNameToEnum(customStatus.name, customStatus.isCompleted) as any

        const employee = await this.employeeRepository.findById(userId)
        const isTester = employee?.position?.toLowerCase() === "tester"

        let currentIsCompleted = false
        if (task.statusId) {
          const currentStatus = await this.statusRepository.findById(task.statusId)
          if (currentStatus) {
            currentIsCompleted = currentStatus.isCompleted
          }
        } else {
          currentIsCompleted = task.status === TASK_STATUS.DONE || task.status === TASK_STATUS.CANCELLED
        }

        if (customStatus.isCompleted !== currentIsCompleted) {
          if (!isGM && !isTL && !isTester) {
            const actionText = customStatus.isCompleted ? "hoàn thành" : "mở lại/di chuyển"
            throw new AppError(
              `Chỉ Team Leader, Manager hoặc Tester mới có quyền ${actionText} công việc này.`,
              HttpStatusCode.FORBIDDEN,
              LAYER_NAME
            )
          }
        }
      }
    }

    // Validate status transitions and deliverables
    if (statusEnum && statusEnum !== task.status) {
      // 1. Enforce that only Team Leader or GM/Admin can approve task completion (status = done)
      if (statusEnum === TASK_STATUS.DONE) {
        const employee = await this.employeeRepository.findById(userId)
        const isTester = employee?.position?.toLowerCase() === "tester"
        if (!isGM && !isTL && !isTester) {
          throw new AppError(
            "Chỉ Team Leader hoặc Manager mới có quyền phê duyệt hoàn thành công việc",
            HttpStatusCode.FORBIDDEN,
            LAYER_NAME
          )
        }
      }

      // 2. Enforce deliverables when transitioning to in_review (waiting for review)
      if (statusEnum === TASK_STATUS.IN_REVIEW) {
        const hasResultUrl = data.resultUrl !== undefined ? !!data.resultUrl : !!task.resultUrl
        const hasResultNotes = data.resultNotes !== undefined ? !!data.resultNotes : !!task.resultNotes
        
        if (!hasResultUrl && !hasResultNotes) {
          throw new AppError(
            "Bắt buộc phải đính kèm link sản phẩm hoặc ghi chú kết quả khi gửi yêu cầu đánh giá công việc (in_review)",
            HttpStatusCode.BAD_REQUEST,
            LAYER_NAME
          )
        }
      }
    }

    return this.repository.updateTask(id, {
      ...data,
      status: statusEnum,
      statusId,
    })
  }

  /**
   * Deletes a task
   * Only Admins, GMs, project team leader, or task creator can delete
   * Throws error if user lacks permission or task not found
   */
  async deleteTask(id: string, userId: string, userRole: string): Promise<boolean> {
    const task = await this.repository.findById(id)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    const project = await this.projectRepository.findById(task.projectId)
    if (!project) {
      throw new AppError("Associated project not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    const isGM = this.isAuthorizedAdminOrGM(userRole)
    const isTL = project.teamLeaderId === userId
    const isCreator = task.createdById === userId

    // Delete permissions: GM, Project Team Leader, or Creator
    if (!isGM && !isTL && !isCreator) {
      throw new AppError(
        "You do not have permission to delete this task",
        HttpStatusCode.FORBIDDEN,
        LAYER_NAME
      )
    }

    return this.repository.deleteTask(id)
  }
}