import {
  DEFAULT_PROJECT_TASK_STATUSES,
  PROJECT_STATUS,
  TASK_CREATION_POLICY,
} from "@/configs/entities/project.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { authorizationService } from "@/services/authorization.service.ts"
import {
  CreateProjectDto,
  GanttDataDto,
  IEmployeeRepository,
  IProjectRepository,
  IProjectService,
  IProjectTaskStatusService,
  PaginatedProjectsDto,
  Project,
  ProjectListQuery,
  UpdateProjectDto,
} from "@/types"
import { isPartTimeWorkSchedule } from "@/utils/employee/is-part-time-work-schedule.util.ts"
import { AppError } from "@/utils/error.util.ts"

import { PrismaClient } from "@prisma/client"

/**
 * Handles project lifecycle, access control, and project-member rules.
 * Part-time membership settings are validated here before repository writes.
 */
export class ProjectService implements IProjectService {
  constructor(
    private repository: IProjectRepository,
    private employeeRepository: IEmployeeRepository,
    private prisma: PrismaClient,
    private statusService?: IProjectTaskStatusService,
  ) {}

  /**
   * Resolves whether the caller can bypass project scoping checks.
   */
  private async checkIsAdminOrGM(userId: string): Promise<boolean> {
    const authContext = await authorizationService.getAuthorizationContext(userId)
    return authContext.permissions.has("project.update")
  }

  /**
   * Returns one project when the caller is allowed to view it.
   */
  async getProject(id: string, userId: string): Promise<Project | null> {
    const project = await this.repository.findById(id)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    const isAdminOrGM = await this.checkIsAdminOrGM(userId)
    if (!isAdminOrGM) {
      const isTL = project.teamLeaderId === userId
      const isMember = await this.repository.isMember(id, userId)
      if (!isTL && !isMember) {
        throw new AppError("Access denied", HttpStatusCode.FORBIDDEN, "ProjectService")
      }
    }

    return project
  }

  /**
   * Lists projects with repository-level filtering based on the caller's visibility scope.
   */
  async listProjects(query: ProjectListQuery, userId: string): Promise<PaginatedProjectsDto> {
    const isAdminOrGM = await this.checkIsAdminOrGM(userId)
    return this.repository.listProjects(query, userId, isAdminOrGM)
  }

