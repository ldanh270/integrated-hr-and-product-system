import { prisma } from "@/libs/database.ts"
import { SeedContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

export class CustomSalaryFieldsSeeder implements ISeeder {
  readonly name = "CustomSalaryFields"
  readonly order = 8

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding custom salary fields...")

    const fields = [
      {
        code: "meal_allowance",
        name: "Phụ cấp ăn trưa",
        defaultValue: 1000000,
        description: "Hỗ trợ chi phí ăn trưa hàng tháng cho nhân sự.",
      },
      {
        code: "transport_allowance",
        name: "Phụ cấp đi lại",
        defaultValue: 500000,
        description: "Hỗ trợ chi phí đi lại, xăng xe hàng tháng.",
      },
      {
        code: "housing_allowance",
        name: "Phụ cấp nhà ở",
        defaultValue: 0,
        description: "Hỗ trợ chi phí thuê nhà, nhà ở cho nhân sự.",
      },
      {
        code: "phone_allowance",
        name: "Phụ cấp điện thoại",
        defaultValue: 0,
        description: "Hỗ trợ chi phí liên lạc bằng điện thoại phục vụ công việc.",
      },
      {
        code: "responsibility_allowance",
        name: "Phụ cấp trách nhiệm",
        defaultValue: 0,
        description: "Hỗ trợ trách nhiệm công việc cho các vị trí quản lý hoặc đặc thù.",
      },
      {
        code: "seniority_allowance",
        name: "Phụ cấp thâm niên",
        defaultValue: 0,
        description: "Phụ cấp thâm niên làm việc tại công ty.",
      },
      {
        code: "uniform_allowance",
        name: "Phụ cấp trang phục",
        defaultValue: 300000,
        description: "Hỗ trợ trang phục, đồng phục hàng tháng cho nhân sự.",
      },
      {
        code: "hazardous_allowance",
        name: "Phụ cấp độc hại",
        defaultValue: 500000,
        description: "Phụ cấp làm việc trong môi trường đặc thù, độc hại.",
      },
      {
        code: "project_bonus",
        name: "Thưởng dự án",
        defaultValue: 1000000,
        description: "Khoản thưởng đột xuất hoặc định kỳ theo tiến độ dự án.",
      },
      {
        code: "parking_allowance",
        name: "Phụ cấp gửi xe",
        defaultValue: 150000,
        description: "Hỗ trợ chi phí gửi xe ngoài cơ quan hàng tháng.",
      },
    ]

    const seededFields = await Promise.all(
      fields.map(async (field) => {
        return prisma.customSalaryField.upsert({
          where: { code: field.code },
          update: {
            name: field.name,
            defaultValue: field.defaultValue,
            description: field.description,
            isActive: true,
          },
          create: field,
        })
      }),
    )

    console.log(`  Seeded ${seededFields.length} custom salary fields.`)
    return {}
  }
}

registry.register(new CustomSalaryFieldsSeeder())

if (import.meta.main) {
  const seeder = new CustomSalaryFieldsSeeder()
  await seeder.run({} as any)
  await prisma.$disconnect()
}
