import { EMPLOYEE_TYPE, ROLE } from "../configs/entities/employee.config.ts"
import { prisma } from "../libs/database.ts"
import { HashUtil } from "../utils/hash.util.ts"

const PASSWORD = "Admin123@"

async function seedAdminAccounts() {
  console.log("Seeding admin and role accounts...")

  try {
    const passwordHash = await HashUtil.hash(PASSWORD)

    const rolesToSeed = [
      ROLE.ADMIN,
      ROLE.HR_MANAGER,
      ROLE.GENERAL_MANAGER,
      ROLE.TEAM_LEADER,
      ROLE.EMPLOYEE,
    ]

    for (const role of rolesToSeed) {
      const username = role === ROLE.ADMIN ? "admin" : role
      const fullName = role
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      const existing = await prisma.employee.findFirst({
        where: { username },
      })

      let phoneSuffix = "0"
      if (role === ROLE.ADMIN) phoneSuffix = "1"
      else if (role === ROLE.HR_MANAGER) phoneSuffix = "2"
      else if (role === ROLE.GENERAL_MANAGER) phoneSuffix = "3"
      else if (role === ROLE.TEAM_LEADER) phoneSuffix = "4"
      else if (role === ROLE.EMPLOYEE) phoneSuffix = "5"

      const data = {
        username,
        passwordHash,
        role: role as any,
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
    // Demo / E2E account — employeeType part_time, not full-time shift model.
    const partTimeExisting = await prisma.employee.findFirst({ where: { username: partTimeUsername } })
    const partTimeData = {
      username: partTimeUsername,
      passwordHash,
      role: ROLE.EMPLOYEE as any,
      employeeType: EMPLOYEE_TYPE.PART_TIME as any,
      fullName: "Part Time User",
      email: "part_time@example.com",
      phone: "0123456786",
      address: "System Generated",
      position: "Part-time Developer",
    }

    if (partTimeExisting) {
      await prisma.employee.update({ where: { id: partTimeExisting.id }, data: partTimeData })
    } else {
      await prisma.employee.create({ data: partTimeData })
    }
    console.log(`[✓] Created account: ${partTimeUsername} (Type: part_time)`)

    console.log("\nAdmin and role accounts seeded successfully.")
    console.log(`Password for all accounts: ${PASSWORD}`)
  } catch (error) {
    console.error("Error seeding admin accounts:", error)
  } finally {
    await prisma.$disconnect()
  }
}

seedAdminAccounts()
