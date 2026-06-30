export interface ProjectTaskStatus {
  id: string
  projectId: string
  name: string
  color: string
  order: number
  isDefault: boolean
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProjectTaskStatusDto {
  name: string
  color?: string
  order?: number
  isDefault?: boolean
  isCompleted?: boolean
}

export interface UpdateProjectTaskStatusDto {
  name?: string
  color?: string
  order?: number
  isDefault?: boolean
  isCompleted?: boolean
}
