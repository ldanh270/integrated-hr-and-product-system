import { prisma } from "../libs/database.ts"
import { clearDatabase } from "./clear-db.ts"
import { SeedContext, createEmptyContext, registry } from "./seeders/index.ts"

async function main() {
  console.log("Starting full database seed...")
  let context: SeedContext = createEmptyContext()

  try {
    const sortedSeeders = registry.getSorted()

    if (sortedSeeders.length === 0) {
      console.log("No seeders registered.")
      return
    }

    // Clear the database before seeding
    await clearDatabase()

    for (const seeder of sortedSeeders) {
      console.log(`\n[→] Running: ${seeder.name}`)
      const result = await seeder.run(context)
      context = { ...context, ...result }
      console.log(`[✓] Done: ${seeder.name}`)
    }

    console.log("\nAll seeders completed successfully.")
  } catch (error) {
    console.error("Error during seeding:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
