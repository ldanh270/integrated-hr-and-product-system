import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"
import { generateDefaultPayrollName } from "@/configs/entities/payroll.config.ts"

export class PayrollsSeeder implements ISeeder {
  readonly name = "Payrolls"
  readonly order = 14

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding payrolls...")

    const adminId = context.adminId

    if (!adminId) {
      throw new Error("Missing required context (admin).")
    }

    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1 // 1-12

    const payrollsToCreate = []

    // Create payrolls for the last 3 months
    for (let i = 1; i <= 3; i++) {
      let month = currentMonth - i
      let year = currentYear
      if (month <= 0) {
        month += 12
        year -= 1
      }

      payrollsToCreate.push({
        name: generateDefaultPayrollName(month, year),
        periodMonth: month,
        periodYear: year,
        status: "approved" as any,
        totalAmount: 0, // Will be updated by Payslips seeder
        approvedById: adminId,
        approvedAt: new Date(),
      })
    }

    const createdPayrolls = await prisma.$transaction(
      payrollsToCreate.map(
        (data) =>
          prisma.payroll.upsert({
            where: {
              periodYear_periodMonth_name: {
                periodYear: data.periodYear,
                periodMonth: data.periodMonth,
                name: data.name,
              },
            },
            update: data,
            create: data,
          }),
        { timeout: 30000 },
      ),
    )

    console.log(`  Seeded ${createdPayrolls.length} payrolls.`)

    return {
      payrollIds: createdPayrolls.map((p) => p.id),
    }
  }
}

registry.register(new PayrollsSeeder())

if (import.meta.main) {
  const seeder = new PayrollsSeeder()
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  const ctx = createEmptyContext()
  if (admin) ctx.adminId = admin.id
  await seeder.run(ctx)
  await prisma.$disconnect()
}
