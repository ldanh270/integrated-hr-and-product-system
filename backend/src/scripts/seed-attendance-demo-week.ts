/** Seeds deterministic attendance demo records without modifying real employee attendance. */
import { ATTENDANCE_STATUS, EMPLOYEE_SHIFT_STATUS } from "@/configs/entities/attendance.config.ts"
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { ATTENDANCE_TIME_RULES } from "@/configs/rules/attendance.config.ts"
import { prisma } from "@/libs/database.ts"
import {
  buildDemoShiftSelections,
  demoAssignmentKey,
} from "@/scripts/attendance-demo-assignment.util.ts"
import {
  getAttendanceClockMinutes,
  toAttendanceInstant,
} from "@/utils/attendance/attendance-time-zone.util.ts"

const LEGACY_DEMO_NOTE = "Demo attendance week 13-19/07/2026"
const DEMO_NOTE = "Demo attendance 01/06-18/07/2026"
const DEMO_START = new Date("2026-06-01T00:00:00.000Z")
const DEMO_END = new Date("2026-07-18T00:00:00.000Z")

/** Deterministic demo distribution; production attendance never consumes these values. */
const DEMO_ATTENDANCE_RULES = {
  ABSENCE_INTERVAL: 11,
  LATE_INTERVAL: 4,
  EARLY_INTERVAL: 5,
  LATE_MINUTES: 15,
  EARLY_MINUTES: -10,
  CHECKOUT_BUFFER_MINUTES: 5,
  SUNDAY: 0,
  SATURDAY: 6,
} as const

/** Returns weekdays in the configured demo interval. */
function getBusinessDates(): Date[] {
  const dates: Date[] = []
  for (
    let time = DEMO_START.getTime();
    time <= DEMO_END.getTime();
    time += ATTENDANCE_TIME_RULES.MILLISECONDS_PER_DAY
  ) {
    const date = new Date(time)
    const weekday = date.getUTCDay()
    if (weekday !== DEMO_ATTENDANCE_RULES.SUNDAY && weekday !== DEMO_ATTENDANCE_RULES.SATURDAY) {
      dates.push(date)
    }
  }
  return dates
}

function getShiftDurationMinutes(startTime: number, endTime: number): number {
  return endTime >= startTime ? endTime - startTime : endTime + ATTENDANCE_TIME_RULES.MINUTES_PER_DAY - startTime
}

