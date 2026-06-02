export interface ShiftInfo {
  checkInTime: string
  checkOutTime: string
  hoursWorked: string
  totalHours: string
  progressPercentage: number
  status: string
}
export declare function useDashboard(): {
  user: import("../../store/auth-store").User | null
  todayFormatted: string
  shiftInfo: ShiftInfo
}
