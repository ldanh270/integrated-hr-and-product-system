import { PART_TIME_PAYROLL_VARIABLE_DEFAULTS } from "@/configs/entities/part-time-payroll.config.ts"

export interface ResolvedPartTimePayrollVariables {
  overtimeMultiplier: number
  workingDayMultiplier: number
  defaultHourlyRate: number | null
}

interface PartTimePayrollContext {
  partTimeOvertimeMultiplier?: number
  partTimeWorkingDayMultiplier?: number
  partTimeDefaultHourlyRate?: number
}

function sanitizeOptionalNumber(value: number | undefined, fallback: number): number {
  if (value === undefined || Number.isNaN(value)) {
    return fallback
  }

  return value
}

/** Reads PT SalaryVariable codes from payroll context; zero default rate means "must set on project". */
export function resolvePartTimePayrollVariables(
  context: Record<string, number>,
): ResolvedPartTimePayrollVariables {
  const {
    partTimeOvertimeMultiplier,
    partTimeWorkingDayMultiplier,
    partTimeDefaultHourlyRate,
  } = context as PartTimePayrollContext

  const overtimeMultiplier = sanitizeOptionalNumber(
    partTimeOvertimeMultiplier,
    PART_TIME_PAYROLL_VARIABLE_DEFAULTS.OVERTIME_MULTIPLIER,
  )
  const workingDayMultiplier = sanitizeOptionalNumber(
    partTimeWorkingDayMultiplier,
    PART_TIME_PAYROLL_VARIABLE_DEFAULTS.WORKING_DAY_MULTIPLIER,
  )
  const defaultHourlyRate = sanitizeOptionalNumber(
    partTimeDefaultHourlyRate,
    PART_TIME_PAYROLL_VARIABLE_DEFAULTS.DEFAULT_HOURLY_RATE,
  )

  return {
    overtimeMultiplier,
    workingDayMultiplier,
    // Treat 0 as unset — forces project-level hourlyRate when admin leaves default at 0.
    defaultHourlyRate: defaultHourlyRate > 0 ? defaultHourlyRate : null,
  }
}
