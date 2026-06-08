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

export class TaskService implements ITaskService {
  constructor(
    private repository: ITaskRepository,
    private projectRepository: IProjectRepository,
    private employeeRepository: IEmployeeRepository
  ) {}

  private isAuthorizedAdminOrGM(userRole: string): boolean {
    return userRole === "admin" || userRole === "general_manager"
  }

  async getTask(id: string, userId: string, userRole: string): Promise<Task | null> {
    const task = await this.repository.findById(id)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, "TaskService")
    }

    // Kiểm tra quyền truy cập dự án chứa task
    if (!this.isAuthorizedAdminOrGM(userRole)) {
      const project = await this.projectRepository.findById(task.projectId)
      if (!project) {
        throw new AppError("Associated project not found", HttpStatusCode.NOT_FOUND, "TaskService")
      }

      const isTL = project.teamLeaderId === userId
      const isMember = await this.projectRepository.isMember(task.projectId, userId)

      if (!isTL && !isMember) {
        throw new AppError("Access denied to this project's tasks", HttpStatusCode.FORBIDDEN, "TaskService")
      }
    }

    return task
  }

  async listTasks(query: TaskListQuery, userId: string, userRole: string): Promise<PaginatedTasksDto> {
    // Nếu không phải GM/Admin, bắt buộc phải truyền projectId và phải thuộc dự án đó mới được xem tasks
    if (!this.isAuthorizedAdminOrGM(userRole)) {
      if (!query.projectId) {
        throw new AppError(
          "Project ID is required to view tasks",
          HttpStatusCode.BAD_REQUEST,
          "TaskService"
        )
      }

      const project = await this.projectRepository.findById(query.projectId)
      if (!project) {
        throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "TaskService")
      }

      const isTL = project.teamLeaderId === userId
      const isMember = await this.projectRepository.isMember(query.projectId, userId)

      if (!isTL && !isMember) {
        throw new AppError("Access denied to this project's tasks", HttpStatusCode.FORBIDDEN, "TaskService")
      }
    }

    return this.repository.listTasks(query)
  }

  async createTask(data: CreateTaskDto, userId: string, userRole: string): Promise<Task> {
    const project = await this.projectRepository.findById(data.projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "TaskService")
    }

    const isGM = this.isAuthorizedAdminOrGM(userRole)
    const isTL = project.teamLeaderId === userId

    // Áp dụng taskCreationPolicy của dự án
    if (!isGM && !isTL) {
      const isMember = await this.projectRepository.isMember(data.projectId, userId)
      if (!isMember) {
        throw new AppError("You are not a member of this project", HttpStatusCode.FORBIDDEN, "TaskService")
      }

      // Check policy
      if (project.taskCreationPolicy === "leader_only") {
        throw new AppError(
          "Only Team Leaders or Managers can create tasks in this project",
          HttpStatusCode.FORBIDDEN,
          "TaskService"
        )
      }
    }

    // Ràng buộc: Người được gán task (Assignee) phải thuộc dự án đó
    if (data.assigneeId) {
      const assignee = await this.employeeRepository.findById(data.assigneeId)
      if (!assignee) {
        throw new AppError("Assignee employee not found", HttpStatusCode.NOT_FOUND, "TaskService")
      }

      const assigneeIsTL = project.teamLeaderId === data.assigneeId
      const assigneeIsMember = await this.projectRepository.isMember(data.projectId, data.assigneeId)
      if (!assigneeIsTL && !assigneeIsMember) {
        throw new AppError(
          "Assignee must be a member or the leader of this project",
          HttpStatusCode.BAD_REQUEST,
          "TaskService"
        )
      }
    }

    return this.repository.createTask({
      ...data,
      createdById: userId,
    })
  }

  async updateTask(
    id: string,
    data: UpdateTaskDto,
    userId: string,
    userRole: string
  ): Promise<Task | null> {
    const task = await this.repository.findById(id)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, "TaskService")
    }

    const project = await this.projectRepository.findById(task.projectId)
    if (!project) {
      throw new AppError("Associated project not found", HttpStatusCode.NOT_FOUND, "TaskService")
    }

    const isGM = this.isAuthorizedAdminOrGM(userRole)
    const isTL = project.teamLeaderId === userId
    const isCreator = task.createdById === userId
    const isAssignee = task.assigneeId === userId

    // Quyền cập nhật: GM, TL dự án, Người tạo, hoặc Người được gán
    if (!isGM && !isTL && !isCreator && !isAssignee) {
      throw new AppError(
        "You do not have permission to update this task",
        HttpStatusCode.FORBIDDEN,
        "TaskService"
      )
    }

    // Kiểm tra Assignee mới có thuộc dự án không
    if (data.assigneeId) {
      const assignee = await this.employeeRepository.findById(data.assigneeId)
      if (!assignee) {
        throw new AppError("Assignee employee not found", HttpStatusCode.NOT_FOUND, "TaskService")
      }

      const assigneeIsTL = project.teamLeaderId === data.assigneeId
      const assigneeIsMember = await this.projectRepository.isMember(task.projectId, data.assigneeId)
      if (!assigneeIsTL && !assigneeIsMember) {
        throw new AppError(
          "Assignee must be a member or the leader of this project",
          HttpStatusCode.BAD_REQUEST,
          "TaskService"
        )
      }
    }

    return this.repository.updateTask(id, data)
  }

  async deleteTask(id: string, userId: string, userRole: string): Promise<boolean> {
    const task = await this.repository.findById(id)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, "TaskService")
    }

    const project = await this.projectRepository.findById(task.projectId)
    if (!project) {
      throw new AppError("Associated project not found", HttpStatusCode.NOT_FOUND, "TaskService")
    }

    const isGM = this.isAuthorizedAdminOrGM(userRole)
    const isTL = project.teamLeaderId === userId
    const isCreator = task.createdById === userId

    // Quyền xóa: Chỉ GM, TL dự án, hoặc Người tạo task
    if (!isGM && !isTL && !isCreator) {
      throw new AppError(
        "You do not have permission to delete this task",
        HttpStatusCode.FORBIDDEN,
        "TaskService"
      )
    }

    return this.repository.deleteTask(id)
  }
}