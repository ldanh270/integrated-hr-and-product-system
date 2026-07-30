import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

import { faker } from "@faker-js/faker"

export class PayslipsSeeder implements ISeeder {
  readonly name = "Payslips"
  readonly order = 16

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding payslips...")

    const employees = context.employees
    const payrollIds = context.payrollIds
    const salaryConfigMap = context.salaryConfigMap

    if (
      employees.length === 0 ||
      payrollIds.length === 0 ||
      Object.keys(salaryConfigMap).length === 0
    ) {
      throw new Error("Missing required context (employees, payrolls, or salary configs).")
    }

    const components = await prisma.salaryComponent.findMany()

    let totalPayslipsSeeded = 0

    for (const payrollId of payrollIds) {
      const payroll = await prisma.payroll.findUnique({ where: { id: payrollId } })
      if (!payroll) continue

      let payrollTotal = 0

      for (const emp of employees) {
        const configId = salaryConfigMap[emp.id]
        if (!configId) continue

        const startDate = new Date(payroll.periodYear, payroll.periodMonth - 1, 1)
        const endDate = new Date(payroll.periodYear, payroll.periodMonth, 0)

        const attendanceRecords = await prisma.attendanceRecord.findMany({
          where: {
            employeeId: emp.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        })

        let workingDays = 0
        let absentDays = 0
        let overtimeMinutes = 0
        let lateMinutes = 0

        for (const record of attendanceRecords) {
          if (record.status === "absent") {
            absentDays++
          } else {
            workingDays++
            overtimeMinutes += record.overtimeMinutes
            lateMinutes += record.lateMinutes
          }
        }

        // Fallback if no records found (e.g. employee joined later or script ran out of sync)
        if (workingDays === 0 && absentDays === 0) {
          workingDays = 22
        }

        let totalAdditions = 0
        let totalDeductions = 0

        // Create details first
        const detailsData = components.map((c) => {
          let value = 0
          // Simple mock calculation based on component name
          if (c.name.includes("Base Salary")) value = 10000000 * (workingDays / 22)
          else if (c.name.includes("Meal Allowance")) value = 1000000
          else if (c.name.includes("Transport Allowance")) value = 500000
          else if (c.name.includes("Overtime")) value = overtimeMinutes * 50000
          else if (c.name.includes("Insurance"))
            value = 1000000 // Deduction
          else if (c.name.includes("Tax")) value = 500000 // Deduction

          if (c.type === "addition") totalAdditions += value
          else totalDeductions += value

          return {
            componentId: c.id,
            name: c.name,
            type: c.type,
            value: value,
          }
        })

        const netSalary = totalAdditions - totalDeductions
        payrollTotal += netSalary

        try {
          await prisma.payslip.upsert({
            where: {
              payrollId_employeeId: {
                payrollId: payroll.id,
                employeeId: emp.id,
              },
            },
            update: {}, // Don't override if exists for simplicity in seeder
            create: {
              payrollId: payroll.id,
              employeeId: emp.id,
              salaryConfigId: configId,
              totalAdditions,
              totalDeductions,
              netSalary,
              workingDays,
              absentDays,
              overtimeMinutes,
              details: {
                create: detailsData,
              },
            },
          })
        } catch (err) {
          console.error(`Failed on payroll ${payroll.id}, employee ${emp.id}, config ${configId}`)
          const dbPayroll = await prisma.payroll.findUnique({ where: { id: payroll.id } })
          console.error(`Does payroll exist in DB?`, !!dbPayroll)
          const dbEmployee = await prisma.employee.findUnique({ where: { id: emp.id } })
          console.error(`Does employee exist in DB?`, !!dbEmployee)
          const dbConfig = await prisma.employeeSalaryConfig.findUnique({ where: { id: configId } })
          console.error(`Does config exist in DB?`, !!dbConfig)
          throw err
        }
        totalPayslipsSeeded++
      }

      // Update payroll total
      await prisma.payroll.update({
        where: { id: payroll.id },
        data: { totalAmount: payrollTotal },
      })
    }

    console.log(`  Seeded ${totalPayslipsSeeded} payslips.`)

    return {}
  }
}

registry.register(new PayslipsSeeder())

if (import.meta.main) {
  const seeder = new PayslipsSeeder()
  const emps = await prisma.employee.findMany({
    select: { id: true, position: true, username: true },
  })
  const payrolls = await prisma.payroll.findMany()
  const configs = await prisma.employeeSalaryConfig.findMany()

  const ctx = createEmptyContext()
  ctx.employees = emps
  ctx.payrollIds = payrolls.map((p) => p.id)
  configs.forEach((c) => (ctx.salaryConfigMap[c.employeeId] = c.id))

  await seeder.run(ctx)
  await prisma.$disconnect()
}
