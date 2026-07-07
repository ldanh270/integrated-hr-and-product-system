import { EMPLOYEE_TYPE, WORK_SCHEDULE_TYPE } from "../configs/entities/employee.config.ts"
import { prisma } from "../libs/database.ts"
import { HashUtil } from "../utils/hash.util.ts"
import { getSeedPassword } from "./seeders/seed-password.util.ts"

const PASSWORD = getSeedPassword("SEED_CORE_ACCOUNTS_PASSWORD")

async function seedAdminAccounts() {
  console.log("Seeding admin and role accounts...")

  try {
    const passwordHash = await HashUtil.hash(PASSWORD)

    const rolesToSeed = [
      "admin",
      "hr_manager",
      "general_manager",
      "team_leader",
      "employee",
    ]

    for (const role of rolesToSeed) {
      const username = role === "admin" ? "admin" : role
      const fullName = role
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      const existing = await prisma.employee.findFirst({
        where: { username },
      })

      let phoneSuffix = "0"
      if (role === "admin") phoneSuffix = "1"
      else if (role === "hr_manager") phoneSuffix = "2"
      else if (role === "general_manager") phoneSuffix = "3"
      else if (role === "team_leader") phoneSuffix = "4"
      else if (role === "employee") phoneSuffix = "5"

      const data = {
        username,
        passwordHash,
        fullName: `${fullName} User`,
        email: `${username}@example.com`,
        phone: `012345678${phoneSuffix}`,
        address: "System Generated",
        position: fullName,
      }

      if (existing) {
        console.log(`Account ${username} exists. Updating instead of deleting...`)
        await prisma.employee.update({
          where: { id: existing.id },
          data,
        })
      } else {
        await prisma.employee.create({
          data,
        })
      }
      console.log(`[✓] Created account: ${username} (Role: ${role})`)
    }

    const partTimeUsername = "part_time"
    // Demo account: employment category full_time, schedule part_time (legacy used employeeType).
    const partTimeData = {
      username: partTimeUsername,
      passwordHash,
      employeeType: EMPLOYEE_TYPE.FULL_TIME,
      workScheduleType: WORK_SCHEDULE_TYPE.PART_TIME,
      fullName: "Part Time User",
      email: "part_time@example.com",
      phone: "0123456786",
      address: "System Generated",
      position: "Part-time Developer",
    }
    const partTimeExisting = await prisma.employee.findFirst({ where: { username: partTimeUsername } })

    if (partTimeExisting) {
      await prisma.employee.update({ where: { id: partTimeExisting.id }, data: partTimeData })
    } else {
      await prisma.employee.create({ data: partTimeData })
    }
    console.log(`[✓] Created account: ${partTimeUsername} (Schedule: part_time)`)

    console.log("\nAdmin and role accounts seeded successfully.")
    console.log(`Password for all accounts: ${PASSWORD}`)
  } catch (error) {
    console.error("Error seeding admin accounts:", error)
  } finally {
    await prisma.$disconnect()
  }
}

void seedAdminAccounts()
