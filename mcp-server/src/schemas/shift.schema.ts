export interface CreateShiftInput {
  name: string
  startTime: string
  endTime: string
  color?: string
  isActive?: boolean
}

export interface UpdateShiftInput {
  name?: string
  startTime?: string
  endTime?: string
  color?: string
  isActive?: boolean
}

export interface AssignScheduleInput {
  employeeIds: string[]
  shiftId: string
  startDate: string
  endDate: string
}

export interface OverrideShiftInput {
  employeeId: string
  date: string
  shiftId: string
  note?: string
}

export interface GenerateScheduleInput {
  startDate: string
  endDate: string
}

export interface UpdateScheduleSettingsInput {
  triggerDayOfWeek: number
  triggerHour?: number
  triggerMinute?: number
}

export interface CreateWeeklyTemplateInput {
  name: string
  description?: string
  isDefault?: boolean
  shifts: {
    dayOfWeek: number
    shiftId: string
  }[]
}

export interface UpdateWeeklyTemplateInput {
  name?: string
  description?: string
  isDefault?: boolean
  shifts?: {
    dayOfWeek: number
    shiftId: string
  }[]
}

export interface CreateShiftChangeRequestInput {
  date: string
  employeeShiftId: string
  workingShiftId?: string
  swapWithEmployeeId?: string
  swapWithShiftId?: string
  reason?: string
  note?: string
  assignedToId?: string
}

export interface CreateHolidayInput {
  name: string
  startDate: string
  endDate: string
  type: "public" | "company" | "other"
  description?: string
  isActive?: boolean
}

export interface UpdateHolidayInput {
  name?: string
  startDate?: string
  endDate?: string
  type?: "public" | "company" | "other"
  description?: string
  isActive?: boolean
}
