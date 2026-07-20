/**
 * Frontend view-model contracts returned by the Capacity Copilot forecast API.
 * Values are advisory metrics for PM/Admin staffing decisions.
 */
export interface ForecastProjectCapacityDto {
  weekStart: string
  lookbackWeeks?: number
}

export interface CapacityMemberForecast {
  employeeId: string
  fullName: string
  roleCode: string
  roleName: string
  availableHours: number
  velocity: number
  skillMatchFactor: number
  effectiveHours: number
}

export interface CapacityRoleForecast {
  roleCode: string
  roleName: string
  effectiveHours: number
}

export interface CapacityForecastResult {
  targetPercent: number
  predictedPercent: number
  percentGap: number
  productivityRate: number
  requiredEffectiveHours: number
  totalEffectiveHours: number
  neededEffectiveHours: number
  riskLevel: string
  members: CapacityMemberForecast[]
  roles: CapacityRoleForecast[]
  history: Array<{
    weekStart: string
    spentHours: number
    completedPercent: number
  }>
  recommendations: string[]
}
