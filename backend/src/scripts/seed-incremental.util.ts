/**
 * Incremental seed helpers — extracted from former seed-demo.ts.
 * Used by `bun run seed -- --incremental` when DB already has admin/employees.
 */
import { prisma } from "@/libs/database.ts"
import { createEmptyContext, registry } from "./seeders/index.ts"
import type { SeedContext } from "./seeders/seed-context.ts"

/** Load FK ids and lookup maps from DB so downstream seeders can reference existing rows. */
export async function hydrateSeedContext(context: SeedContext): Promise<SeedContext> {
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

/** Per-seeder row-count guard — safe to re-run incremental seed without duplicating data. */
async function shouldSkipSeederInternal(name: string): Promise<boolean> {
  let count = 0

  switch (name) {
    case "WorkingShifts":
      count = await prisma.workingShift.count()
      return count > 0

    case "HolidayCalendars":
      count = await prisma.holidayCalendar.count()
      return count > 0

    case "ShiftSchedules": {
      const shiftScheduleCount = await prisma.shiftSchedule.count()
      const employeeCount = await prisma.employee.count()
      return shiftScheduleCount >= employeeCount
    }

    case "EmployeeShifts":
      count = await prisma.employeeShift.count()
      return count > 0

    case "AttendanceRecords":
      count = await prisma.attendanceRecord.count()
      return count > 0

    case "Projects":
      count = await prisma.project.count()
      return count > 0

    case "Applications":
      count = await prisma.application.count()
      return count > 0

    case "Tasks":
      count = await prisma.task.count()
      return count > 0

    case "SpentTimes":
      count = await prisma.spentTime.count()
      return count > 0

    default:
      return false
  }
}

/** Wraps skip evaluation — on DB error, fall through and attempt seed rather than abort silently. */
async function shouldSkipSeeder(name: string): Promise<boolean> {
  try {
    return await shouldSkipSeederInternal(name)
  } catch (error: unknown) {
    console.error(`Failed to evaluate skip state for ${name}:`, error)
    return false
  }
}

/**
 * Incremental seed — no DB wipe; skips seeders whose target tables already have rows.
 * Used when local DB already has admin/employees and only needs demo data filled in.
 */
export async function runIncrementalSeed(): Promise<void> {
  console.log("Seeding data incrementally (without clearing database)...")

  let context = await hydrateSeedContext(createEmptyContext())
  const seeders = registry.getSorted()

  for (const seeder of seeders) {
    if (await shouldSkipSeeder(seeder.name)) {
      console.log(`[skip] ${seeder.name} — already has data`)
      context = await hydrateSeedContext(context)
      continue
    }

    console.log(`\n[→] Running: ${seeder.name}`)
    const result = await seeder.run(context)
    context = await hydrateSeedContext({ ...context, ...result })
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

  console.log("\nIncremental seed complete:", summary)
}
