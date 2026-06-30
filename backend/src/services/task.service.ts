import { SYSTEM_ROLE } from "@/configs/entities/employee.config.ts"
import { TASK_CREATION_POLICY, TASK_STATUS } from "@/configs/entities/project.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
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
} from "@/types"
import { AppError } from "@/utils/error.util.ts"
import { authorizationService } from "@/services/authorization.service.ts"

export class TaskService implements ITaskService {
  constructor(
    private repository: ITaskRepository,
    private projectRepository: IProjectRepository,
    private employeeRepository: IEmployeeRepository
  ) {}

  private async isAuthorizedAdminOrGM(userId: string): Promise<boolean> {
    const authContext = await authorizationService.getAuthorizationContext(userId)
    if (authContext.isDynamicAdmin) return true
    const roles = authContext.roles
    return roles.has(SYSTEM_ROLE.ADMIN) || roles.has(SYSTEM_ROLE.GENERAL_MANAGER)
  }

  /**
   * Retrieves a task with project-based access control
   * Admins/GMs can view any task
   * Others can only view if they are in the project (leader or member)
   * Throws error if task not found or user lacks access
   */
  async getTask(id: string, userId: string): Promise<Task | null> {
    const task = await this.repository.findById(id)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    // Check access permission to the project containing the task
    const isGlobalApprover = await this.isAuthorizedAdminOrGM(userId)
    if (!isGlobalApprover) {
      const project = await this.projectRepository.findById(task.projectId)
      if (!project) {
        throw new AppError("Associated project not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
      }

      const isTL = project.teamLeaderId === userId
      const isMember = await this.projectRepository.isMember(task.projectId, userId)

      if (!isTL && !isMember) {
        throw new AppError("Access denied to this project's tasks", HttpStatusCode.FORBIDDEN, ErrorLayer.SERVICE)
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
  async listTasks(query: TaskListQuery, userId: string): Promise<PaginatedTasksDto> {
    // If not GM/Admin, projectId is required and the user must belong to that project to view tasks
    const isGlobalApprover = await this.isAuthorizedAdminOrGM(userId)
    if (!isGlobalApprover) {
      if (!query.projectId) {
        throw new AppError(
          "Project ID is required to view tasks",
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.SERVICE
        )
      }

      const project = await this.projectRepository.findById(query.projectId)
      if (!project) {
        throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
      }

      const isTL = project.teamLeaderId === userId
      const isMember = await this.projectRepository.isMember(query.projectId, userId)

      if (!isTL && !isMember) {
        throw new AppError("Access denied to this project's tasks", HttpStatusCode.FORBIDDEN, ErrorLayer.SERVICE)
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
  async createTask(data: CreateTaskDto, userId: string): Promise<Task> {
    const project = await this.projectRepository.findById(data.projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    const isGM = await this.isAuthorizedAdminOrGM(userId)
    const isTL = project.teamLeaderId === userId

    // Apply the project's task creation policy
    if (!isGM && !isTL) {
      const isMember = await this.projectRepository.isMember(data.projectId, userId)
      if (!isMember) {
        throw new AppError("You are not a member of this project", HttpStatusCode.FORBIDDEN, ErrorLayer.SERVICE)
      }

      // Check policy
      if (project.taskCreationPolicy === TASK_CREATION_POLICY.LEADER_ONLY) {
        throw new AppError(
          "Only Team Leaders or Managers can create tasks in this project",
          HttpStatusCode.FORBIDDEN,
          ErrorLayer.SERVICE
        )
      }
    }

    //Constraint: The person assigned the task (Assignee) must belong to that project.
    if (data.assigneeId) {
      const assignee = await this.employeeRepository.findById(data.assigneeId)
      if (!assignee) {
        throw new AppError("Assignee employee not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
      }

      const assigneeIsTL = project.teamLeaderId === data.assigneeId
      const assigneeIsMember = await this.projectRepository.isMember(data.projectId, data.assigneeId)
      if (!assigneeIsTL && !assigneeIsMember) {
        throw new AppError(
          "Assignee must be a member or the leader of this project",
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.SERVICE
        )
      }
    }

    if (data.parentTaskId) {
      const parent = await this.repository.findById(data.parentTaskId)
      if (!parent) {
        throw new AppError("Parent task not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
      }
    }

    return this.repository.createTask({
      ...data,
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
    userId: string

  ): Promise<Task | null> {
    const task = await this.repository.findById(id)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    const project = await this.projectRepository.findById(task.projectId)
    if (!project) {
      throw new AppError("Associated project not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    const isGM = await this.isAuthorizedAdminOrGM(userId)
    const isTL = project.teamLeaderId === userId
    const isCreator = task.createdById === userId
    const isAssignee = task.assigneeId === userId

    // Update permissions: GM, Project Team Leader, Creator, or Assignee
    if (!isGM && !isTL && !isCreator && !isAssignee) {
      throw new AppError(
        "You do not have permission to update this task",
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE
      )
    }

    // Check if the new Assignee is part of the project.
    if (data.assigneeId) {
      const assignee = await this.employeeRepository.findById(data.assigneeId)
      if (!assignee) {
        throw new AppError("Assignee employee not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
      }

      const assigneeIsTL = project.teamLeaderId === data.assigneeId
      const assigneeIsMember = await this.projectRepository.isMember(task.projectId, data.assigneeId)
      if (!assigneeIsTL && !assigneeIsMember) {
        throw new AppError(
          "Assignee must be a member or the leader of this project",
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.SERVICE
        )
      }
    }

    if (data.parentTaskId) {
      const parent = await this.repository.findById(data.parentTaskId)
      if (!parent) {
        throw new AppError("Parent task not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
      }
      if (data.parentTaskId === id) {
        throw new AppError("A task cannot be its own parent", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE)
      }
    }

    // Validate status transitions and deliverables
    if (data.status && data.status !== task.status) {
      // 1. Enforce that only Team Leader or GM/Admin can approve task completion (status = done)
      if (data.status === TASK_STATUS.DONE) {
        if (!isGM && !isTL) {
          throw new AppError(
            "Chỉ Team Leader hoặc Manager mới có quyền phê duyệt hoàn thành công việc",
            HttpStatusCode.FORBIDDEN,
            ErrorLayer.SERVICE
          )
        }
      }

      // 2. Enforce deliverables when transitioning to in_review (waiting for review)
      if (data.status === TASK_STATUS.IN_REVIEW) {
        const hasResultUrl = data.resultUrl !== undefined ? !!data.resultUrl : !!task.resultUrl
        const hasResultNotes = data.resultNotes !== undefined ? !!data.resultNotes : !!task.resultNotes
        
        if (!hasResultUrl && !hasResultNotes) {
          throw new AppError(
            "Bắt buộc phải đính kèm link sản phẩm hoặc ghi chú kết quả khi gửi yêu cầu đánh giá công việc (in_review)",
            HttpStatusCode.BAD_REQUEST,
            ErrorLayer.SERVICE
          )
        }
      }
    }

    return this.repository.updateTask(id, data)
  }

  /**
   * Deletes a task
   * Only Admins, GMs, project team leader, or task creator can delete
   * Throws error if user lacks permission or task not found
   */
  async deleteTask(id: string, userId: string): Promise<boolean> {
    const task = await this.repository.findById(id)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    const project = await this.projectRepository.findById(task.projectId)
    if (!project) {
      throw new AppError("Associated project not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    const isGM = await this.isAuthorizedAdminOrGM(userId)
    const isTL = project.teamLeaderId === userId
    const isCreator = task.createdById === userId

    // Delete permissions: GM, Project Team Leader, or Creator
    if (!isGM && !isTL && !isCreator) {
      throw new AppError(
        "You do not have permission to delete this task",
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE
      )
    }

    return this.repository.deleteTask(id)
  }
}
