export interface IWeeklyScheduleTemplateDayDTO {
  dayOfWeek: number
  shiftId?: string | null
}

export interface IWeeklyScheduleTemplateWeekDTO {
  weekIndex: number
  days: IWeeklyScheduleTemplateDayDTO[]
}

export interface ICreateWeeklyScheduleTemplateDTO {
  name: string
  description?: string | null
  cycleWeeks: number
  isActive?: boolean
  weeks: IWeeklyScheduleTemplateWeekDTO[]
  createdById: string
}

export interface IUpdateWeeklyScheduleTemplateDTO {
  name?: string
  description?: string | null
  cycleWeeks?: number
  isActive?: boolean
  weeks?: IWeeklyScheduleTemplateWeekDTO[]
}

export interface IApplyWeeklyScheduleTemplateDTO {
  templateId: string
  employeeIds: string[]
  validFrom: string | Date
  validTo?: string | Date | null
  generateShifts?: boolean
  createdById: string
}

export interface IWeeklyScheduleTemplateRepository {
  create(data: ICreateWeeklyScheduleTemplateDTO): Promise<any>
  update(id: string, data: IUpdateWeeklyScheduleTemplateDTO): Promise<any>
  delete(id: string): Promise<void>
  findById(id: string): Promise<any | null>
  listAll(): Promise<any[]>
}

export interface IWeeklyScheduleTemplateService {
  createTemplate(data: ICreateWeeklyScheduleTemplateDTO): Promise<any>
  updateTemplate(id: string, data: IUpdateWeeklyScheduleTemplateDTO): Promise<any>
  deleteTemplate(id: string): Promise<void>
  getTemplate(id: string): Promise<any>
  listTemplates(): Promise<any[]>
  applyTemplate(data: IApplyWeeklyScheduleTemplateDTO): Promise<any[]>
}
