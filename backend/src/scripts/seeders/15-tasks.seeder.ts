import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

import { faker } from "@faker-js/faker"

export class TasksSeeder implements ISeeder {
  readonly name = "Tasks"
  readonly order = 15

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding tasks...")

    const adminId = context.adminId
    const projectIds = context.projectIds

    if (!adminId || projectIds.length === 0) {
      throw new Error("Missing required context (admin or projects).")
    }

    const tasksToCreate = []

    for (const projectId of projectIds) {
      // Find members of this project
      const members = await prisma.projectMember.findMany({
        where: { projectId },
        select: { employeeId: true },
      })

      if (members.length === 0) continue

      const numTasks = faker.number.int({ min: 5, max: 15 })

      for (let i = 0; i < numTasks; i++) {
        const isDone = Math.random() > 0.5
        const statuses = ["todo", "in_progress", "in_review", "done"]
        const status = isDone
          ? "done"
          : faker.helpers.arrayElement(["todo", "in_progress", "in_review"])

        tasksToCreate.push({
          projectId,
          title: faker.hacker.phrase(),
          description: faker.lorem.paragraph(),
          priority: faker.helpers.arrayElement(["low", "medium", "high", "urgent"]) as any,
          status: status as any,
          assigneeId: faker.helpers.arrayElement(members).employeeId,
          createdById: adminId,
          dueDate: faker.date.soon({ days: 30 }),
          completedAt: isDone ? faker.date.recent() : null,
        })
      }
    }

    const result = await prisma.task.createMany({
      data: tasksToCreate,
    })

    console.log(`  Seeded ${result.count} tasks.`)

    return {}
  }
}

registry.register(new TasksSeeder())

if (import.meta.main) {
  const seeder = new TasksSeeder()
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  const projects = await prisma.project.findMany()
  const ctx = createEmptyContext()
  if (admin) ctx.adminId = admin.id
  ctx.projectIds = projects.map((p) => p.id)
  await seeder.run(ctx)
  await prisma.$disconnect()
}
