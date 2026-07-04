import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { PORT } from "@/configs/system/server.config.ts"
import { connectDB } from "@/libs/database.ts"
import { initCronJobs } from "@/libs/payroll-cron.ts"
import { initWeeklyScheduleCron } from "@/libs/weekly-schedule-cron.ts"
import { initRecruitmentCron } from "@/libs/recruitment-cron.ts"
import { cors } from "@/middlewares/cors.middleware.ts"
import { globalErrorHandler } from "@/middlewares/error.middleware.ts"
import applicationRoutes from "@/routes/application.route.ts"
import approvalRoutes from "@/routes/approval.route.ts"
import attendanceRoutes from "@/routes/attendance.route.ts"
import authRoutes from "@/routes/auth.route.ts"
import customQueryRoutes from "@/routes/custom-query.route.ts"
import employeeSalaryConfigRoutes from "@/routes/employee-salary-config.route.ts"
import employeeRoutes from "@/routes/employee.route.ts"
import holidayRoutes from "@/routes/holiday.route.ts"
import payrollRoutes from "@/routes/payroll.route.ts"
import payslipTemplateRoutes from "@/routes/payslip-template.route.ts"
import permissionRoutes from "@/routes/permission.route.ts"
import roleRoutes from "@/routes/role.route.ts"
import profileRoutes from "@/routes/profile.route.ts"
import projectRoutes from "@/routes/project.route.ts"
import salaryComponentRoutes from "@/routes/salary-component.route.ts"
import salaryVariableRoutes from "@/routes/salary-variable.route.ts"
import scheduleRoutes from "@/routes/schedule.route.ts"
import securityRoutes from "@/routes/security.route.ts"
import shiftChangeRequestRoutes from "@/routes/shift-change-request.route.ts"
import shiftRoutes from "@/routes/shift.route.ts"
import spentTimeRoutes from "@/routes/spent-time.route.ts"
import taskRoutes from "@/routes/task.route.ts"
import weeklyScheduleTemplateRoutes from "@/routes/weekly-schedule-template.route.ts"
import jobRequisitionRoutes from "@/routes/job-requisition.route.ts"
import jobDescriptionRoutes from "@/routes/job-description.route.ts"
import externalJobPostRoutes from "@/routes/external-job-post.route.ts"
import publicApplicationRoutes from "@/routes/public-application.route.ts"
import jobApplicationRoutes from "@/routes/job-application.route.ts"
import interviewRoutes from "@/routes/interview.route.ts"
import offerRoutes from "@/routes/offer.route.ts"
import onboardingRoutes from "@/routes/onboarding.route.ts"
import rateLimit from "express-rate-limit"
import path from "path"
import swaggerUi from "swagger-ui-express"
import YAML from "yamljs"
import { SchedulerService } from "@/services/scheduler.service"
import auditRoutes from "@/routes/audit.route.ts"
import { countStaticRoleReferences, bootstrapAdmin } from "@/utils/startup-assertion.util.ts"

import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import express from "express"

/**
 * Server configurations
 */
dotenv.config() // Create config for using .env variables
const app = express()

/**
 * Middleware
 */

app.use(cookieParser())
app.use(cors)
app.use(express.json())

/**
 * Main routers
 */

// Public routes
app.get("/", async (req, res) =>
  res.status(HttpStatusCode.OK).json({ message: "Connect to server successfully" }),
)

app.use("/api/public/job-applications", publicApplicationRoutes)

app.use("/api/auth", authRoutes)
app.use("/api/security", securityRoutes)
app.use("/api/employees", employeeRoutes)
app.use("/api/profile", profileRoutes)

// Attendance & Scheduling routes
app.use("/api/shifts", shiftRoutes)
app.use("/api/schedules", scheduleRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/applications", applicationRoutes)
app.use("/api/shift-change-requests", shiftChangeRequestRoutes)
app.use("/api/holidays", holidayRoutes)
app.use("/api/weekly-schedule-templates", weeklyScheduleTemplateRoutes)
app.use("/api/approvals", approvalRoutes)

// Payroll routes
app.use("/api/salary-components", salaryComponentRoutes)
app.use("/api/salary-variables", salaryVariableRoutes)
app.use("/api/payslip-templates", payslipTemplateRoutes)
app.use("/api/employees", employeeSalaryConfigRoutes)
app.use("/api/payrolls", payrollRoutes)

// Private routes
app.use("/api/projects", projectRoutes)
app.use("/api/tasks", taskRoutes)
app.use("/api/permissions", permissionRoutes)
app.use("/api/roles", roleRoutes)
app.use("/api", auditRoutes)
app.use("/api/spent-times", spentTimeRoutes)
app.use("/api/custom-queries", customQueryRoutes)

// Recruitment routes
app.use("/api/job-requisitions", jobRequisitionRoutes)
app.use("/api/job-requisitions/:requisitionId/description", jobDescriptionRoutes)
app.use("/api/job-requisitions/:requisitionId/external-posts", externalJobPostRoutes)
app.use("/api/job-applications", jobApplicationRoutes)
app.use("/api/interviews", interviewRoutes)
app.use("/api/offers", offerRoutes)
app.use("/api/onboarding", onboardingRoutes)
// 404 handler
app.use((req, res) => {
  res.status(HttpStatusCode.NOT_FOUND).json({
    status: "error",
    message: "Route not found",
  })
})

// Global error
app.use(globalErrorHandler)

/**
 * Must connect to database successfully before start server
 */
connectDB().then(() => {
  // Initialize cron scheduler
  const scheduler = new SchedulerService()
  scheduler.init()

  // Check static role references
  const skipAssert = process.env.SKIP_ADMIN_ASSERT === "true" || process.env.NODE_ENV === "test"
  if (!skipAssert) {
    const staticRefs = countStaticRoleReferences()
    if (staticRefs.total > 0) {
      console.error("FATAL ERROR: SYSTEM_INVARIANT_BROKEN: Legacy static role references found:")
      staticRefs.details.forEach((d) => console.error(`  - ${d}`))
      console.error("All Legacy ROLE references must be purged under Sprint D2.6.")
      process.exit(1)
    }
  }

  // Ensure fail-safe administrator exists
  await bootstrapAdmin()

  app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`)
    initCronJobs()
    initWeeklyScheduleCron()
    initRecruitmentCron()
  })
})

