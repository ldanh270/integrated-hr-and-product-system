export interface ProjectRole {
  id: string
  projectId: string
  name: string
  code: string
  allowedTaskTrackers: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectRoleDto {
  name: string
  allowedTaskTrackers?: string[]
}

export interface UpdateProjectRoleDto {
  name?: string
  allowedTaskTrackers?: string[]
}

export interface IProjectRoleRepository {
  list(projectId: string): Promise<ProjectRole[]>
  findById(id: string): Promise<ProjectRole | null>
  findByCode(projectId: string, code: string): Promise<ProjectRole | null>
  create(projectId: string, data: CreateProjectRoleDto & { code: string }): Promise<ProjectRole>
  update(id: string, data: UpdateProjectRoleDto & { code?: string }): Promise<ProjectRole | null>
  delete(id: string): Promise<void>
  createMany(projectId: string, roles: Array<{ name: string; code: string; allowedTaskTrackers: string[] }>): Promise<void>
}

export interface IProjectRoleService {
  list(projectId: string): Promise<ProjectRole[]>
  create(projectId: string, data: CreateProjectRoleDto): Promise<ProjectRole>
  update(projectId: string, id: string, data: UpdateProjectRoleDto): Promise<ProjectRole | null>
  delete(projectId: string, id: string): Promise<void>
}
