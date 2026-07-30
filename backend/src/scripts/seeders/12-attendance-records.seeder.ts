import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

import { faker } from "@faker-js/faker"

function getShiftDurationMinutes(startTime: number, endTime: number): number {
  return endTime >= startTime ? endTime - startTime : endTime + 24 * 60 - startTime
}

export class AttendanceRecordsSeeder implements ISeeder {
  readonly name = "AttendanceRecords"
  readonly order = 12

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding attendance records...")

    const employeeShiftIds = context.employeeShiftIds

    if (employeeShiftIds.length === 0) {
      throw new Error("Missing required context (employee shifts).")
    }

    const shifts = await prisma.employeeShift.findMany({
      where: { id: { in: employeeShiftIds } },
      include: { shift: true, employee: { select: { username: true } } },
    })

    const recordsToCreate = []
    const currentMonth = new Date().getMonth()
    const coreUsernames = ["admin", "hr_manager", "general_manager", "team_leader", "employee"]
    const counters: Record<string, { late: number; overtime: number; absent: number }> = {}

    for (const shift of shifts) {
      // Don't seed attendance for future dates
      if (shift.assignedDate > new Date()) continue

      const isCoreUser = coreUsernames.includes(shift.employee.username)
      // Apply interesting data to both current month and previous month
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const isTargetMonth =
        shift.assignedDate.getMonth() === currentMonth ||
        shift.assignedDate.getMonth() === prevMonth

      let isAbsent = faker.number.float({ min: 0, max: 1 }) < 0.05
      let isLate = !isAbsent && faker.number.float({ min: 0, max: 1 }) < 0.1
      let isOvertime = false
      let overtimeMinutes = 0

      if (isCoreUser && isTargetMonth) {
        if (counters[shift.employeeId] === undefined)
          counters[shift.employeeId] = { late: 0, overtime: 0, absent: 0 }
        const c = counters[shift.employeeId]

        isAbsent = false
        isLate = false

        if (c.absent < 2 && faker.number.float({ min: 0, max: 1 }) < 0.1) {
          isAbsent = true
          c.absent++
        } else if (c.late < 4 && faker.number.float({ min: 0, max: 1 }) < 0.2) {
          isLate = true
          c.late++
        } else if (c.overtime < 4 && faker.number.float({ min: 0, max: 1 }) < 0.2) {
          isOvertime = true
          c.overtime++
        }
      }

      const workingShift = shift.shift

      const checkInDate = new Date(shift.assignedDate)
      checkInDate.setHours(
        Math.floor(workingShift.startTime / 60),
        workingShift.startTime % 60,
        0,
        0,
      )

      const checkOutDate = new Date(shift.assignedDate)
      if (workingShift.endTime < workingShift.startTime) {
        checkOutDate.setDate(checkOutDate.getDate() + 1)
      }
      checkOutDate.setHours(Math.floor(workingShift.endTime / 60), workingShift.endTime % 60, 0, 0)

      let checkInAt = null
      let checkOutAt = null
      let lateMinutes = 0
      let totalWorkMinutes = 0
      let status = "on_time" as any

      if (isAbsent) {
        status = "absent" as any
      } else {
        if (isLate) {
          lateMinutes = faker.number.int({ min: 15, max: 45 })
          checkInDate.setMinutes(checkInDate.getMinutes() + lateMinutes)
          status = "late" as any
        }

        if (isOvertime) {
          overtimeMinutes = faker.number.int({ min: 120, max: 240 }) // 2-4 hours overtime
          checkOutDate.setMinutes(checkOutDate.getMinutes() + overtimeMinutes)
        } else {
          // Random check out within 30 minutes after end time (not counted as overtime)
          checkOutDate.setMinutes(checkOutDate.getMinutes() + faker.number.int({ min: 0, max: 30 }))
        }

        checkInAt = checkInDate
        checkOutAt = checkOutDate

        totalWorkMinutes =
          getShiftDurationMinutes(workingShift.startTime, workingShift.endTime) -
          lateMinutes +
          overtimeMinutes
      }

      recordsToCreate.push({
        employeeId: shift.employeeId,
        employeeShiftId: shift.id,
        date: shift.assignedDate,
        checkInAt,
        checkInLat: checkInAt ? workingShift.gpsLat : null,
        checkInLng: checkInAt ? workingShift.gpsLng : null,
        checkOutAt,
        checkOutLat: checkOutAt ? workingShift.gpsLat : null,
        checkOutLng: checkOutAt ? workingShift.gpsLng : null,
        status,
        lateMinutes,
        earlyLeaveMinutes: 0,
        overtimeMinutes: 0,
        totalWorkMinutes,
      })
    }

    // Chunk records for creation since there might be many
    const chunkSize = 200
    for (let i = 0; i < recordsToCreate.length; i += chunkSize) {
      const chunk = recordsToCreate.slice(i, i + chunkSize)
      await prisma.attendanceRecord.createMany({
        data: chunk,
        skipDuplicates: true,
      })
    }

    const seededRecords = await prisma.attendanceRecord.findMany({
      where: {
        employeeShiftId: { in: employeeShiftIds },
        checkInAt: { not: null },
      },
      include: {
        employeeShift: {
          include: { shift: true },
        },
      },
    })

    const realShiftsToCreate = seededRecords.flatMap((record) => {
      if (!record.checkInAt) return []

      const actualStartTime = record.checkInAt.getHours() * 60 + record.checkInAt.getMinutes()
      const actualEndTime = record.checkOutAt
        ? record.checkOutAt.getHours() * 60 + record.checkOutAt.getMinutes()
        : null
      const shift = record.employeeShift.shift
      const isMatched = Boolean(
        actualEndTime != null &&
        actualStartTime === shift.startTime &&
        actualEndTime === shift.endTime,
      )

      return [
        {
          employeeId: record.employeeId,
          attendanceRecordId: record.id,
          date: record.date,
          actualStartTime,
          actualEndTime,
          isMatched,
        },
      ]
    })

    if (realShiftsToCreate.length > 0) {
      await prisma.realShift.createMany({
        data: realShiftsToCreate,
        skipDuplicates: true,
      })
    }

    console.log(`  Seeded ${recordsToCreate.length} attendance records.`)
    console.log(`  Seeded ${realShiftsToCreate.length} real shifts.`)

    return {}
  }
}

registry.register(new AttendanceRecordsSeeder())

if (import.meta.main) {
  const seeder = new AttendanceRecordsSeeder()
  const shifts = await prisma.employeeShift.findMany({ take: 100 })
  const ctx = createEmptyContext()
  ctx.employeeShiftIds = shifts.map((s) => s.id)
  await seeder.run(ctx)
  await prisma.$disconnect()
}
