import { PROJECT_STATUS, TASK_CREATION_POLICY } from "@/configs/entities/project.config.ts"

export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS]
export type TaskCreationPolicy = (typeof TASK_CREATION_POLICY)[keyof typeof TASK_CREATION_POLICY]

export interface Project {
  id: string
  name: string
  description: string | null
  techStack: string[]
  status: ProjectStatus
  taskCreationPolicy: TaskCreationPolicy
  startDate: Date | null
  expectedEndDate: Date | null
  actualEndDate: Date | null
  teamLeaderId: string | null
  createdById: string
  createdAt: Date
  updatedAt: Date
  teamLeader?: {
    id: string
    fullName: string
    email: string
  } | null
  createdBy?: {
    id: string
    fullName: string
    email: string
  }
}

export interface CreateProjectDto {
  name: string
  description?: string | null
  techStack?: string[]
  status?: ProjectStatus
  taskCreationPolicy?: TaskCreationPolicy
  startDate?: Date | string | null
  expectedEndDate?: Date | string | null
  teamLeaderId?: string | null
}

export interface UpdateProjectDto {
  name?: string
  description?: string | null
  techStack?: string[]
  status?: ProjectStatus
  taskCreationPolicy?: TaskCreationPolicy
  startDate?: Date | string | null
  expectedEndDate?: Date | string | null
  actualEndDate?: Date | string | null
  teamLeaderId?: string | null
}

export interface ProjectListQuery {
  page?: number
  limit?: number
  search?: string
  status?: ProjectStatus
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface PaginatedProjectsDto {
  data: Project[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface IProjectRepository {
  findById(id: string): Promise<Project | null>
  findByName(name: string): Promise<Project | null>
  listProjects(
    query: ProjectListQuery,
    userId: string,
    userRole: string,
  ): Promise<PaginatedProjectsDto>
  createProject(data: CreateProjectDto & { createdById: string }): Promise<Project>
  updateProject(id: string, data: UpdateProjectDto): Promise<Project | null>
  deleteProject(id: string): Promise<boolean>
  addMember(projectId: string, employeeId: string): Promise<boolean>
  removeMember(projectId: string, employeeId: string): Promise<boolean>
  isMember(projectId: string, employeeId: string): Promise<boolean>
  getMembers(projectId: string): Promise<any[]>
}

export interface IProjectService {
  getProject(id: string, userId: string, userRole: string): Promise<Project | null>
  listProjects(
    query: ProjectListQuery,
    userId: string,
    userRole: string,
  ): Promise<PaginatedProjectsDto>
  createProject(data: CreateProjectDto, userId: string, userRole: string): Promise<Project>
  updateProject(
    id: string,
    data: UpdateProjectDto,
    userId: string,
    userRole: string,
  ): Promise<Project | null>
  deleteProject(id: string, userId: string, userRole: string): Promise<boolean>
  addMember(
    projectId: string,
    employeeId: string,
    userId: string,
    userRole: string,
  ): Promise<boolean>
  removeMember(
    projectId: string,
    employeeId: string,
    userId: string,
    userRole: string,
  ): Promise<boolean>
  getMembers(projectId: string, userId: string, userRole: string): Promise<any[]>
}
