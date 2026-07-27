export interface IPartTimeAssignmentSlotForm {
  startTime: string | null
  endTime: string | null
}

export interface IPartTimeAssignmentDayForm {
  dayOfWeek: number
  isScheduled: boolean
  slots: IPartTimeAssignmentSlotForm[]
}

export interface IPartTimeAssignmentForm {
  dayOfWeek: number
  assignedDate?: string
  startTime: string | null
  endTime: string | null
}
