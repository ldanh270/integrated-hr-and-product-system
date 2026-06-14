import { SPENT_TIME_ACTIVITIES, SPENT_TIME_WORK_TIME_TYPES } from "@/config/entities/project.config"

export type SpentTimeActivity = (typeof SPENT_TIME_ACTIVITIES)[number]
export type SpentTimeWorkTimeType = (typeof SPENT_TIME_WORK_TIME_TYPES)[number]

export interface SpentTime {
  id: string
  taskId: string
  employeeId: string
  date: string
  hours: number
  comment: string | null
  activity: SpentTimeActivity
  workTimeType: SpentTimeWorkTimeType
  createdAt: string
  updatedAt: string
  task?: {
    id: string
    title: string
    projectId: string
    project?: {
      id: string
      name: string
    }
  }
  employee?: {
    id: string
    fullName: string
    email: string
  }
}

export interface CreateSpentTimeDto {
  taskId: string
  employeeId?: string
  date: string
  hours: number
  comment?: string | null
  activity: SpentTimeActivity
  workTimeType?: SpentTimeWorkTimeType
}

export interface UpdateSpentTimeDto {
  date?: string
  hours?: number
  comment?: string | null
  activity?: SpentTimeActivity
  workTimeType?: SpentTimeWorkTimeType
}

export interface SpentTimeQuery {
  taskId?: string
  employeeId?: string
  projectId?: string
  startDate?: string
  endDate?: string
}
