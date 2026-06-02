import { ROLE } from "@/configs/entities/employee.config.ts"
import Employee from "@/entities/Employee.ts"
import Payroll from "@/entities/payroll/Payroll.ts"
import PayrollComponent from "@/entities/payroll/PayrollComponent.ts"
import PayrollSettings from "@/entities/payroll/PayrollSettings.ts"
import PayrollTemplate from "@/entities/payroll/PayrollTemplate.ts"
import Payslip from "@/entities/payroll/Payslip.ts"

import { faker } from "@faker-js/faker"

import {
  BASE_PAYROLL_COMPONENTS,
  DEFAULT_PAYROLL_SETTINGS,
  PAYROLL_PERIODS,
  PAYROLL_TEMPLATES,
} from "../data/payroll.data.ts"
import { seedEmployees } from "./employee.seeder.ts"

export const seedPayroll = async (
  passedEmployees?: any[],
): Promise<{ components: any[]; templates: any[]; payrolls: any[] }> => {
  console.log("💰 Seeding Payroll Setup...")

  // 1. Get employees or auto-seed if none exist
  let employees = passedEmployees || (await Employee.find())
  if (employees.length === 0) {
    console.log("⚠️ No employees found in database. Automatically seeding employees first...")
    employees = await seedEmployees()
  }

  const admin = employees.find((e) => e.role === ROLE.ADMIN) || employees[0]

  // 1.5. Clear existing payroll database setup
  await PayrollComponent.deleteMany({})
  await PayrollSettings.deleteMany({})
  await PayrollTemplate.deleteMany({})
  await Payroll.deleteMany({})
  await Payslip.deleteMany({})

  // 2. Seed PayrollComponents
  const componentsToInsert = BASE_PAYROLL_COMPONENTS.map((comp) => ({
    ...comp,
    createdBy: admin._id,
  }))
  const createdComponents = await PayrollComponent.insertMany(componentsToInsert)
  console.log(`✅ Seeded ${createdComponents.length} payroll components`)

  // 3. Seed PayrollSettings (Singleton)
  // Ensure we delete any existing first to avoid duplicate key on _singleton
  await PayrollSettings.deleteMany({})
  const settings = await PayrollSettings.create({
    triggerDay: DEFAULT_PAYROLL_SETTINGS.triggerDay,
    updatedBy: admin._id,
  })
  console.log(`✅ Seeded payroll settings (trigger day: ${settings.triggerDay})`)

  // 4. Seed PayrollTemplates
  const createdTemplates: any[] = []
  for (const templateData of PAYROLL_TEMPLATES) {
    const isIntern = templateData.name.includes("Intern")

    // Standard template has all components, Intern has base & health only
    const templateComponents = createdComponents
      .filter((c) => !isIntern || c.name === "Base Salary" || c.name === "Health Insurance")
      .map((c) => ({
        componentId: c._id,
        name: c.name,
        type: c.type,
        formula: isIntern && c.name === "Base Salary" ? "1500" : c.formula,
        overrideFormula: null,
      }))

    const template = await PayrollTemplate.create({
      name: templateData.name,
      description: templateData.description,
      isActive: true,
      components: templateComponents,
      createdBy: admin._id,
    })
    createdTemplates.push(template)
  }
  console.log(`✅ Seeded ${createdTemplates.length} payroll templates`)

  // 5. Seed Payroll Runs
  const createdPayrolls: any[] = []
  for (const period of PAYROLL_PERIODS) {
    // Delete any existing period with same year/month to avoid index collision
    await Payroll.deleteOne({ periodMonth: period.month, periodYear: period.year })

    const payroll = await Payroll.create({
      periodMonth: period.month,
      periodYear: period.year,
      status: period.status,
      totalAmount: 0, // Will compute based on slips
      approvedBy: admin._id,
      approvedAt: period.status === "paid" || period.status === "approved" ? new Date() : null,
    })
    createdPayrolls.push(payroll)
  }
  console.log(`✅ Seeded ${createdPayrolls.length} payroll periods`)

  // 6. Seed Payslips for each payroll run and each employee
  let payslipCount = 0
  for (const payroll of createdPayrolls) {
    let totalPayrollAmount = 0

    for (const emp of employees) {
      const baseSalary = emp.role === ROLE.TEAM_LEADER ? 6500 : 4500
      const isIntern = emp.employeeType === "intern"

      const empTemplate = isIntern
        ? createdTemplates.find((t) => t.name.includes("Intern"))
        : createdTemplates.find((t) => t.name.includes("Standard"))

      const templateComponents = empTemplate ? empTemplate.components : []

      // Calculate totals
      let totalAdditions = 0
      let totalDeductions = 0

      const payslipDetails = templateComponents.map((c: any) => {
        const formula = c.overrideFormula || c.formula
        let monetaryAmount = 0

        // Simple mock "interpreter" for seed data formulas
        if (formula === "contract_salary") {
          monetaryAmount = baseSalary
        } else if (formula.includes("overtime_hours")) {
          monetaryAmount = 5 * (baseSalary / 176) * 1.5 // 5 hours OT, 1.5x
        } else if (formula === "300") {
          monetaryAmount = 300
        } else if (formula.includes("0.015")) {
          monetaryAmount = baseSalary * 0.015
        } else if (formula.includes("0.08")) {
          monetaryAmount = baseSalary * 0.08
        } else if (formula === "1500") {
          monetaryAmount = 1500
        }

        if (c.type === "addition") {
          totalAdditions += monetaryAmount
        } else {
          totalDeductions += monetaryAmount
        }

        return {
          componentId: c.componentId,
          name: c.name,
          type: c.type,
          value: parseFloat(monetaryAmount.toFixed(2)),
        }
      })

      const netSalary = parseFloat((baseSalary + totalAdditions - totalDeductions).toFixed(2))
      totalPayrollAmount += netSalary

      await Payslip.create({
        payrollId: payroll._id,
        employeeId: emp._id,
        baseSalary,
        totalAdditions: parseFloat(totalAdditions.toFixed(2)),
        totalDeductions: parseFloat(totalDeductions.toFixed(2)),
        netSalary,
        workingDays: 22,
        absentDays: 0,
        overtimeHours: 5,
        details: payslipDetails,
      })
      payslipCount++
    }

    // Update total amount on payroll
    payroll.totalAmount = parseFloat(totalPayrollAmount.toFixed(2))
    await payroll.save()
  }

  console.log(`✅ Seeded ${payslipCount} individual payslips`)
  return { components: createdComponents, templates: createdTemplates, payrolls: createdPayrolls }
}
