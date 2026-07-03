import { isPartTimeWorkSchedule } from "@/utils/employee/is-part-time-work-schedule.util.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { PrismaClient } from "@prisma/client"
import {
  CreateProjectDto,
  Project,
  ProjectListQuery,
  IProjectRepository,
  IEmployeeRepository,
  IProjectService,
  PaginatedProjectsDto,
  UpdateProjectDto,
  GanttDataDto,
  IProjectTaskStatusService,
} from "@/types"
import { AppError } from "@/utils/error.util.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { ROLE } from "@/configs/entities/employee.config.ts"
import { DEFAULT_PROJECT_TASK_STATUSES, PROJECT_STATUS, TASK_CREATION_POLICY } from "@/configs/entities/project.config.ts"

export class ProjectService implements IProjectService {
  constructor(
    private repository: IProjectRepository,
    private employeeRepository: IEmployeeRepository,
    private prisma: PrismaClient,
    private statusService?: IProjectTaskStatusService
  ) {}

  /**
   * Checks if user has Admin or General Manager role
   */
  private isAuthorizedAdminOrGM(userRole: string): boolean {
    return userRole === ROLE.ADMIN || userRole === ROLE.GENERAL_MANAGER
  }

  /**
   * Retrieves a project with role-based access control
   * Admins/GMs can view any project
   * Others can only view if they are the team leader or a member
   * Throws forbidden error if user lacks access
   */
  async getProject(id: string, userId: string, userRole: string): Promise<Project | null> {
    const project = await this.repository.findById(id)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    // Authorization: GM/Admin can view all. TL or Employee can only view if they are the leader or a member of the project
    if (!this.isAuthorizedAdminOrGM(userRole)) {
      const isTL = project.teamLeaderId === userId
      const isMember = await this.repository.isMember(id, userId)
      if (!isTL && !isMember) {
        throw new AppError("Access denied", HttpStatusCode.FORBIDDEN, "ProjectService")
      }
    }

    return project
  }

  /**
   * Lists projects with role-based filtering
   * Delegates to repository which applies access control
   */
  async listProjects(
    query: ProjectListQuery,
    userId: string,
    userRole: string
  ): Promise<PaginatedProjectsDto> {
    return this.repository.listProjects(query, userId, userRole)
  }

  /**
   * Creates a new project
   * Only Admins and General Managers can create projects
   * Validates team leader exists if provided
   * Prevents duplicate project names
   * Throws error if user lacks permission or data is invalid
   */
  async createProject(data: CreateProjectDto, userId: string, userRole: string): Promise<Project> {
    // Only GM and Admin are allowed to create projects
    if (!this.isAuthorizedAdminOrGM(userRole)) {
      throw new AppError(
        "Only General Managers or Admins can create projects",
        HttpStatusCode.FORBIDDEN,
        "ProjectService"
      )
    }

    // Check if the Team Leader exists
    if (data.teamLeaderId) {
      const leader = await this.employeeRepository.findById(data.teamLeaderId)
      if (!leader) {
        throw new AppError("Team Leader employee not found", HttpStatusCode.NOT_FOUND, "ProjectService")
      }
    }

    // Check for duplicate project name
    const existing = await this.repository.findByName(data.name)
    if (existing) {
      throw new AppError("Project name already exists", HttpStatusCode.CONFLICT, "ProjectService")
    }

    // Validate project dates check constraints
    if (data.startDate && data.expectedEndDate) {
      const start = new Date(data.startDate)
      const end = new Date(data.expectedEndDate)
      if (start > end) {
        throw new AppError(
          "Ngày bắt đầu không được lớn hơn ngày kết thúc dự kiến",
          HttpStatusCode.BAD_REQUEST,
          "ProjectService"
        )
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: data.name,
          description: data.description || null,
          techStack: data.techStack || [],
          status: data.status || PROJECT_STATUS.PLANNING,
          teamLeaderId: data.teamLeaderId || null,
          createdById: userId,
          startDate: data.startDate ? new Date(data.startDate) : null,
          expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
          taskCreationPolicy: data.taskCreationPolicy || TASK_CREATION_POLICY.LEADER_ONLY,
        }
      })

