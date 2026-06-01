// --- Core ---
import { APPLICATION_STATUS } from "@/configs/entities/attendance.config.ts"
import { EMPLOYEE_STATUS, EMPLOYEE_TYPES, ROLE } from "@/configs/entities/employee.config.ts"
import Employee from "@/entities/Employee.ts"
// --- Attendance Domain ---
import Application from "@/entities/attendance/Application.ts"
import AttendanceRecord from "@/entities/attendance/AttendanceRecord.ts"
import EmployeeShift from "@/entities/attendance/EmployeeShift.ts"
import WorkingShift from "@/entities/attendance/WorkingShift.ts"
// --- Auth Domain ---
import ActivityLog from "@/entities/auth/ActivityLog.ts"
import PasswordResetRequest from "@/entities/auth/PasswordResetRequest.ts"
// --- Payroll Domain ---
import Payroll from "@/entities/payroll/Payroll.ts"
import PayrollComponent from "@/entities/payroll/PayrollComponent.ts"
import PayrollSettings from "@/entities/payroll/PayrollSettings.ts"
import PayrollTemplate from "@/entities/payroll/PayrollTemplate.ts"
import Payslip from "@/entities/payroll/Payslip.ts"
// --- Product Domain ---
import Project from "@/entities/product/Project.ts"
import Task from "@/entities/product/Task.ts"
// --- Recruitment Domain ---
import Candidate from "@/entities/recruitment/Candidate.ts"
import InterviewSchedule from "@/entities/recruitment/InterviewSchedule.ts"
import RecruitmentPosting from "@/entities/recruitment/RecruitmentPosting.ts"
import RecruitmentProposal from "@/entities/recruitment/RecruitmentProposal.ts"
import SocialPostLog from "@/entities/recruitment/SocialPostLog.ts"
import { clearDatabase } from "@/scripts/clear-db.ts"
import { HashUtil } from "@/utils/hash.util.ts"

import { faker } from "@faker-js/faker"
import dotenv from "dotenv"
import mongoose from "mongoose"

dotenv.config()

const SEED_CONFIG = {
  EMPLOYEES_COUNT: 15,
  PROJECTS_COUNT: 4,
  TASKS_PER_PROJECT: 6,
  RECRUITMENT_POSTINGS_COUNT: 5,
  CANDIDATES_PER_POSTING: 4,
  ACTIVITY_LOGS_COUNT: 30,
}

