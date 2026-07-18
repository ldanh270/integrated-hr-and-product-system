/** Resolves demo EmployeeShift assignments from the same recurring schedules shown in the UI. */
import type { ISchedulePattern } from "@/utils/schedule.util.ts"
import { resolveShiftFromSchedule } from "@/utils/schedule.util.ts"

interface IDemoEmployee {
  id: string
}

interface IDemoSchedule extends ISchedulePattern {
  id: string
  employeeId: string
  validFrom: Date
  validTo: Date | null
}

export interface IDemoShiftSelection {
  employeeId: string
  shiftId: string
  assignedDate: Date
  scheduleId?: string
}

/** Stable composite key for matching script-owned employee shift assignments. */
export function demoAssignmentKey(employeeId: string, assignedDate: Date, shiftId: string): string {
  return `${employeeId}:${assignedDate.toISOString().slice(0, 10)}:${shiftId}`
}

/** Uses the latest valid employee schedule for each date, with one explicit fallback shift. */
export function buildDemoShiftSelections(
  employees: IDemoEmployee[],
  schedules: IDemoSchedule[],
  dates: Date[],
  fallbackShiftId: string,
): IDemoShiftSelection[] {
  const schedulesByEmployee = new Map<string, IDemoSchedule[]>()
  for (const schedule of schedules) {
    const employeeSchedules = schedulesByEmployee.get(schedule.employeeId) ?? []
    employeeSchedules.push(schedule)
    schedulesByEmployee.set(schedule.employeeId, employeeSchedules)
  }

  return employees.flatMap((employee) =>
    dates.map((assignedDate) => {
      const assignedTime = assignedDate.getTime()
      const schedule = schedulesByEmployee
        .get(employee.id)
        ?.find(
          (candidate) =>
            candidate.validFrom.getTime() <= assignedTime &&
            (!candidate.validTo || candidate.validTo.getTime() >= assignedTime),
        )
      const resolvedShift = resolveShiftFromSchedule(schedule, assignedDate)

      return {
        employeeId: employee.id,
        shiftId: resolvedShift?.shiftId ?? fallbackShiftId,
        assignedDate,
        scheduleId: schedule?.id,
      }
    }),
  )
}
