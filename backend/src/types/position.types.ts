import { TaskTracker } from "./task.types.ts"
import { IApplicationType } from "./attendance.types.ts"

export interface Position {
  id: string
  name: string
  code: string
  description: string | null
  allowedTaskTrackers: TaskTracker[]
  allowedApplicationTypes: IApplicationType[]
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface ProjectPositionRule {
  id: string
  projectId: string
  positionId: string
  allowedTaskTrackers: TaskTracker[]
  allowedApplicationTypes: IApplicationType[]
  createdAt: Date
  updatedAt: Date
}

export interface CreatePositionDto {
  name: string
  code: string
  description?: string
  allowedTaskTrackers?: TaskTracker[]
  allowedApplicationTypes?: IApplicationType[]
}

export interface UpdatePositionDto {
  name?: string
  code?: string
  description?: string | null
  allowedTaskTrackers?: TaskTracker[]
  allowedApplicationTypes?: IApplicationType[]
}

export interface ProjectPositionRuleDto {
  positionId: string
  allowedTaskTrackers: TaskTracker[]
  allowedApplicationTypes: IApplicationType[]
}

export interface IPositionRepository {
  findAll(): Promise<Position[]>
  findById(id: string): Promise<Position | null>
  findByCode(code: string): Promise<Position | null>
  create(data: CreatePositionDto): Promise<Position>
  update(id: string, data: UpdatePositionDto): Promise<Position>
  delete(id: string): Promise<Position>
  
  // Project Position Rules
  findActiveProjectMemberships(employeeId: string): Promise<{ projectId: string; projectName: string }[]>
}

export interface IPositionService {
  getAllPositions(): Promise<Position[]>
  getPositionById(id: string): Promise<Position>
  createPosition(data: CreatePositionDto): Promise<Position>
  updatePosition(id: string, data: UpdatePositionDto): Promise<Position>
  deletePosition(id: string): Promise<Position>
  
  // Project Position Rules
  getProjectRules(projectId: string): Promise<ProjectPositionRule[]>
  saveProjectRules(projectId: string, rules: ProjectPositionRuleDto[]): Promise<ProjectPositionRule[]>
  validateTaskCreation(projectId: string, employeeId: string, tracker: TaskTracker): Promise<void>
  validateApplicationSubmission(employeeId: string, type: IApplicationType): Promise<void>
}
