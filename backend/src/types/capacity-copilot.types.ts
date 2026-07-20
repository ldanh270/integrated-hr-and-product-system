/**
 * Contracts for Capacity Copilot data access.
 * These types intentionally describe project capacity forecasting only, not Project Task assignment.
 */
export interface ForecastProjectCapacityDto {
  weekStart: string
  lookbackWeeks?: number
}

export interface CapacityProjectMemberRow {
  employeeId: string
  fullName: string
  workScheduleType: string
  roleCode: string
  roleName: string
}

export interface CapacityVelocityRow {
  estimatedHours: number
  spentHours: number
}

export interface CapacityDeliveryHistoryRow {
  weekStart: string
  spentHours: number
  completedPercent: number
}

export interface CapacityAvailabilityRow {
  employeeId: string
  status: string
  days: Array<{
    isBusyAllDay: boolean
    slots: Array<{
      startTime: number
      endTime: number
    }>
  }>
}

export interface ICapacityCopilotRepository {
  getProjectDealTargetPercent(projectId: string): Promise<number | null | undefined>
  listProjectMembers(projectId: string): Promise<CapacityProjectMemberRow[]>
  listWeeklyAvailabilities(weekStart: Date): Promise<CapacityAvailabilityRow[]>
  getEmployeeVelocity(employeeId: string): Promise<CapacityVelocityRow>
  listDeliveryHistory(
    projectId: string,
    beforeWeekStart: Date,
    lookbackWeeks: number,
  ): Promise<CapacityDeliveryHistoryRow[]>
}
