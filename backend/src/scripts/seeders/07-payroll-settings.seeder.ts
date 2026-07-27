import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

export class PayrollSettingsSeeder implements ISeeder {
  readonly name = "PayrollSettings"
  readonly order = 7

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding payroll settings...")

    const adminId = context.adminId
    if (!adminId) throw new Error("Admin ID is missing in context.")

    await prisma.payrollSettings.upsert({
      where: { id: "GLOBAL" },
      update: {
        triggerDay: 5,
        triggerHour: 0,
        triggerMinute: 0,
        approvalDay: 10,
        approvalHour: 0,
        approvalMinute: 0,
        updatedById: adminId,
      },
      create: {
        id: "GLOBAL",
        triggerDay: 5,
        triggerHour: 0,
        triggerMinute: 0,
        approvalDay: 10,
        approvalHour: 0,
        approvalMinute: 0,
        updatedById: adminId,
      },
    })

    console.log(`  Seeded global payroll settings.`)
    return {}
  }
}

registry.register(new PayrollSettingsSeeder())

if (import.meta.main) {
  const seeder = new PayrollSettingsSeeder()
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  const ctx = createEmptyContext()
  if (admin) ctx.adminId = admin.id
  await seeder.run(ctx)
  await prisma.$disconnect()
}
