/**
 * Demo dataset seeder — invoked via `bun run seed:demo`.
 *
 * Purpose: populate a non-empty local database for demos and manual QA without wiping data.
 * Seeds (in dependency order): working shifts, holidays, schedules, employee shifts,
 * attendance records, projects, applications, tasks, and spent times.
 *
 * Idempotent: each sub-seeder skips when its target table already has rows.
 * Prerequisite: run `bun run seed:admin` first so the admin account exists.
 */
import { prisma } from "@/libs/database.ts"
import { createEmptyContext, registry } from "./seeders/index.ts"
import type { SeedContext } from "./seeders/seed-context.ts"

/** Load FK ids and lookup maps from DB so downstream seeders can reference existing rows. */
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

/** Per-seeder row-count guard — safe to re-run demo seed without duplicating data. */
async function shouldSkipSeederInternal(name: string): Promise<boolean> {
  let count = 0

  // Per-seeder idempotency: skip when target data already exists (safe re-run of demo seed).
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

/** Run all registered demo seeders in topological order, refreshing context after each step. */
async function main(): Promise<void> {
  console.log("Seeding demo data (without clearing database)...")

  let context = await hydrateContext(createEmptyContext())
  const seeders = registry.getSorted()

  for (const seeder of seeders) {
    try {
      if (await shouldSkipSeeder(seeder.name)) {
        console.log(`[skip] ${seeder.name} — already has data`)
        context = await hydrateContext(context)
        continue
      }

      console.log(`\n[→] Running: ${seeder.name}`)
      const result = await seeder.run(context)
      context = await hydrateContext({ ...context, ...result })
      console.log(`[✓] Done: ${seeder.name}`)
    } catch (error) {
      console.error(`[✗] Seeder ${seeder.name} failed:`, error)
      throw error
    }
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

async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}

async function runDemoSeed(): Promise<void> {
  try {
    await main()
  } catch (error: unknown) {
    console.error("Demo seed failed:", error)
    process.exitCode = 1
  } finally {
    await disconnectDatabase()
  }
}

void runDemoSeed()
