import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

export class HolidayCalendarsSeeder implements ISeeder {
  readonly name = "HolidayCalendars"
  readonly order = 3

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding holiday calendars...")

    const adminId = context.adminId
    if (!adminId) throw new Error("Admin ID is missing in context.")

    const currentYear = new Date().getFullYear()

    const holidaysToCreate = [
      // Tet holidays
      {
        date: new Date(`${currentYear}-01-01`),
        name: "New Year",
        type: "national" as any,
        createdById: adminId,
      },
      {
        date: new Date(`${currentYear}-02-10`),
        name: "Lunar New Year Eve",
        type: "national" as any,
        createdById: adminId,
      },
      {
        date: new Date(`${currentYear}-02-11`),
        name: "Lunar New Year Day 1",
        type: "national" as any,
        createdById: adminId,
      },
      {
        date: new Date(`${currentYear}-02-12`),
        name: "Lunar New Year Day 2",
        type: "national" as any,
        createdById: adminId,
      },
      {
        date: new Date(`${currentYear}-02-13`),
        name: "Lunar New Year Day 3",
        type: "national" as any,
        createdById: adminId,
      },
      // Other holidays
      {
        date: new Date(`${currentYear}-04-30`),
        name: "Reunification Day",
        type: "national" as any,
        createdById: adminId,
      },
      {
        date: new Date(`${currentYear}-05-01`),
        name: "Labor Day",
        type: "national" as any,
        createdById: adminId,
      },
      {
        date: new Date(`${currentYear}-09-02`),
        name: "National Day",
        type: "national" as any,
        createdById: adminId,
      },
      // Company specific
      {
        date: new Date(`${currentYear}-08-15`),
        name: "Company Anniversary",
        type: "company" as any,
        createdById: adminId,
      },
    ]

    const createdHolidays = await prisma.$transaction(
      holidaysToCreate.map((data) =>
        prisma.holidayCalendar.upsert({
          where: { date: data.date },
          update: data,
          create: data,
        }),
      ),
      { timeout: 120000 },
    )

    console.log(`  Seeded ${createdHolidays.length} holidays.`)
    return {}
  }
}

registry.register(new HolidayCalendarsSeeder())

if (import.meta.main) {
  const seeder = new HolidayCalendarsSeeder()
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  const ctx = createEmptyContext()
  if (admin) ctx.adminId = admin.id
  await seeder.run(ctx)
  await prisma.$disconnect()
}
