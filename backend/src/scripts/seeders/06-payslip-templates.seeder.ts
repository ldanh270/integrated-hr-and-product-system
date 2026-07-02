import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

export class PayslipTemplatesSeeder implements ISeeder {
  readonly name = "PayslipTemplates"
  readonly order = 6

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding payslip templates...")

    const adminId = context.adminId
    const salaryComponentIds = context.salaryComponentIds

    if (!adminId || salaryComponentIds.length === 0) {
      throw new Error("Missing required context (admin or salary components).")
    }

    const standardTemplate = await prisma.payslipTemplate.upsert({
      where: { name: "Standard Full-Time" },
      update: { description: "Mẫu lương chuẩn cho nhân viên Full-time", createdById: adminId },
      create: {
        name: "Standard Full-Time",
        description: "Mẫu lương chuẩn cho nhân viên Full-time",
        createdById: adminId,
      },
    })

    // Assign all components to this template
    await prisma.$transaction(
      salaryComponentIds.map((componentId) =>
        prisma.payslipTemplateComponent.upsert({
          where: {
            templateId_componentId: {
              templateId: standardTemplate.id,
              componentId: componentId,
            },
          },
          update: {},
          create: {
            templateId: standardTemplate.id,
            componentId: componentId,
          },
        }),
      ),
      { timeout: 120000 },
    )

    console.log(`  Seeded 1 payslip template with ${salaryComponentIds.length} components.`)

    return {
      payslipTemplateIds: [standardTemplate.id],
    }
  }
}

registry.register(new PayslipTemplatesSeeder())

if (import.meta.main) {
  const seeder = new PayslipTemplatesSeeder()
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  const components = await prisma.salaryComponent.findMany()
  const ctx = createEmptyContext()
  if (admin) ctx.adminId = admin.id
  ctx.salaryComponentIds = components.map((c) => c.id)
  await seeder.run(ctx)
  await prisma.$disconnect()
}