  /**
   * Creates a project and optionally seeds its default task-status columns.
   */
  async createProject(data: CreateProjectDto, userId: string): Promise<Project> {
    const isAdminOrGM = await this.checkIsAdminOrGM(userId)
    if (!isAdminOrGM) {
      throw new AppError(
        "Only General Managers or Admins can create projects",
        HttpStatusCode.FORBIDDEN,
        "ProjectService",
      )
    }

    if (data.teamLeaderId) {
      const leader = await this.employeeRepository.findById(data.teamLeaderId)
      if (!leader) {
        throw new AppError(
          "Team Leader employee not found",
          HttpStatusCode.NOT_FOUND,
          "ProjectService",
        )
      }
    }

    const existing = await this.repository.findByName(data.name)
    if (existing) {
      throw new AppError("Project name already exists", HttpStatusCode.CONFLICT, "ProjectService")
    }

    if (data.startDate && data.expectedEndDate) {
      const start = new Date(data.startDate)
      const end = new Date(data.expectedEndDate)
      if (start > end) {
        throw new AppError(
          "Ngày bắt đầu không được lớn hơn ngày kết thúc dự kiến",
          HttpStatusCode.BAD_REQUEST,
          "ProjectService",
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
          // Project deal metadata used by Capacity Copilot; task assignment logic reads none of this.
          dealTargetPercent: data.dealTargetPercent ?? null,
          taskCreationPolicy: data.taskCreationPolicy || TASK_CREATION_POLICY.LEADER_ONLY,
          allowedTaskTrackers: data.allowedTaskTrackers ?? [],
        },
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
            },
          })
        }
      }

      return project as unknown as Project
    })
  }

  /**
   * Updates project metadata after validating ownership, uniqueness, and date constraints.
   */
  async updateProject(id: string, data: UpdateProjectDto, userId: string): Promise<Project | null> {
    const project = await this.repository.findById(id)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    const isTL = project.teamLeaderId === userId
    const isAdminOrGM = await this.checkIsAdminOrGM(userId)
    if (!isAdminOrGM && !isTL) {
      throw new AppError(
        "Only Admins, GMs, or the Project's Team Leader can update this project",
        HttpStatusCode.FORBIDDEN,
        "ProjectService",
      )
    }

    if (data.teamLeaderId) {
      const leader = await this.employeeRepository.findById(data.teamLeaderId)
      if (!leader) {
        throw new AppError(
          "Team Leader employee not found",
          HttpStatusCode.NOT_FOUND,
          "ProjectService",
        )
      }
    }

    if (data.name && data.name !== project.name) {
      const existing = await this.repository.findByName(data.name)
      if (existing) {
        throw new AppError("Project name already exists", HttpStatusCode.CONFLICT, "ProjectService")
      }
    }

    const start =
      data.startDate !== undefined
        ? data.startDate
          ? new Date(data.startDate)
          : null
        : project.startDate
          ? new Date(project.startDate)
          : null
    const end =
      data.expectedEndDate !== undefined
        ? data.expectedEndDate
          ? new Date(data.expectedEndDate)
          : null
        : project.expectedEndDate
          ? new Date(project.expectedEndDate)
          : null
    const actualEnd =
      data.actualEndDate !== undefined
        ? data.actualEndDate
          ? new Date(data.actualEndDate)
          : null
        : project.actualEndDate
          ? new Date(project.actualEndDate)
          : null

    if (start && end && start > end) {
      throw new AppError(
        "Ngày bắt đầu không được lớn hơn ngày kết thúc dự kiến",
        HttpStatusCode.BAD_REQUEST,
        "ProjectService",
      )
    }

    if (start && actualEnd && start > actualEnd) {
      throw new AppError(
        "Ngày bắt đầu không được lớn hơn ngày kết thúc thực tế",
        HttpStatusCode.BAD_REQUEST,
        "ProjectService",
      )
    }

    return this.repository.updateProject(id, data)
  }

  /**
   * Deletes a project
   * Only Admins and General Managers can delete projects
   */
  async deleteProject(id: string, userId: string): Promise<boolean> {
    const isAdminOrGM = await this.checkIsAdminOrGM(userId)
    if (!isAdminOrGM) {
      throw new AppError(
        "Only General Managers or Admins can delete projects",
        HttpStatusCode.FORBIDDEN,
        "ProjectService",
      )
    }

    const project = await this.repository.findById(id)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    return this.repository.deleteProject(id)
  }

  /**
   * Adds an employee to a project and enforces part-time hourly-rate requirements.
   */
  async addMember(
    projectId: string,
    employeeId: string,
    userId: string,
    options?: { hourlyRate?: number | null; workMode?: string; roleId?: string | null },
  ): Promise<boolean> {
    const project = await this.repository.findById(projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    const isTL = project.teamLeaderId === userId
    const isAdminOrGM = await this.checkIsAdminOrGM(userId)
    if (!isAdminOrGM && !isTL) {
      throw new AppError(
        "Only Admins, GMs, or the Project's Team Leader can manage members",
        HttpStatusCode.FORBIDDEN,
        "ProjectService",
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
        "ProjectService",
      )
    }

    const alreadyMember = await this.repository.isMember(projectId, employeeId)
    if (alreadyMember) {
      throw new AppError(
        "Employee is already a member of this project",
        HttpStatusCode.CONFLICT,
        "ProjectService",
      )
    }

    return this.repository.addMember(projectId, employeeId, options)
  }

  /**
   * Removes an existing member from a project after permission and membership checks.
   */
  async removeMember(projectId: string, employeeId: string, userId: string): Promise<boolean> {
    const project = await this.repository.findById(projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    const isTL = project.teamLeaderId === userId
    const isAdminOrGM = await this.checkIsAdminOrGM(userId)
    if (!isAdminOrGM && !isTL) {
      throw new AppError(
        "Only Admins, GMs, or the Project's Team Leader can manage members",
        HttpStatusCode.FORBIDDEN,
        "ProjectService",
      )
    }

    const isMember = await this.repository.isMember(projectId, employeeId)
    if (!isMember) {
      throw new AppError(
        "Employee is not a member of this project",
        HttpStatusCode.NOT_FOUND,
        "ProjectService",
      )
    }

    return this.repository.removeMember(projectId, employeeId)
  }

  /**
   * Updates per-project member settings such as hourly rate and work mode.
   */
  async updateMember(
    projectId: string,
    employeeId: string,
    userId: string,
    data: { hourlyRate?: number | null; workMode?: string; roleId?: string | null },
  ): Promise<boolean> {
    const project = await this.repository.findById(projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    const isTL = project.teamLeaderId === userId
    const isAdminOrGM = await this.checkIsAdminOrGM(userId)
    if (!isAdminOrGM && !isTL) {
      throw new AppError(
        "Only Admins, GMs, or the Project's Team Leader can manage members",
        HttpStatusCode.FORBIDDEN,
        "ProjectService",
      )
    }

    const isMember = await this.repository.isMember(projectId, employeeId)
    if (!isMember) {
      throw new AppError(
        "Employee is not a member of this project",
        HttpStatusCode.NOT_FOUND,
        "ProjectService",
      )
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
   * Returns the active member list for one project when the caller can access that project.
   */
  async getMembers(projectId: string, userId: string): Promise<any[]> {
    const project = await this.getProject(projectId, userId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    return this.repository.getMembers(projectId)
  }

  /**
   * Loads the aggregated Gantt payload for a project, including tasks and member data.
   */
  async getGanttData(projectId: string, userId: string): Promise<GanttDataDto> {
    const project = await this.getProject(projectId, userId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, "ProjectService")
    }

    return this.repository.getGanttData(projectId)
  }
}
