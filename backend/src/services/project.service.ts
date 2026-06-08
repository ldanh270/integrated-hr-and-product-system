import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  CreateProjectDto,
  Project,
  ProjectListQuery,
  IProjectRepository,
  IEmployeeRepository,
  IProjectService,
  PaginatedProjectsDto,
  UpdateProjectDto,
} from "@/types"
import { AppError } from "@/utils/error.util.ts"

export class ProjectService implements IProjectService {
  constructor(
    private repository: IProjectRepository,
    private employeeRepository: IEmployeeRepository
  ) {}

  private isAuthorizedAdminOrGM(userRole: string): boolean {
    return userRole === "admin" || userRole === "general_manager"
  }

  async getProject(id: string, userId: string, userRole: string): Promise<Project | null> {
    const project = await this.repository.findById(id)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    // Phân quyền: GM/Admin xem hết. TL hoặc Employee chỉ xem được nếu là leader hoặc member của dự án đó
    if (!this.isAuthorizedAdminOrGM(userRole)) {
      const isTL = project.teamLeaderId === userId
      const isMember = await this.repository.isMember(id, userId)
      if (!isTL && !isMember) {
        throw new AppError("Access denied", HttpStatusCode.FORBIDDEN, "ProjectService")
      }
    }

    return project
  }

  async listProjects(
    query: ProjectListQuery,
    userId: string,
    userRole: string
  ): Promise<PaginatedProjectsDto> {
    return this.repository.listProjects(query, userId, userRole)
  }

  async createProject(data: CreateProjectDto, userId: string, userRole: string): Promise<Project> {
    // Chỉ GM và Admin mới được tạo dự án
    if (!this.isAuthorizedAdminOrGM(userRole)) {
      throw new AppError(
        "Only General Managers or Admins can create projects",
        HttpStatusCode.FORBIDDEN,
        "ProjectService"
      )
    }

    // Kiểm tra Team Leader có tồn tại không
    if (data.teamLeaderId) {
      const leader = await this.employeeRepository.findById(data.teamLeaderId)
      if (!leader) {
        throw new AppError("Team Leader employee not found", HttpStatusCode.NOT_FOUND, "ProjectService")
      }
    }

    // Kiểm tra tên dự án trùng lặp
    const existing = await this.repository.findByName(data.name)
    if (existing) {
      throw new AppError("Project name already exists", HttpStatusCode.CONFLICT, "ProjectService")
    }

    return this.repository.createProject({
      ...data,
      createdById: userId,
    })
  }

  async updateProject(
    id: string,
    data: UpdateProjectDto,
    userId: string,
    userRole: string
  ): Promise<Project | null> {
    const project = await this.repository.findById(id)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    // Chỉ GM/Admin hoặc Team Leader của dự án đó mới được cập nhật
    const isTL = project.teamLeaderId === userId
    if (!this.isAuthorizedAdminOrGM(userRole) && !isTL) {
      throw new AppError(
        "Only Admins, GMs, or the Project's Team Leader can update this project",
        HttpStatusCode.FORBIDDEN,
        "ProjectService"
      )
    }

    // Kiểm tra Team Leader mới có tồn tại không
    if (data.teamLeaderId) {
      const leader = await this.employeeRepository.findById(data.teamLeaderId)
      if (!leader) {
        throw new AppError("Team Leader employee not found", HttpStatusCode.NOT_FOUND, "ProjectService")
      }
    }

    // Kiểm tra tên trùng nếu đổi tên dự án
    if (data.name && data.name !== project.name) {
      const existing = await this.repository.findByName(data.name)
      if (existing) {
        throw new AppError("Project name already exists", HttpStatusCode.CONFLICT, "ProjectService")
      }
    }

    return this.repository.updateProject(id, data)
  }

  async deleteProject(id: string, userId: string, userRole: string): Promise<boolean> {
    // Chỉ GM/Admin mới được xóa dự án
    if (!this.isAuthorizedAdminOrGM(userRole)) {
      throw new AppError(
        "Only General Managers or Admins can delete projects",
        HttpStatusCode.FORBIDDEN,
        "ProjectService"
      )
    }

    const project = await this.repository.findById(id)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    return this.repository.deleteProject(id)
  }

  async addMember(
    projectId: string,
    employeeId: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    const project = await this.repository.findById(projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    // Chỉ GM/Admin hoặc Team Leader của dự án mới được quản lý thành viên
    const isTL = project.teamLeaderId === userId
    if (!this.isAuthorizedAdminOrGM(userRole) && !isTL) {
      throw new AppError(
        "Only Admins, GMs, or the Project's Team Leader can manage members",
        HttpStatusCode.FORBIDDEN,
        "ProjectService"
      )
    }

    // Kiểm tra nhân viên cần thêm có tồn tại không
    const employee = await this.employeeRepository.findById(employeeId)
    if (!employee) {
      throw new AppError("Employee not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    // Kiểm tra xem đã là thành viên dự án chưa
    const alreadyMember = await this.repository.isMember(projectId, employeeId)
    if (alreadyMember) {
      throw new AppError("Employee is already a member of this project", HttpStatusCode.CONFLICT, "ProjectService")
    }

    return this.repository.addMember(projectId, employeeId)
  }

  async removeMember(
    projectId: string,
    employeeId: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    const project = await this.repository.findById(projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    // Chỉ GM/Admin hoặc Team Leader của dự án mới được quản lý thành viên
    const isTL = project.teamLeaderId === userId
    if (!this.isAuthorizedAdminOrGM(userRole) && !isTL) {
      throw new AppError(
        "Only Admins, GMs, or the Project's Team Leader can manage members",
        HttpStatusCode.FORBIDDEN,
        "ProjectService"
      )
    }

    // Kiểm tra xem có thực sự là thành viên dự án không
    const isMember = await this.repository.isMember(projectId, employeeId)
    if (!isMember) {
      throw new AppError("Employee is not a member of this project", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    return this.repository.removeMember(projectId, employeeId)
  }

  async getMembers(projectId: string, userId: string, userRole: string): Promise<any[]> {
    // Kiểm tra sự tồn tại và quyền truy cập dự án
    const project = await this.getProject(projectId, userId, userRole)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    return this.repository.getMembers(projectId)
  }
}