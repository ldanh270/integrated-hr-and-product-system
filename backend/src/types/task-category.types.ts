export interface TaskCategory {
  id: string
  projectId: string
  name: string
  createdAt: Date
}

export interface CreateTaskCategoryDto {
  name: string
}

export interface UpdateTaskCategoryDto {
  name?: string
}

export interface ITaskCategoryRepository {
  findByProject(projectId: string): Promise<TaskCategory[]>
  findById(id: string): Promise<TaskCategory | null>
  create(projectId: string, data: CreateTaskCategoryDto): Promise<TaskCategory>
  update(id: string, data: UpdateTaskCategoryDto): Promise<TaskCategory | null>
  delete(id: string): Promise<boolean>
}

export interface ITaskCategoryService {
  listByProject(projectId: string, userId: string, userRole: string): Promise<TaskCategory[]>
  create(projectId: string, data: CreateTaskCategoryDto, userId: string, userRole: string): Promise<TaskCategory>
  update(projectId: string, categoryId: string, data: UpdateTaskCategoryDto, userId: string, userRole: string): Promise<TaskCategory>
  delete(projectId: string, categoryId: string, userId: string, userRole: string): Promise<void>
}
