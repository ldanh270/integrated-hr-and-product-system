import { prisma } from "@/libs/database.ts"
import { ATTENDANCE_STATUS, type IAttendanceStatus } from "@/configs/entities/attendance.config.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

import { faker } from "@faker-js/faker"

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
      include: { shift: true },
    })

    const recordsToCreate = []

    for (const shift of shifts) {
      // Don't seed attendance for future dates
      if (shift.assignedDate > new Date()) continue

      const isAbsent = Math.random() < 0.05 // 5% absent
      const isLate = !isAbsent && Math.random() < 0.1 // 10% late

      const workingShift = shift.shift

      const checkInDate = new Date(shift.assignedDate)
      checkInDate.setHours(
        Math.floor(workingShift.startTime / 60),
        workingShift.startTime % 60,
        0,
        0,
      )

      const checkOutDate = new Date(shift.assignedDate)
      checkOutDate.setHours(Math.floor(workingShift.endTime / 60), workingShift.endTime % 60, 0, 0)

      let checkInAt = null
      let checkOutAt = null
      let lateMinutes = 0
      let totalWorkMinutes = 0
      let status: IAttendanceStatus = ATTENDANCE_STATUS.ON_TIME

      if (isAbsent) {
        status = ATTENDANCE_STATUS.ABSENT
      } else {
        if (isLate) {
          lateMinutes = faker.number.int({ min: 10, max: 60 })
          checkInDate.setMinutes(checkInDate.getMinutes() + lateMinutes)
          status = ATTENDANCE_STATUS.LATE
        }

        checkInAt = checkInDate
        // Random check out within 30 minutes after end time
        checkOutDate.setMinutes(checkOutDate.getMinutes() + faker.number.int({ min: 0, max: 30 }))
        checkOutAt = checkOutDate

        totalWorkMinutes = workingShift.endTime - workingShift.startTime - lateMinutes
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

      const actualStartTime =
        record.checkInAt.getHours() * 60 + record.checkInAt.getMinutes()
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
