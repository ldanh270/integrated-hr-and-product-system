export interface ProjectRole {
  id: string
  projectId: string
  name: string
  code: string
  allowedTaskTrackers: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateProjectRoleDto {
  name: string
  allowedTaskTrackers?: string[]
}

export interface UpdateProjectRoleDto {
  name?: string
  allowedTaskTrackers?: string[]
}
