import Employee from "@/entities/Employee.ts"
import PasswordResetRequest from "@/entities/auth/PasswordResetRequest.ts"
import ActivityLog from "@/entities/auth/ActivityLog.ts"
import { MOCK_IP_ADDRESSES, ACTION_TYPES_LIST } from "../data/auth.data.ts"
import { seedEmployees } from "./employee.seeder.ts"
import { faker } from "@faker-js/faker"

export const seedAuth = async (passedEmployees?: any[]): Promise<void> => {
  console.log("📜 Seeding Auth logs & requests...")

  // 1. Get employees or auto-seed if none exist
  let employees = passedEmployees || (await Employee.find())
  if (employees.length === 0) {
    console.log("⚠️ No employees found in database. Automatically seeding employees first...")
    employees = await seedEmployees()
  }

  const hrManager = employees.find(e => e.role === "hr_manager" || e.role === "admin") || employees[0]

  // 1.5. Clear existing auth logs and requests
  await PasswordResetRequest.deleteMany({})
  await ActivityLog.deleteMany({})

  // 2. Seed PasswordResetRequests (Pending, Approved, Rejected status variants)
  const resetEmployees = faker.helpers.arrayElements(employees, Math.min(employees.length, 3))
  for (let i = 0; i < resetEmployees.length; i++) {
    const emp = resetEmployees[i]
    const status = i === 0 ? "pending" as const : i === 1 ? "approved" as const : "rejected" as const
    
    await PasswordResetRequest.create({
      employeeId: emp._id,
      token: faker.string.uuid(),
      status,
      approvedBy: status !== "pending" ? hrManager._id : null,
      note: status === "rejected" ? "Invalid request profile validation" : status === "approved" ? "Approved by HR" : null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
  }
  console.log(`✅ Seeded ${resetEmployees.length} password reset requests (connected to employees)`)

  // 3. Seed ActivityLogs
  const logCount = 30
  for (let i = 0; i < logCount; i++) {
    const emp = faker.helpers.arrayElement(employees)
    const action = faker.helpers.arrayElement(ACTION_TYPES_LIST)
    
    await ActivityLog.create({
      employeeId: action === "failed-login" && faker.datatype.boolean() ? null : emp._id,
      actionType: action,
      ipAddress: faker.helpers.arrayElement(MOCK_IP_ADDRESSES),
      details: {
        userAgent: faker.internet.userAgent(),
        timestamp: new Date().toISOString(),
        success: action !== "failed-login",
        failureReason: action === "failed-login" ? "Invalid password" : null,
      },
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Auto-delete logs after 90 days
    })
  }
  console.log(`✅ Seeded ${logCount} activity logs (connected to employees)`)
}
