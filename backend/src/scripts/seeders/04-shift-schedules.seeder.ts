import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

export class ShiftSchedulesSeeder implements ISeeder {
  readonly name = "ShiftSchedules"
  readonly order = 4

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding shift schedules...")

    const adminId = context.adminId
    const employees = context.employees
    const workingShiftIds = context.workingShiftIds

    if (!adminId || employees.length === 0 || workingShiftIds.length === 0) {
      throw new Error("Missing required context (admin, employees, or working shifts).")
    }

    const shiftScheduleMap: Record<string, string> = {}

    // Create a schedule for each employee, assigning them to the "Morning Shift" (index 0) mostly
    const validFrom = new Date()
    validFrom.setMonth(validFrom.getMonth() - 2) // Valid from 2 months ago
    validFrom.setDate(1) // Start of month

    const schedules = await Promise.all(
      employees.map(async (emp, index) => {
        // Just pick one shift (typically Morning for most, Afternoon for some)
        const primaryShiftId = workingShiftIds[index % Math.min(2, workingShiftIds.length)]

        const schedule = await prisma.shiftSchedule.create({
          data: {
            employeeId: emp.id,
            validFrom,
            createdById: adminId,
            days: {
              create: [
                ...[1, 2, 3, 4, 5].map((dayOfWeek) => ({
                  dayOfWeek,
                  shiftId: primaryShiftId,
                })),
                // Saturday: night shift when available (index 2)
                ...(workingShiftIds[2]
                  ? [{ dayOfWeek: 6, shiftId: workingShiftIds[2] }]
                  : []),
              ],
            },
          },
        })

        shiftScheduleMap[emp.id] = schedule.id
        return schedule
      }),
    )

    console.log(`  Seeded ${schedules.length} shift schedules.`)

    return { shiftScheduleMap }
  }
}

registry.register(new ShiftSchedulesSeeder())

if (import.meta.main) {
  const seeder = new ShiftSchedulesSeeder()

  // Provide mock context for standalone execution
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  const emps = await prisma.employee.findMany({
    take: 10,
    select: { id: true, role: true, username: true },
  })
  const shifts = await prisma.workingShift.findMany({ take: 2 })

  const ctx = createEmptyContext()
  if (admin) ctx.adminId = admin.id
  ctx.employees = emps
  ctx.workingShiftIds = shifts.map((s) => s.id)

  await seeder.run(ctx)
  await prisma.$disconnect()
}
