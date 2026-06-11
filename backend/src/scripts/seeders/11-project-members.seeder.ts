import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

import { faker } from "@faker-js/faker"

export class ProjectMembersSeeder implements ISeeder {
  readonly name = "ProjectMembers"
  readonly order = 11

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding project members...")

    const employees = context.employees
    const projectIds = context.projectIds

    if (employees.length === 0 || projectIds.length === 0) {
      throw new Error("Missing required context (employees or projects).")
    }

    const membersToCreate = []

    for (const projectId of projectIds) {
      // Assign 3-6 random employees to each project
      const numMembers = faker.number.int({ min: 3, max: 6 })
      const shuffledEmployees = [...employees].sort(() => 0.5 - Math.random())
      const selectedEmployees = shuffledEmployees.slice(0, numMembers)

      for (const emp of selectedEmployees) {
        membersToCreate.push({
          projectId,
          employeeId: emp.id,
          joinedAt: faker.date.past({ years: 1 }),
        })
      }
    }

    // Upsert using raw query or individual transactions since there's no single field unique constraint other than composite primary key
    const result = await prisma.projectMember.createMany({
      data: membersToCreate,
      skipDuplicates: true,
    })

    console.log(`  Seeded ${result.count} project members.`)

    return {}
  }
}

registry.register(new ProjectMembersSeeder())

if (import.meta.main) {
  const seeder = new ProjectMembersSeeder()
  const emps = await prisma.employee.findMany({ select: { id: true, role: true, username: true } })
  const projects = await prisma.project.findMany()

  const ctx = createEmptyContext()
  ctx.employees = emps
  ctx.projectIds = projects.map((p) => p.id)

  await seeder.run(ctx)
  await prisma.$disconnect()
}
