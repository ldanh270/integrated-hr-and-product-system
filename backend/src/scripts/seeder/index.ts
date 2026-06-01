import dotenv from "dotenv"
import mongoose from "mongoose"

import { clearDatabase } from "../clear-db.ts"
import { seedAttendance } from "./seeders/attendance.seeder.ts"
import { seedAuth } from "./seeders/auth.seeder.ts"
import { seedEmployees } from "./seeders/employee.seeder.ts"
import { seedPayroll } from "./seeders/payroll.seeder.ts"
import { seedProduct } from "./seeders/product.seeder.ts"
import { seedRecruitment } from "./seeders/recruitment.seeder.ts"

dotenv.config()

const SEEDERS: { [key: string]: (passedEmployeesOrCount?: any) => Promise<any> } = {
  employee: seedEmployees,
  attendance: seedAttendance,
  payroll: seedPayroll,
  recruitment: seedRecruitment,
  product: seedProduct,
  auth: seedAuth,
}

const showHelp = () => {
  console.log(`
🛠️  HRM Database Seeder CLI
Usage: bun run src/scripts/seeder/index.ts [options]

Options:
  --all            Seed all entities in dependency order (Employee -> Shift/Payroll/Recruitment/Product/Auth)
  --clear          Clear/Drop all collections in the database before seeding (or run as standalone clear)
  --entity <names> Seed specific entity domains. Separate multiple domains with commas.
                   Available domains: ${Object.keys(SEEDERS).join(", ")}
  --help, -h       Show this help message

Examples:
  # Reset database and seed all mock data:
  bun run src/scripts/seeder/index.ts --clear --all

  # Seed only employees:
  bun run src/scripts/seeder/index.ts --entity employee

  # Seed employees and attendance:
  bun run src/scripts/seeder/index.ts --entity employee,attendance
  `)
}

const run = async () => {
  const args = process.argv.slice(2)

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    showHelp()
    process.exit(0)
  }

  const isClear = args.includes("--clear")
  const isAll = args.includes("--all")

  const entityIndex = args.indexOf("--entity")
  const entityArg = entityIndex !== -1 ? args[entityIndex + 1] : null

  const mongoUri = process.env.MONGODB_CONNECTION_STRING
  if (!mongoUri) {
    console.error("❌ Error: Missing MONGODB_CONNECTION_STRING environment variable")
    process.exit(1)
  }

  try {
    console.log("🔌 Connecting to MongoDB...")
    await mongoose.connect(mongoUri)
    console.log("🚀 Connected successfully")

    // 1. Clear database if requested
    if (isClear) {
      await clearDatabase()
      console.log("✨ Database cleared successfully!")
      // If only clearing, we can exit here
      if (!isAll && !entityArg) {
        await mongoose.disconnect()
        process.exit(0)
      }
    }

    // 2. Determine domains to seed
    let domainsToSeed: string[] = []
    if (isAll) {
      domainsToSeed = ["employee", "attendance", "payroll", "recruitment", "product", "auth"]
    } else if (entityArg) {
      domainsToSeed = entityArg.split(",").map((name) => name.trim().toLowerCase())

      // Validate domains
      for (const domain of domainsToSeed) {
        if (!SEEDERS[domain]) {
          console.error(
            `❌ Error: Unknown entity domain "${domain}". Available: ${Object.keys(SEEDERS).join(", ")}`,
          )
          await mongoose.disconnect()
          process.exit(1)
        }
      }
    }

    // 3. Execute seeders in correct order
    // Ensure 'employee' runs first if it's in the list of domains to seed
    const sortedDomains = [...domainsToSeed].sort((a, b) => {
      if (a === "employee") return -1
      if (b === "employee") return 1
      return 0
    })

    let currentEmployees: any[] | undefined = undefined

    for (const domain of sortedDomains) {
      console.log(`\n🏁 Starting seeder for domain: [${domain.toUpperCase()}]`)
      const seedFunc = SEEDERS[domain]

      // If we just seeded employees in this run, pass them to next seeders to avoid database hits
      const result = await seedFunc(currentEmployees)

      if (domain === "employee") {
        currentEmployees = result
      }
    }

    console.log("\n✨ Database seeding operations completed!")
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("\n❌ Seeder execution failed:", error)
    try {
      await mongoose.disconnect()
    } catch {}
    process.exit(1)
  }
}

run()
