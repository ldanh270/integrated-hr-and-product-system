import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

export class WorkingShiftsSeeder implements ISeeder {
  readonly name = "WorkingShifts"
  readonly order = 2

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding working shifts...")

    const adminId = context.adminId
    if (!adminId) {
      throw new Error("Admin ID is missing in context.")
    }

    const shiftsToCreate = [
      {
        name: "Morning Shift (08:00 - 17:00)",
        startTime: 8 * 60, // 480
        endTime: 17 * 60, // 1020
        gracePeriodMinutes: 15,
        gpsLat: 15.975011, // FPT University Da Nang
        gpsLng: 108.253215,
        gpsRadiusMeters: 500,
        isActive: true,
        createdById: adminId,
      },
      {
        name: "Afternoon Shift (13:00 - 21:00)",
        startTime: 13 * 60, // 780
        endTime: 21 * 60, // 1260
        gracePeriodMinutes: 15,
        gpsLat: 15.975011,
        gpsLng: 108.253215,
        gpsRadiusMeters: 500,
        isActive: true,
        createdById: adminId,
      },
      {
        name: "Night Shift (22:00 - 06:00)",
        startTime: 22 * 60, // 1320
        endTime: 6 * 60, // 360 (next day implicitly handled by logic)
        gracePeriodMinutes: 15,
        gpsLat: 15.975011,
        gpsLng: 108.253215,
        gpsRadiusMeters: 500,
        isActive: true,
        createdById: adminId,
      },
    ]

    const createdShifts = await prisma.$transaction(
      shiftsToCreate.map((data) => prisma.workingShift.create({ data })),
      { timeout: 120000 },
    )

    console.log(`  Seeded ${createdShifts.length} working shifts.`)

    return {
      workingShiftIds: createdShifts.map((s) => s.id),
    }
  }
}

registry.register(new WorkingShiftsSeeder())

if (import.meta.main) {
  const seeder = new WorkingShiftsSeeder()
  // Mock context with admin for standalone run
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  const ctx = createEmptyContext()
  if (admin) ctx.adminId = admin.id
  await seeder.run(ctx)
  await prisma.$disconnect()
}
