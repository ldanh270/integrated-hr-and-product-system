import Employee from "@/entities/Employee.ts"
import { HashUtil } from "@/utils/hash.util.ts"

import { CORE_EMPLOYEES, generateEmployeeData } from "../data/employees.data.ts"

export const seedEmployees = async (count: number = 15): Promise<any[]> => {
  console.log("👤 Seeding Employees...")

  // 0. Clear existing employees to avoid unique constraint violations
  await Employee.deleteMany({})

  // 1. Hash password
  const passwordHash = await HashUtil.hash("Password@123")

  // 2. Prepare core employees data
  const baseEmployees = CORE_EMPLOYEES.map((emp) => ({
    ...emp,
    passwordHash,
  }))

  // 3. Generate dynamic employees data
  const dynamicCount = Math.max(0, count - baseEmployees.length)
  const dynamicEmployees = Array.from({ length: dynamicCount }).map((_, i) => ({
    ...generateEmployeeData(i),
    passwordHash,
  }))

  // 4. Insert into DB
  const allEmployeesToInsert = [...baseEmployees, ...dynamicEmployees]
  const createdEmployees = await Employee.insertMany(allEmployeesToInsert)

  console.log(
    `✅ Seeded ${createdEmployees.length} employees (3 core, ${dynamicEmployees.length} dynamic)`,
  )
  return createdEmployees
}
