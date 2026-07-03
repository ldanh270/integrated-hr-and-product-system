import {
  PART_TIME_PAYROLL_VARIABLE,
  PART_TIME_PAYROLL_VARIABLE_DEFAULTS,
} from "@/configs/entities/part-time-payroll.config.ts"

export interface ResolvedPartTimePayrollVariables {
  overtimeMultiplier: number
  workingDayMultiplier: number
  defaultHourlyRate: number | null
}

function readNumeric(
  context: Record<string, number>,
  code: string,
  fallback: number,
): number {
  const value = context[code]
  return value !== undefined && !Number.isNaN(value) ? value : fallback
}

/** Reads PT SalaryVariable codes from payroll context; zero default rate means "must set on project". */
export function resolvePartTimePayrollVariables(
  context: Record<string, number>,
): ResolvedPartTimePayrollVariables {
  const defaultHourlyRate = readNumeric(
    context,
    PART_TIME_PAYROLL_VARIABLE.DEFAULT_HOURLY_RATE,
    PART_TIME_PAYROLL_VARIABLE_DEFAULTS.DEFAULT_HOURLY_RATE,
  )

  return {
    overtimeMultiplier: readNumeric(
      context,
      PART_TIME_PAYROLL_VARIABLE.OVERTIME_MULTIPLIER,
      PART_TIME_PAYROLL_VARIABLE_DEFAULTS.OVERTIME_MULTIPLIER,
    ),
    workingDayMultiplier: readNumeric(
      context,
      PART_TIME_PAYROLL_VARIABLE.WORKING_DAY_MULTIPLIER,
      PART_TIME_PAYROLL_VARIABLE_DEFAULTS.WORKING_DAY_MULTIPLIER,
    ),
    // Treat 0 as unset — forces project-level hourlyRate when admin leaves default at 0.
    defaultHourlyRate: defaultHourlyRate > 0 ? defaultHourlyRate : null,
  }
}
