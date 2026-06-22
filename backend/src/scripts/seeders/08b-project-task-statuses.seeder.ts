import { prisma } from "@/libs/database.ts"
import { SeedContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

export class ProjectTaskStatusesSeeder implements ISeeder {
  readonly name = "ProjectTaskStatuses"
  readonly order = 8.5

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding project task statuses...")

    const projectIds = context.projectIds || []
    if (projectIds.length === 0) {
      console.log("  No projects found to seed statuses.")
      return {}
    }

    const defaults = [
      { name: "To Do", color: "#6366F1", order: 0, isDefault: true, isCompleted: false },
      { name: "In Progress", color: "#3B82F6", order: 1, isDefault: false, isCompleted: false },
      { name: "In Review", color: "#F59E0B", order: 2, isDefault: false, isCompleted: false },
      { name: "Done", color: "#10B981", order: 3, isDefault: false, isCompleted: true },
      { name: "Cancelled", color: "#EF4444", order: 4, isDefault: false, isCompleted: true },
      { name: "Reopened", color: "#8B5CF6", order: 5, isDefault: false, isCompleted: false },
    ]

    let seededCount = 0

    for (const projectId of projectIds) {
      // Check if statuses already exist for this project
      const existingCount = await prisma.projectTaskStatus.count({
        where: { projectId },
      })

      if (existingCount === 0) {
        for (const item of defaults) {
          await prisma.projectTaskStatus.create({
            data: {
              projectId,
              ...item,
            },
          })
          seededCount++
        }
      }
    }

    console.log(`  Seeded ${seededCount} project task statuses across ${projectIds.length} projects.`)
    return {}
  }
}

registry.register(new ProjectTaskStatusesSeeder())
