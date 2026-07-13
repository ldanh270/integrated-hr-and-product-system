import { EMPLOYEE_TYPE, WORK_SCHEDULE_TYPE } from "../configs/entities/employee.config.ts"
import { prisma } from "../libs/database.ts"
import { HashUtil } from "../utils/hash.util.ts"
import { getSeedPassword } from "./seeders/seed-password.util.ts"
const PASSWORD = getSeedPassword("SEED_CORE_ACCOUNTS_PASSWORD")

/**
 * Seeds default administrator and system-role accounts (HR Manager, General Manager,
 * Team Leader, Employee) alongside their associated system positions (PM, Developer, Tester, etc.).
 */
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

    // Ensure Positions exist
    const positionsData = [
      { name: "Admin", code: "admin", description: "System Administrator" },
      { name: "General Manager", code: "gm", description: "General Manager" },
      { name: "HR Manager", code: "hr", description: "Human Resource Manager" },
      { name: "Project Manager", code: "pm", description: "Project Manager" },
      { name: "Developer", code: "developer", description: "Software Developer" },
      { name: "Tester", code: "tester", description: "QA Tester" },
    ]

    for (const pos of positionsData) {
      const existingPos = await prisma.position.findUnique({ where: { code: pos.code } })
      if (!existingPos) {
        await prisma.position.create({ data: pos })
      }
    }

    const devPos = await prisma.position.findUnique({ where: { code: "developer" } })
    const pmPos = await prisma.position.findUnique({ where: { code: "pm" } })
    const hrPos = await prisma.position.findUnique({ where: { code: "hr" } })
    const gmPos = await prisma.position.findUnique({ where: { code: "gm" } })
    const adminPos = await prisma.position.findUnique({ where: { code: "admin" } })

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

      let positionId = devPos?.id
      if (role === "admin") positionId = adminPos?.id
      else if (role === "hr_manager") positionId = hrPos?.id
      else if (role === "general_manager") positionId = gmPos?.id
      else if (role === "team_leader") positionId = pmPos?.id

      const data = {
        username,
        passwordHash,
        fullName: `${fullName} User`,
        email: `${username}@example.com`,
        phone: `012345678${phoneSuffix}`,
        address: "System Generated",
        position: fullName,
        positionId,
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
    const partTimeExisting = await prisma.employee.findFirst({
      where: { username: partTimeUsername },
    })
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
      positionId: devPos?.id,
    }

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
