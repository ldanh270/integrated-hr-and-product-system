import { prisma } from "../libs/database.ts"

export async function clearDatabase() {
  console.log("Clearing database...")
  const tableNames = [
    "PasswordResetRequest",
    "ActivityLog",

    "employee_roles",
    "role_permissions",
    "roles",
    "permissions",

    "Task",
    "ProjectMember",
    "Project",
    "PayslipDetail",
    "Payslip",
    "Payroll",
    "PayrollSettings",
    "EmployeeSalaryConfig",
    "PayslipTemplateComponent",
    "PayslipTemplate",
    "SalaryComponent",
    "HolidayCalendar",
    "ApplicationLateEarlyDetail",
    "ApplicationRegimeDetail",
    "ApplicationOvertimeDetail",
    "ApplicationShiftSwapDetail",
    "ApplicationLeaveDetail",
    "Application",
    "AttendanceRecord",
    "EmployeeShift",
    "ShiftScheduleDay",
    "ShiftSchedule",
    "WorkingShift",
    "Employee",
  ]
  const truncateQuery = `TRUNCATE TABLE ${tableNames.map((name) => `"${name}"`).join(", ")} CASCADE;`
  await prisma.$executeRawUnsafe(truncateQuery)
  console.log("Database cleared successfully.")
}

// Support standalone execution
if (import.meta.main) {
  clearDatabase()
    .then(async () => {
      await prisma.$disconnect()
    })
    .catch(async (error) => {
      console.error("Error clearing database:", error)
      await prisma.$disconnect()
      process.exit(1)
    })
}
