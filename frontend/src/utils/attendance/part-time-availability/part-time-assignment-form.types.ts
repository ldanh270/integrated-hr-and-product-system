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
  startTime: string | null
  endTime: string | null
}
