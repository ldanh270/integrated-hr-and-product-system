/**
 * Frontend view contracts for the Capacity Copilot API.
 * Field names intentionally mirror backend results so the UI does not reinterpret forecast math.
 */
import type {
  CapacityConfidenceLevel,
  CapacityRiskLevel,
} from "@/config/rules/capacity-copilot.config"

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
  confidenceLevel: CapacityConfidenceLevel
  confidenceReasons: string[]
  productivityRate: number
  requiredEffectiveHours: number
  totalEffectiveHours: number
  neededEffectiveHours: number
  riskLevel: CapacityRiskLevel
  members: CapacityMemberForecast[]
  roles: CapacityRoleForecast[]
  history: Array<{
    weekStart: string
    spentHours: number
    completedPercent: number
  }>
  recommendations: string[]
}

export interface CapacityBoardProjectSnapshot {
  projectId: string
  projectName: string
  forecast: CapacityForecastResult | null
  generatedAt: string
  errorMessage: string | null
}

export interface CapacityBoardForecastResult {
  weekStart: string
  generatedAt: string
  projects: CapacityBoardProjectSnapshot[]
}
