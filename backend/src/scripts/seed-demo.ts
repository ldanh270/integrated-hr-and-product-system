import { prisma } from "@/libs/database.ts"
import { createEmptyContext, registry } from "./seeders/index.ts"
import type { SeedContext } from "./seeders/seed-context.ts"

async function hydrateContext(context: SeedContext): Promise<SeedContext> {
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  if (!admin) {
    throw new Error("Missing admin account. Run: bun run seed:admin")
  }

  const employees = await prisma.employee.findMany({
    select: { id: true, position: true, username: true },
  })
  const schedules = await prisma.shiftSchedule.findMany()
  const employeeShifts = await prisma.employeeShift.findMany({ select: { id: true } })
  const salaryComponents = await prisma.salaryComponent.findMany({ select: { id: true } })
  const payslipTemplates = await prisma.payslipTemplate.findMany({ select: { id: true } })
  const salaryConfigs = await prisma.employeeSalaryConfig.findMany()
  const payrolls = await prisma.payroll.findMany({ select: { id: true } })
  const projects = await prisma.project.findMany({ select: { id: true } })

  return {
    ...context,
    adminId: admin.id,
    employees,
    workingShiftIds: (await prisma.workingShift.findMany({ select: { id: true } })).map((s) => s.id),
    shiftScheduleMap: Object.fromEntries(schedules.map((schedule) => [schedule.employeeId, schedule.id])),
    employeeShiftIds: employeeShifts.map((shift) => shift.id),
    salaryComponentIds: salaryComponents.map((item) => item.id),
    payslipTemplateIds: payslipTemplates.map((item) => item.id),
    salaryConfigMap: Object.fromEntries(salaryConfigs.map((config) => [config.employeeId, config.id])),
    payrollIds: payrolls.map((item) => item.id),
    projectIds: projects.map((item) => item.id),
  }
}

async function shouldSkipSeeder(name: string): Promise<boolean> {
  try {
    switch (name) {
      case "WorkingShifts":
        return (await prisma.workingShift.count()) > 0
      case "HolidayCalendars":
        return (await prisma.holidayCalendar.count()) > 0
      case "ShiftSchedules":
        return (await prisma.shiftSchedule.count()) >= (await prisma.employee.count())
      case "EmployeeShifts":
        return (await prisma.employeeShift.count()) > 0
      case "AttendanceRecords":
        return (await prisma.attendanceRecord.count()) > 0
      case "Projects":
        return (await prisma.project.count()) > 0
      case "Applications":
        return (await prisma.application.count()) > 0
      case "Tasks":
        return (await prisma.task.count()) > 0
      case "SpentTimes":
        return (await prisma.spentTime.count()) > 0
      default:
        return false
    }
  } catch (error) {
    console.error(`Failed to evaluate skip state for ${name}:`, error)
    return false
  }
}

async function main() {
  console.log("Seeding demo data (without clearing database)...")

  let context = await hydrateContext(createEmptyContext())
  const seeders = registry.getSorted()

  for (const seeder of seeders) {
    if (await shouldSkipSeeder(seeder.name)) {
      console.log(`[skip] ${seeder.name} — already has data`)
      context = await hydrateContext(context)
      continue
    }

    console.log(`\n[→] Running: ${seeder.name}`)
    const result = await seeder.run(context)
    context = await hydrateContext({ ...context, ...result })
    console.log(`[✓] Done: ${seeder.name}`)
  }

  const summary = {
    employees: await prisma.employee.count(),
    employeeShifts: await prisma.employeeShift.count(),
    attendanceRecords: await prisma.attendanceRecord.count(),
    applications: await prisma.application.count(),
    projects: await prisma.project.count(),
    tasks: await prisma.task.count(),
    spentTimes: await prisma.spentTime.count(),
  }

  console.log("\nDemo seed complete:", summary)
}

main()
  .catch((error) => {
    console.error("Demo seed failed:", error)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
