import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { ENVIRONMENT, ENV_ENVIRONMENT, PORT, RATE_LIMIT } from "@/configs/system/server.config.ts"
import { connectDB } from "@/libs/database.ts"
import { initCronJobs } from "@/libs/payroll-cron.ts"
import { initWeeklyScheduleCron } from "@/libs/weekly-schedule-cron.ts"
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
import profileRoutes from "@/routes/profile.route.ts"
import projectRoutes from "@/routes/project.route.ts"
import salaryComponentRoutes from "@/routes/salary-component.route.ts"
import salaryVariableRoutes from "@/routes/salary-variable.route.ts"
import scheduleRoutes from "@/routes/schedule.route.ts"
import securityRoutes from "@/routes/security.route.ts"
import shiftChangeRequestRoutes from "@/routes/shift-change-request.route.ts"
import shiftRoutes from "@/routes/shift.route.ts"
import taskRoutes from "@/routes/task.route.ts"
import spentTimeRoutes from "@/routes/spent-time.route.ts"
import weeklyScheduleTemplateRoutes from "@/routes/weekly-schedule-template.route.ts"
import jobRequisitionRoutes from "@/routes/job-requisition.route.ts"
import jobPostingRoutes from "@/routes/job-posting.route.ts"
import jobApplicationRoutes from "@/routes/job-application.route.ts"
import interviewRoutes from "@/routes/interview.route.ts"
import offerRoutes from "@/routes/offer.route.ts"
import backgroundCheckRoutes from "@/routes/background-check.route.ts"
import onboardingRoutes from "@/routes/onboarding.route.ts"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import express, { NextFunction, Request, Response } from "express"
import rateLimit from "express-rate-limit"
import path from "path"
import swaggerUi from "swagger-ui-express"
import YAML from "yamljs"
import { SchedulerService } from "@/services/scheduler.service"

/**
 * Server configurations
 */
dotenv.config() // Create config for using .env variables
const app = express()

/**
 * Swagger Setup
 */
const swaggerDocument = YAML.load(path.join(process.cwd(), "swagger.yaml"))
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

/**
 * Middleware
 */

app.use(cookieParser())
app.use(cors)
app.use(express.json())

// Set up rate limiter: maximum of 100 requests per 15 minutes (relaxed in development)
const limiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max:
    ENV_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT
      ? RATE_LIMIT.MAX_LIMIT_DEV
      : RATE_LIMIT.MAX_LIMIT_PROD,
  message: {
    status: "error",
    message: "Too many requests, please try again later.",
  },
})

// Apply rate limiter to all API requests
app.use("/api/", limiter)

/**
 * Main routers
 */

// Public routes
app.get("/", async (req, res) =>
  res.status(HttpStatusCode.OK).json({ message: "Connect to server successfully" }),
)

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
app.use("/api/spent-times", spentTimeRoutes)
app.use("/api/custom-queries", customQueryRoutes)

// Recruitment routes
app.use("/api/job-requisitions", jobRequisitionRoutes)
app.use("/api/job-postings", jobPostingRoutes)
app.use("/api/job-applications", jobApplicationRoutes)
app.use("/api/interviews", interviewRoutes)
app.use("/api/offers", offerRoutes)
app.use("/api/background-checks", backgroundCheckRoutes)
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

  app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`)
    initCronJobs()
    initWeeklyScheduleCron()
  })
})