      if (this.statusService) {
        for (const item of DEFAULT_PROJECT_TASK_STATUSES) {
          await tx.projectTaskStatus.create({
            data: {
              projectId: project.id,
              name: item.name,
              color: item.color,
              order: item.order,
              isDefault: item.isDefault,
              isCompleted: item.isCompleted,
            }
          })
        }
      }

      return project as unknown as Project
    })
  }

  /**
   * Updates an existing project
   * Only Admins, GMs, or the project's Team Leader can update
   * Validates new team leader exists if provided
   * Prevents duplicate project names during rename
   * Throws error if user lacks permission or project not found
   */
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

    // Only GM/Admin or the Team Leader of the project can update it
    const isTL = project.teamLeaderId === userId
    if (!this.isAuthorizedAdminOrGM(userRole) && !isTL) {
      throw new AppError(
        "Only Admins, GMs, or the Project's Team Leader can update this project",
        HttpStatusCode.FORBIDDEN,
        "ProjectService"
      )
    }

    // Check if the new Team Leader exists
    if (data.teamLeaderId) {
      const leader = await this.employeeRepository.findById(data.teamLeaderId)
      if (!leader) {
        throw new AppError("Team Leader employee not found", HttpStatusCode.NOT_FOUND, "ProjectService")
      }
    }

    // Check for duplicate name if project is being renamed
    if (data.name && data.name !== project.name) {
      const existing = await this.repository.findByName(data.name)
      if (existing) {
        throw new AppError("Project name already exists", HttpStatusCode.CONFLICT, "ProjectService")
      }
    }

    // Validate project dates check constraints
    const start = data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : (project.startDate ? new Date(project.startDate) : null)
    const end = data.expectedEndDate !== undefined ? (data.expectedEndDate ? new Date(data.expectedEndDate) : null) : (project.expectedEndDate ? new Date(project.expectedEndDate) : null)
    const actualEnd = data.actualEndDate !== undefined ? (data.actualEndDate ? new Date(data.actualEndDate) : null) : (project.actualEndDate ? new Date(project.actualEndDate) : null)

    if (start && end && start > end) {
      throw new AppError(
        "Ngày bắt đầu không được lớn hơn ngày kết thúc dự kiến",
        HttpStatusCode.BAD_REQUEST,
        "ProjectService"
      )
    }

    if (start && actualEnd && start > actualEnd) {
      throw new AppError(
        "Ngày bắt đầu không được lớn hơn ngày kết thúc thực tế",
        HttpStatusCode.BAD_REQUEST,
        "ProjectService"
      )
    }

    return this.repository.updateProject(id, data)
  }

  /**
   * Deletes a project
   * Only Admins and General Managers can delete projects
   * Throws error if user lacks permission or project not found
   */
  async deleteProject(id: string, userId: string, userRole: string): Promise<boolean> {
    // Only GM/Admin can delete projects
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

  /**
   * Adds an employee as a member to a project
   * Only Admins, GMs, or the project's Team Leader can add members
   * Validates employee exists and is not already a member
   * Throws error if user lacks permission or data is invalid
   */
  async addMember(
    projectId: string,
    employeeId: string,
    userId: string,
    userRole: string,
    options?: { hourlyRate?: number | null; workMode?: string },
  ): Promise<boolean> {
    const project = await this.repository.findById(projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    const isTL = project.teamLeaderId === userId
    if (!this.isAuthorizedAdminOrGM(userRole) && !isTL) {
      throw new AppError(
        "Only Admins, GMs, or the Project's Team Leader can manage members",
        HttpStatusCode.FORBIDDEN,
        "ProjectService"
      )
    }

    const employee = await this.employeeRepository.findById(employeeId)
    if (!employee) {
      throw new AppError("Employee not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    if (
      isPartTimeWorkSchedule(employee) &&
      (options?.hourlyRate == null || options.hourlyRate <= 0)
    ) {
      // PT payroll reads hourlyRate per project, not base salary alone.
      throw new AppError(
        "Part-time members require an hourly rate",
        HttpStatusCode.UNPROCESSABLE_ENTITY,
        "ProjectService"
      )
    }

    const alreadyMember = await this.repository.isMember(projectId, employeeId)
    if (alreadyMember) {
      throw new AppError("Employee is already a member of this project", HttpStatusCode.CONFLICT, "ProjectService")
    }

    // workMode: remote → Spent Time only | onsite → one GPS check-in/day then Spent Time.
    return this.repository.addMember(projectId, employeeId, options)
  }

  /**
   * Removes a member from a project
   * Only Admins, GMs, or the project's Team Leader can remove members
   * Validates employee is actually a member before removing
   * Throws error if user lacks permission or member not found
   */
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

    // Only GM/Admin or the project's Team Leader can manage members
    const isTL = project.teamLeaderId === userId
    if (!this.isAuthorizedAdminOrGM(userRole) && !isTL) {
      throw new AppError(
        "Only Admins, GMs, or the Project's Team Leader can manage members",
        HttpStatusCode.FORBIDDEN,
        "ProjectService"
      )
    }

    // Check if they are actually a member of the project
    const isMember = await this.repository.isMember(projectId, employeeId)
    if (!isMember) {
      throw new AppError("Employee is not a member of this project", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    return this.repository.removeMember(projectId, employeeId)
  }

  /**
   * Updates hourly rate or work mode for an existing project member.
   * workMode drives attendance rules: remote → Spent Time only; onsite → GPS check-in once.
   */
  async updateMember(
    projectId: string,
    employeeId: string,
    userId: string,
    userRole: string,
    data: { hourlyRate?: number | null; workMode?: string },
  ): Promise<boolean> {
    const project = await this.repository.findById(projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    const isTL = project.teamLeaderId === userId
    if (!this.isAuthorizedAdminOrGM(userRole) && !isTL) {
      throw new AppError(
        "Only Admins, GMs, or the Project's Team Leader can manage members",
        HttpStatusCode.FORBIDDEN,
        "ProjectService",
      )
    }

    const isMember = await this.repository.isMember(projectId, employeeId)
    if (!isMember) {
      throw new AppError("Employee is not a member of this project", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    const employee = await this.employeeRepository.findById(employeeId)
    if (!employee) {
      throw new AppError("Employee not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    const existingMember = await this.repository.getMember(projectId, employeeId)
    const resolvedHourlyRate =
      data.hourlyRate !== undefined ? data.hourlyRate : (existingMember?.hourlyRate ?? null)

    if (
      isPartTimeWorkSchedule(employee) &&
      (resolvedHourlyRate == null || resolvedHourlyRate <= 0)
    ) {
      // PT members must keep a positive hourlyRate when updating project membership.
      throw new AppError(
        "Part-time members require an hourly rate",
        HttpStatusCode.UNPROCESSABLE_ENTITY,
        "ProjectService",
      )
    }

    return this.repository.updateMember(projectId, employeeId, data)
  }

  /**
   * Retrieves all members of a project
   * User must have access to the project to view its members
   * Validates project exists and user has permission
   */
  async getMembers(projectId: string, userId: string, userRole: string): Promise<any[]> {
    // Check project existence and access permissions
    const project = await this.getProject(projectId, userId, userRole)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    return this.repository.getMembers(projectId)
  }

  /**
   * Retrieves Gantt Chart data including tasks, members, and approved leave days
   * Access control: Admins/GMs can view any project
   * Others can only view if they are the team leader or project member
   */
  async getGanttData(projectId: string, userId: string, userRole: string): Promise<GanttDataDto> {
    // Check project existence and access permissions (reuses getProject checks)
    const project = await this.getProject(projectId, userId, userRole)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    return this.repository.getGanttData(projectId)
  }
}