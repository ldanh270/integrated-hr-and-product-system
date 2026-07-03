import { EmployeeType, Role, WorkScheduleType } from "@prisma/client"

import { EMPLOYEE_TYPES, EMPLOYEE_TYPE, ROLE, WORK_SCHEDULE_TYPE } from "@/configs/entities/employee.config.ts"
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

    // Ensure all 5 core role accounts exist (especially since seed-all clears the DB)
    const rolesToSeed = [
      ROLE.ADMIN,
      ROLE.HR_MANAGER,
      ROLE.GENERAL_MANAGER,
      ROLE.TEAM_LEADER,
      ROLE.EMPLOYEE,
    ]
    let adminId = ""
    const passwordHashCore = await HashUtil.hash("Admin123@")

    for (const role of rolesToSeed) {
      const username = role === ROLE.ADMIN ? "admin" : role
      const fullName = role
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      let existing = await prisma.employee.findFirst({ where: { username } })

      if (!existing) {
        let phoneSuffix = "0"
        if (role === ROLE.ADMIN) phoneSuffix = "1"
        else if (role === ROLE.HR_MANAGER) phoneSuffix = "2"
        else if (role === ROLE.GENERAL_MANAGER) phoneSuffix = "3"
        else if (role === ROLE.TEAM_LEADER) phoneSuffix = "4"
        else if (role === ROLE.EMPLOYEE) phoneSuffix = "5"

        existing = await prisma.employee.create({
          data: {
            username,
            passwordHash: passwordHashCore,
            role: role as any,
            fullName: `${fullName} User`,
            email: `${username}@example.com`,
            phone: `012345678${phoneSuffix}`,
            address: "System Generated",
            position: fullName,
          },
        })
        console.log(`  [!] Core account missing, created default account: ${username}`)
      }

      if (role === ROLE.ADMIN) {
        adminId = existing.id
      }
    }

    // Fixed part-time account for PT-by-project flows and E2E tests.
    const partTimeUsername = "part_time"
    let partTimeAccount = await prisma.employee.findFirst({ where: { username: partTimeUsername } })
    if (!partTimeAccount) {
      partTimeAccount = await prisma.employee.create({
        data: {
          username: partTimeUsername,
          passwordHash: passwordHashCore,
          role: ROLE.EMPLOYEE as Role,
          employeeType: EMPLOYEE_TYPE.FULL_TIME as EmployeeType,
          workScheduleType: WORK_SCHEDULE_TYPE.PART_TIME as WorkScheduleType, // PT schedule, not contract type
          fullName: "Part Time User",
          email: "part_time@example.com",
          phone: "0123456786",
          address: "System Generated",
          position: "Part-time Developer",
        },
      })
      console.log(`  [!] Created part-time account: ${partTimeUsername}`)
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
      adminId,
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