/** Replaces only script-owned demo records while preserving real attendance. */
async function seedDemoWeek() {
  const [employees, fallbackShift] = await Promise.all([
    prisma.employee.findMany({
      where: { deletedAt: null, status: { not: EMPLOYEE_STATUS.TERMINATED } },
      orderBy: { fullName: "asc" },
    }),
    prisma.workingShift.findFirst({ where: { isActive: true }, orderBy: { startTime: "asc" } }),
  ])
  if (!fallbackShift || employees.length === 0) {
    throw new Error("Active employee or working shift missing")
  }

  const creator = employees.find((employee) => employee.username === "admin") ?? employees[0]
  const dates = getBusinessDates()
  const schedules = await prisma.shiftSchedule.findMany({
    where: {
      employeeId: { in: employees.map((employee) => employee.id) },
      validFrom: { lte: DEMO_END },
      OR: [{ validTo: null }, { validTo: { gte: DEMO_START } }],
    },
    include: { days: { include: { shift: true } } },
    orderBy: { validFrom: "desc" },
  })
  const desiredAssignments = buildDemoShiftSelections(
    employees,
    schedules,
    dates,
    fallbackShift.id,
  ).map((selection) => ({
    ...selection,
    status: EMPLOYEE_SHIFT_STATUS.CONFIRMED,
    createdById: creator.id,
  }))
  const desiredAssignmentKeys = new Set(
    desiredAssignments.map((assignment) =>
      demoAssignmentKey(assignment.employeeId, assignment.assignedDate, assignment.shiftId),
    ),
  )

  // Remove only rows owned by this demo script, including an older timezone-shifted run.
  await prisma.employeeShift.deleteMany({
    where: { attendanceRecord: { is: { note: { in: [LEGACY_DEMO_NOTE, DEMO_NOTE] } } } },
  })

  await prisma.employeeShift.createMany({
    data: desiredAssignments,
    skipDuplicates: true,
  })

  const assignedShifts = (
    await prisma.employeeShift.findMany({
      where: {
        employeeId: { in: employees.map((employee) => employee.id) },
        assignedDate: { in: dates },
      },
      include: { shift: true },
    })
  ).filter((employeeShift) =>
    desiredAssignmentKeys.has(
      demoAssignmentKey(
        employeeShift.employeeId,
        employeeShift.assignedDate,
        employeeShift.shiftId,
      ),
    ),
  )
  const employeeOrder = new Map<string, number>(
    employees.map((employee, index): [string, number] => [employee.id, index]),
  )

  await prisma.attendanceRecord.createMany({
    data: assignedShifts.map((employeeShift) => {
      const employeeIndex = employeeOrder.get(employeeShift.employeeId) ?? 0
      const dayIndex = Math.round(
        (employeeShift.assignedDate.getTime() - DEMO_START.getTime()) /
          ATTENDANCE_TIME_RULES.MILLISECONDS_PER_DAY,
      )
      const sequence = employeeIndex + dayIndex
      const isAbsent = sequence % DEMO_ATTENDANCE_RULES.ABSENCE_INTERVAL === 0
      const isLate = !isAbsent && sequence % DEMO_ATTENDANCE_RULES.LATE_INTERVAL === 0
      const isEarly = !isAbsent && !isLate && sequence % DEMO_ATTENDANCE_RULES.EARLY_INTERVAL === 0
      const variance = isLate
        ? DEMO_ATTENDANCE_RULES.LATE_MINUTES
        : isEarly
          ? DEMO_ATTENDANCE_RULES.EARLY_MINUTES
          : 0

      return {
        employeeId: employeeShift.employeeId,
        employeeShiftId: employeeShift.id,
        date: employeeShift.assignedDate,
        checkInAt: isAbsent
          ? null
          : toAttendanceInstant(
              employeeShift.assignedDate,
              employeeShift.shift.startTime + variance,
            ),
        checkOutAt: isAbsent
          ? null
          : toAttendanceInstant(
              employeeShift.assignedDate,
              employeeShift.shift.endTime + DEMO_ATTENDANCE_RULES.CHECKOUT_BUFFER_MINUTES,
            ),
        status: isAbsent
          ? ATTENDANCE_STATUS.ABSENT
          : isLate
            ? ATTENDANCE_STATUS.LATE
            : ATTENDANCE_STATUS.ON_TIME,
        lateMinutes: isLate ? variance : 0,
        totalWorkMinutes: isAbsent
          ? 0
          : getShiftDurationMinutes(employeeShift.shift.startTime, employeeShift.shift.endTime) -
            Math.max(0, variance),
        note: DEMO_NOTE,
      }
    }),
    skipDuplicates: true,
  })

  const records = await prisma.attendanceRecord.findMany({
    where: { note: DEMO_NOTE, checkInAt: { not: null } },
  })
  await prisma.realShift.createMany({
    data: records.flatMap((record) => {
      const checkInAt = record.checkInAt
      if (!checkInAt) return []

      return [
        {
          employeeId: record.employeeId,
          attendanceRecordId: record.id,
          date: record.date,
          actualStartTime: getAttendanceClockMinutes(checkInAt),
          actualEndTime: record.checkOutAt ? getAttendanceClockMinutes(record.checkOutAt) : null,
          isMatched: record.lateMinutes === 0,
        },
      ]
    }),
    skipDuplicates: true,
  })

  console.log(`Demo attendance ready: ${assignedShifts.length} employee-days, 01/06-18/07/2026`)
}

try {
  await seedDemoWeek()
} finally {
  await prisma.$disconnect()
}
