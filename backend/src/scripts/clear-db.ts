import { prisma } from "../libs/database.ts"

const FORCE_CLEAR_ARG = "--force-clear"
const FORCE_CLEAR_ENV = "ALLOW_DATABASE_CLEAR"
const FORCE_CLEAR_ENV_VALUE = "true"

function assertClearAllowed(force = false) {
  const isAllowed =
    force ||
    process.argv.includes(FORCE_CLEAR_ARG) ||
    process.env[FORCE_CLEAR_ENV] === FORCE_CLEAR_ENV_VALUE

  if (!isAllowed) {
    throw new Error(
      `Database clear blocked. Re-run with ${FORCE_CLEAR_ARG} or set ${FORCE_CLEAR_ENV}=${FORCE_CLEAR_ENV_VALUE}.`,
    )
  }
}

export async function clearDatabase(options: { force?: boolean } = {}) {
  assertClearAllowed(options.force)
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
