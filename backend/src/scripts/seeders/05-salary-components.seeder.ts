import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

export class SalaryComponentsSeeder implements ISeeder {
  readonly name = "SalaryComponents"
  readonly order = 5

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding salary components...")

    const adminId = context.adminId
    if (!adminId) throw new Error("Admin ID is missing in context.")

    const componentsToCreate = [
      {
        name: "Base Salary",
        type: "addition" as any,
        formula: "baseSalary * (actualWorkingDays / standardWorkingDays)",
        description: "Lương cơ bản theo ngày công thực tế",
        createdById: adminId,
      },
      {
        name: "Meal Allowance",
        type: "addition" as any,
        formula: "mealAllowance",
        description: "Phụ cấp ăn trưa",
        createdById: adminId,
      },
      {
        name: "Transport Allowance",
        type: "addition" as any,
        formula: "transportAllowance",
        description: "Phụ cấp đi lại",
        createdById: adminId,
      },
      {
        name: "Overtime Pay",
        type: "addition" as any,
        formula:
          "(baseSalary / standardWorkingDays / standardWorkingHours) * 1.5 * (overtimeMinutes / 60)",
        description: "Tiền làm thêm giờ (150%)",
        createdById: adminId,
      },
      {
        name: "Social Insurance (BHXH)",
        type: "deduction" as any,
        formula: "baseSalary * socialInsuranceRate",
        description: "BHXH (8%)",
        createdById: adminId,
      },
      {
        name: "Health Insurance (BHYT)",
        type: "deduction" as any,
        formula: "baseSalary * healthInsuranceRate",
        description: "BHYT (1.5%)",
        createdById: adminId,
      },
      {
        name: "Unemployment Insurance (BHTN)",
        type: "deduction" as any,
        formula: "baseSalary * unemploymentInsuranceRate",
        description: "BHTN (1%)",
        createdById: adminId,
      },
      {
        name: "Personal Income Tax (PIT)",
        type: "deduction" as any,
        formula: "MAX(0, (totalAdditions - 11000000 - (baseSalary * 0.105)) * 0.05)",
        description: "Thuế TNCN tạm tính",
        createdById: adminId,
      },
      {
        name: "Late/Early Penalty",
        type: "deduction" as any,
        formula:
          "(baseSalary / standardWorkingDays / standardWorkingHours) * (lateMinutes + earlyLeaveMinutes) / 60",
        description: "Phạt đi muộn/về sớm",
        createdById: adminId,
      },
    ]

    const createdComponents = await prisma.$transaction(
      componentsToCreate.map((data) =>
        prisma.salaryComponent.upsert({
          where: { name: data.name },
          update: data,
          create: data,
        }),
      ),
      { timeout: 120000 },
    )

    console.log(`  Seeded ${createdComponents.length} salary components.`)

    return {
      salaryComponentIds: createdComponents.map((c) => c.id),
    }
  }
}

registry.register(new SalaryComponentsSeeder())

if (import.meta.main) {
  const seeder = new SalaryComponentsSeeder()
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  const ctx = createEmptyContext()
  if (admin) ctx.adminId = admin.id
  await seeder.run(ctx)
  await prisma.$disconnect()
}
