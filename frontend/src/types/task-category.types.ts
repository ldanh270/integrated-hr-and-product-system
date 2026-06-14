export interface TaskCategory {
  id: string
  projectId: string
  name: string
  createdAt: string
}

export interface CreateTaskCategoryDto {
  name: string
}

export interface UpdateTaskCategoryDto {
  name?: string
}
