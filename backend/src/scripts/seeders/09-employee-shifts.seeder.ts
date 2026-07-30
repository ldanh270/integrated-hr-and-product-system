import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

export class EmployeeShiftsSeeder implements ISeeder {
  readonly name = "EmployeeShifts"
  readonly order = 9

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding employee shifts...")

    const adminId = context.adminId
    const employees = context.employees
    const shiftScheduleMap = context.shiftScheduleMap

    if (!adminId || employees.length === 0 || Object.keys(shiftScheduleMap).length === 0) {
      throw new Error("Missing required context (admin, employees, or shift schedules).")
    }

    const employeeShiftIds: string[] = []

    // We will generate shifts for the current month up to today
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    // Fetch schedule days to know which shifts to assign on which days
    const schedules = await prisma.shiftSchedule.findMany({
      where: { id: { in: Object.values(shiftScheduleMap) } },
      include: { days: true },
    })

    const schedulesById = schedules.reduce(
      (acc, sch) => {
        acc[sch.id] = sch
        return acc
      },
      {} as Record<string, any>,
    )

    const shiftsToCreate = []

    for (const emp of employees) {
      const scheduleId = shiftScheduleMap[emp.id]
      if (!scheduleId) continue

      const schedule = schedulesById[scheduleId]
      if (!schedule) continue

      const dayMap = schedule.days.reduce((acc: any, day: any) => {
        acc[day.dayOfWeek] = day.shiftId
        return acc
      }, {})

      // Generate shifts from 3 months ago to today
      const startDate = new Date(currentYear, currentMonth - 3, 1)
      const endDate = new Date(currentYear, currentMonth, today.getDate())

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const date = new Date(d)
        const dayOfWeek = date.getDay()

        const shiftId = dayMap[dayOfWeek]
        if (shiftId) {
          // They have a shift on this day
          shiftsToCreate.push({
            employeeId: emp.id,
            shiftId,
            assignedDate: date,
            scheduleId,
            status: "scheduled" as any,
            createdById: adminId,
          })
        }
      }
    }

    // Insert in chunks if too large, but for 15 employees * ~20 days = 300 records, single transaction is fine
    const result = await prisma.employeeShift.createMany({
      data: shiftsToCreate,
      skipDuplicates: true,
    })

    console.log(`  Seeded ${result.count} new employee shifts.`)

    const allShifts = await prisma.employeeShift.findMany({
      where: { employeeId: { in: employees.map((e) => e.id) } },
      select: { id: true },
    })

    return {
      employeeShiftIds: allShifts.map((s) => s.id),
    }
  }
}

registry.register(new EmployeeShiftsSeeder())

if (import.meta.main) {
  const seeder = new EmployeeShiftsSeeder()
  // Mock context
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  const emps = await prisma.employee.findMany({
    select: { id: true, position: true, username: true },
  })
  const schedules = await prisma.shiftSchedule.findMany()

  const ctx = createEmptyContext()
  if (admin) ctx.adminId = admin.id
  ctx.employees = emps
  schedules.forEach((s) => (ctx.shiftScheduleMap[s.employeeId] = s.id))

  await seeder.run(ctx)
  await prisma.$disconnect()
}