const dbSeed = async () => {
  try {
    const mongoUri = process.env.MONGODB_CONNECTION_STRING
    if (!mongoUri) throw new Error("Missing MONGODB_CONNECTION_STRING")

    await mongoose.connect(mongoUri)
    console.log("🚀 Connected to MongoDB")

    await clearDatabase()

    const passwordHash = await HashUtil.hash("Password@123")

    // 1. Initial Admin & Managers
    console.log("👤 Seeding Core Employees...")
    const baseEmployeesData = [
      {
        fullName: "System Admin",
        username: "admin",
        email: "admin@hr.com",
        passwordHash,
        role: ROLE.ADMIN,
        status: EMPLOYEE_STATUS.ACTIVE,
        employeeType: EMPLOYEE_TYPES[0],
      },
      {
        fullName: "HR Manager",
        username: "hrmanager",
        email: "hr@hr.com",
        passwordHash,
        role: ROLE.HR_MANAGER,
        status: EMPLOYEE_STATUS.ACTIVE,
        employeeType: EMPLOYEE_TYPES[0],
      },
      {
        fullName: "General Manager",
        username: "gm",
        email: "gm@hr.com",
        passwordHash,
        role: ROLE.GENERAL_MANAGER,
        status: EMPLOYEE_STATUS.ACTIVE,
        employeeType: EMPLOYEE_TYPES[0],
      },
    ]
    const coreEmployees = await Employee.insertMany(baseEmployeesData)
    const admin = coreEmployees[0]
    const hrManager = coreEmployees[1]

    // 2. Payroll Foundations
    console.log("💰 Seeding Payroll Foundations...")
    const components = await PayrollComponent.insertMany([
      {
        name: "Base Salary",
        type: "addition",
        formula: "contract_salary",
        createdBy: admin._id,
      },
      {
        name: "Overtime Pay",
        type: "addition",
        formula: "hourly_rate * 1.5 * overtime_hours",
        createdBy: admin._id,
      },
      {
        name: "Health Insurance",
        type: "deduction",
        formula: "base_salary * 0.015",
        createdBy: admin._id,
      },
    ])
    await PayrollSettings.create({ triggerDay: 25, updatedBy: admin._id })
    const template = await PayrollTemplate.create({
      name: "Standard Template",
      components: components.map((c) => ({
        componentId: c._id,
        name: c.name,
        type: c.type,
        formula: c.formula,
      })),
      createdBy: admin._id,
    })

    // 3. Attendance & More Employees
    console.log("👥 Seeding Employees & Shifts...")
    const shifts = await WorkingShift.insertMany([
      { name: "Morning", startTime: "08:00", endTime: "17:00", createdBy: admin._id },
      { name: "Afternoon", startTime: "13:00", endTime: "22:00", createdBy: admin._id },
    ])

    const moreEmployeesData = Array.from({ length: SEED_CONFIG.EMPLOYEES_COUNT - 3 }).map(
      (_, i) => ({
        fullName: faker.person.fullName(),
        username: faker.internet.username().toLowerCase() + i,
        email: `employee-${i + 1}@hr.local`,
        passwordHash,
        role: i < 3 ? ROLE.TEAM_LEADER : ROLE.EMPLOYEE,
        status: EMPLOYEE_STATUS.ACTIVE,
        employeeType: EMPLOYEE_TYPES[0],
      }),
    )
    const otherEmployees = await Employee.insertMany(moreEmployeesData)
    const allEmployees = [...coreEmployees, ...otherEmployees]
    const leaders = allEmployees.filter((e) => e.role === "team_leader")
    const regularStaff = allEmployees.filter((e) => e.role === "employee")

    // 4. Attendance Data
    console.log("📅 Seeding Attendance...")
    for (const emp of allEmployees) {
      const shiftId = faker.helpers.arrayElement(shifts)._id

      // employeeShiftId is unique per AttendanceRecord → create a separate EmployeeShift per day
      // Use deterministic offsets so (employeeId, assignedDate) is never duplicated
      for (let i = 1; i <= 3; i++) {
        const histDate = new Date()
        histDate.setDate(histDate.getDate() - i)
        histDate.setHours(0, 0, 0, 0)

        const employeeShift = await EmployeeShift.create({
          employeeId: emp._id,
          shiftId,
          assignedDate: histDate,
          status: "confirmed",
          createdBy: admin._id,
        })

        const inTime = new Date(histDate)
        inTime.setHours(8, 0, 0, 0)
        const outTime = new Date(histDate)
        outTime.setHours(17, 0, 0, 0)

        await AttendanceRecord.create({
          employeeId: emp._id,
          employeeShiftId: employeeShift._id,
          shiftId,
          date: histDate,
          checkIn: { at: inTime },
          checkOut: { at: outTime },
          status: "on_time",
        })
      }

      const startDate = new Date()
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      await Application.create({
        employeeId: emp._id,
        type: "leave",
        status: APPLICATION_STATUS.APPROVED,
        reason: "Vacation",
        startDate,
        endDate,
        approvedBy: hrManager._id,
      })
    }

    // 5. Recruitment Data
    console.log("🤝 Seeding Recruitment...")
    // Seed Proposals
    for (let i = 0; i < 3; i++) {
      await RecruitmentProposal.create({
        requestedBy: hrManager._id,
        position: faker.person.jobTitle(),
        headcount: faker.number.int({ min: 1, max: 5 }),
        reason: "Need more hands on deck",
        status: i === 0 ? APPLICATION_STATUS.APPROVED : APPLICATION_STATUS.PENDING,
      })
    }

    for (let i = 0; i < SEED_CONFIG.RECRUITMENT_POSTINGS_COUNT; i++) {
      const posting = await RecruitmentPosting.create({
        title: faker.person.jobTitle(),
        description: "Job desc",
        status: "open",
        deadline: faker.date.future(),
        createdBy: hrManager._id,
      })
      for (let j = 0; j < SEED_CONFIG.CANDIDATES_PER_POSTING; j++) {
        const candidate = await Candidate.create({
          postingId: posting._id,
          fullName: faker.person.fullName(),
          email: `candidate-${i + 1}-${j + 1}@example.com`,
          phone: faker.phone.number(),
          status: j === 0 ? "interview" : "new",
          source: "website",
        })
        if (candidate.status === "interview") {
          await InterviewSchedule.create({
            candidateId: candidate._id,
            scheduledAt: faker.date.future(),
            interviewerId: faker.helpers.arrayElement(leaders)._id,
            format: "video_call",
            status: "scheduled",
          })
        }
      }
      await SocialPostLog.create({
        postingId: posting._id,
        platform: "linkedin",
        postUrl: faker.internet.url(),
        postedAt: new Date(),
        postedBy: hrManager._id,
      })
    }

    // 6. Product Data
    console.log("🏗️ Seeding Product...")
    for (let i = 0; i < SEED_CONFIG.PROJECTS_COUNT; i++) {
      const leader = faker.helpers.arrayElement(leaders)
      const projectMembers = faker.helpers.arrayElements(regularStaff, 3)
      const project = await Project.create({
        name: `${faker.company.name()} Project ${i + 1}`,
        status: EMPLOYEE_STATUS.ACTIVE,
        teamLeaderId: leader._id,
        createdBy: admin._id,
        members: projectMembers.map((m) => ({ employeeId: m._id, joinedAt: new Date() })),
      })
      for (let j = 0; j < SEED_CONFIG.TASKS_PER_PROJECT; j++) {
        await Task.create({
          projectId: project._id,
          title: "Task " + j,
          priority: "medium",
          status: "todo",
          assigneeId: faker.helpers.arrayElement(projectMembers)._id,
          createdBy: leader._id,
        })
      }
    }

    // 7. Payroll Run
    console.log("💸 Seeding Payroll Run...")
    const payroll = await Payroll.create({
      periodMonth: 5,
      periodYear: 2026,
      status: APPLICATION_STATUS.APPROVED,
      totalAmount: 100000,
    })
    for (const emp of allEmployees) {
      await Payslip.create({
        payrollId: payroll._id,
        employeeId: emp._id,
        baseSalary: 5000,
        netSalary: 4800,
        workingDays: 22,
        details: components.map((c) => {
          // PayrollComponent stores a formula string, not a pre-computed value.
          // Compute a mock numeric value so the required `value` field is satisfied.
          const BASE = 5000
          let monetaryValue = 0
          if (c.formula === "contract_salary") {
            monetaryValue = BASE
          } else if (c.formula?.includes("overtime_hours")) {
            monetaryValue = parseFloat((5 * (BASE / 176) * 1.5).toFixed(2))
          } else if (c.formula?.includes("0.015")) {
            monetaryValue = parseFloat((BASE * 0.015).toFixed(2))
          } else {
            monetaryValue = 0
          }
          return {
            componentId: c._id,
            name: c.name,
            type: c.type,
            value: monetaryValue,
          }
        }),
      })
    }

    // 8. Logs & Requests
    console.log("📜 Seeding Logs & Requests...")
    for (const emp of faker.helpers.arrayElements(allEmployees, 5)) {
      await PasswordResetRequest.create({
        employeeId: emp._id,
        token: faker.string.uuid(),
        status: APPLICATION_STATUS.PENDING,
      })
    }

    for (let i = 0; i < SEED_CONFIG.ACTIVITY_LOGS_COUNT; i++) {
      await ActivityLog.create({
        employeeId: faker.helpers.arrayElement(allEmployees)._id,
        actionType: "login",
        ipAddress: faker.internet.ip(),
      })
    }

    console.log("✨ FULL SEED COMPLETED!")
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("❌ Seeding failed:", error)
    await mongoose.disconnect()
    process.exit(1)
  }
}

dbSeed()
