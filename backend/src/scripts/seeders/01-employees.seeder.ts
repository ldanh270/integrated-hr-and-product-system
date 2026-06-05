import { EMPLOYEE_TYPES, ROLE } from "@/configs/entities/employee.config.ts"
import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"
import { HashUtil } from "@/utils/hash.util.ts"

import { faker } from "@faker-js/faker"

export class EmployeesSeeder implements ISeeder {
  readonly name = "Employees"
  readonly order = 1

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding employees...")

    // Check if admin exists to grab its ID for context (or seed admin if not)
    let admin = await prisma.employee.findFirst({ where: { username: "admin" } })
    if (!admin) {
      const passwordHash = await HashUtil.hash("Admin123@")
      admin = await prisma.employee.create({
        data: {
          username: "admin",
          passwordHash,
          role: ROLE.ADMIN as any,
          fullName: "System Admin",
          email: "admin@example.com",
          phone: "0123456789",
          address: "System Generated",
          position: "Admin",
        },
      })
      console.log("  [!] Admin missing, created default admin account.")
    }

    // Seed 15 random employees
    const passwordHash = await HashUtil.hash("Employee123@")
    const numEmployeesToCreate = 15
    const employeesData = Array.from({ length: numEmployeesToCreate }).map((_, index) => {
      const firstName = faker.person.firstName()
      const lastName = faker.person.lastName()
      const username =
        faker.internet
          .username({ firstName, lastName })
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "") + index

      // Determine role (mostly employees, some team leaders)
      const isTeamLeader = index % 5 === 0
      const role = isTeamLeader ? ROLE.TEAM_LEADER : ROLE.EMPLOYEE

      const type = faker.helpers.arrayElement(EMPLOYEE_TYPES)

      return {
        fullName: `${firstName} ${lastName}`,
        username,
        passwordHash,
        role: role as any,
        email: faker.internet.email({ firstName, lastName, provider: "example.com" }),
        phone: faker.phone.number({ style: "national" }),
        address: faker.location.streetAddress(),
        position: isTeamLeader ? "Team Leader" : faker.person.jobTitle(),
        employeeType: type as any,
        dateOfBirth: faker.date.birthdate({ min: 22, max: 55, mode: "age" }),
        startDate: faker.date.past({ years: 3 }),
        status: "active" as any,
      }
    })

    const createdEmployees = await prisma.$transaction(
      employeesData.map((data) => prisma.employee.create({ data })),
      { timeout: 30000 },
    )

    console.log(`  Seeded ${createdEmployees.length} random employees.`)

    // Prepare context updates
    const allEmployees = await prisma.employee.findMany({
      select: { id: true, role: true, username: true },
    })

    return {
      adminId: admin.id,
      employees: allEmployees,
    }
  }
}

registry.register(new EmployeesSeeder())

// Standalone execution
if (import.meta.main) {
  const seeder = new EmployeesSeeder()
  await seeder.run(createEmptyContext())
  await prisma.$disconnect()
}
