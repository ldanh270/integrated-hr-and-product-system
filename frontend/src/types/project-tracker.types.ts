export interface ProjectTracker {
  id: string
  projectId: string
  name: string
  code: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProjectTrackerDto {
  name: string
  isActive?: boolean
}

export interface UpdateProjectTrackerDto {
  name?: string
  isActive?: boolean
}
