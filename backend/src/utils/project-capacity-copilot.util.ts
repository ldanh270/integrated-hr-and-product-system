/**
 * Pure Capacity Copilot formulas.
 * Kept database-free so forecast math is testable and explainable in demo.
 */
import { CAPACITY_COPILOT_RULES } from "@/configs/rules/capacity-copilot.config.ts"

export const CAPACITY_VELOCITY = {
  DEFAULT: 1,
  MIN: 0.5,
  MAX: 2,
} as const

export const CAPACITY_RISK = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const

export interface CapacityMemberInput {
  employeeId: string
  fullName: string
  roleCode: string
  roleName: string
  availableHours: number
  estimatedHours: number
  spentHours: number
  skillMatchFactor?: number
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

export const clampVelocity = (value: number): number =>
  Math.max(CAPACITY_VELOCITY.MIN, Math.min(CAPACITY_VELOCITY.MAX, value))

export const calculateVelocity = (estimatedHours: number, spentHours: number): number => {
  if (estimatedHours <= 0 || spentHours <= 0) return CAPACITY_VELOCITY.DEFAULT
  return clampVelocity(estimatedHours / spentHours)
}

export const buildCapacityForecast = (
  members: CapacityMemberInput[],
  targetPercent: number,
  history: CapacityForecastResult["history"],
): CapacityForecastResult => {
  const memberForecasts = members.map((member) => {
    const velocity = calculateVelocity(member.estimatedHours, member.spentHours)
    const skillMatchFactor =
      member.skillMatchFactor ?? CAPACITY_COPILOT_RULES.DEFAULT_SKILL_MATCH_FACTOR
    // Effective hours convert raw availability into delivery capacity using observed velocity.
    const effectiveHours = member.availableHours * velocity * skillMatchFactor

    return {
      employeeId: member.employeeId,
      fullName: member.fullName,
      roleCode: member.roleCode,
      roleName: member.roleName,
      availableHours: roundOne(member.availableHours),
      velocity: roundTwo(velocity),
      skillMatchFactor: roundTwo(skillMatchFactor),
      effectiveHours: roundOne(effectiveHours),
    }
  })

  const roleCodes = Array.from(new Set(memberForecasts.map((member) => member.roleCode)))
  const roles = roleCodes.map((roleCode) => {
    const firstMember = memberForecasts.find((member) => member.roleCode === roleCode)
    const effectiveHours = memberForecasts
      .filter((member) => member.roleCode === roleCode)
      .reduce((sum, member) => sum + member.effectiveHours, 0)

    return {
      roleCode,
      roleName: firstMember?.roleName ?? roleCode,
      effectiveHours: roundOne(effectiveHours),
    }
  })

  const totalEffectiveHours = memberForecasts.reduce(
    (sum, member) => sum + member.effectiveHours,
    0,
  )
  // Historical productivity links delivery history (% completed) to this week's effective hours.
  const productivityRate = calculateProductivityRate(history)
  const predictedPercent = totalEffectiveHours * productivityRate
  const percentGap = targetPercent - predictedPercent
  const requiredEffectiveHours = productivityRate > 0 ? targetPercent / productivityRate : 0
  const neededEffectiveHours = productivityRate > 0 ? Math.max(0, percentGap / productivityRate) : 0

  return {
    targetPercent: roundOne(targetPercent),
    predictedPercent: roundOne(predictedPercent),
    percentGap: roundOne(percentGap),
    productivityRate: roundTwo(productivityRate),
    requiredEffectiveHours: roundOne(requiredEffectiveHours),
    totalEffectiveHours: roundOne(totalEffectiveHours),
    neededEffectiveHours: roundOne(neededEffectiveHours),
    riskLevel: getPercentRisk(percentGap, targetPercent),
    members: memberForecasts,
    roles,
    history,
    recommendations: buildRecommendations(
      productivityRate,
      percentGap,
      neededEffectiveHours,
      roles,
    ),
  }
}

const calculateProductivityRate = (history: CapacityForecastResult["history"]): number => {
  const totals = history.reduce(
    (sum, week) => ({
      completedPercent: sum.completedPercent + week.completedPercent,
      spentHours: sum.spentHours + week.spentHours,
    }),
    { completedPercent: 0, spentHours: 0 },
  )
  if (totals.spentHours <= 0 || totals.completedPercent <= 0) return 0
  return totals.completedPercent / totals.spentHours
}

const getPercentRisk = (percentGap: number, targetPercent: number): string => {
  if (percentGap <= 0) return CAPACITY_RISK.LOW
  if (targetPercent <= 0) return CAPACITY_RISK.LOW
  return percentGap / targetPercent >= CAPACITY_COPILOT_RULES.HIGH_RISK_GAP_RATIO
    ? CAPACITY_RISK.HIGH
    : CAPACITY_RISK.MEDIUM
}

const buildRecommendations = (
  productivityRate: number,
  percentGap: number,
  neededEffectiveHours: number,
  roles: CapacityRoleForecast[],
): string[] => {
  if (productivityRate <= 0) {
    return [
      "Chưa đủ dữ liệu lịch sử để dự đoán % hoàn thành. Cần có spent time và task done ở các tuần trước, hoặc PM nhập baseline tạm cho tuần đầu.",
    ]
  }

  if (percentGap <= 0) {
    return [
      "Dự đoán tuần này đạt hoặc vượt cam kết (deal). Có thể giữ plan hiện tại hoặc chuyển bớt người sang project khác đang thiếu capacity.",
    ]
  }

  const roleHint =
    roles.length > 0
      ? ` Ưu tiên bổ sung role ${
          [...roles].sort((a, b) => a.effectiveHours - b.effectiveHours)[0].roleName
        }.`
      : ""
  return [
    `Dự đoán tuần này thiếu ${percentGap.toFixed(1)}% so với cam kết. Cần thêm khoảng ${neededEffectiveHours.toFixed(1)} effective hours.${roleHint}`,
    "Admin/PM có thể điều thêm nhân viên phù hợp, xin thêm availability từ part-time/intern, hoặc giảm scope tuần này.",
  ]
}

const roundOne = (value: number): number => Math.round(value * 10) / 10
const roundTwo = (value: number): number => Math.round(value * 100) / 100
