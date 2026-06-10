import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { PORT } from "@/configs/system/server.config.ts"
import { connectDB } from "@/libs/database.ts"
import { initCronJobs } from "@/libs/payroll-cron.ts"
import { cors } from "@/middlewares/cors.middleware.ts"
import applicationRoutes from "@/routes/application.route.ts"
import approvalRoutes from "@/routes/approval.route.ts"
import attendanceRoutes from "@/routes/attendance.route.ts"
import authRoutes from "@/routes/auth.route.ts"
import employeeSalaryConfigRoutes from "@/routes/employee-salary-config.route.ts"
import employeeRoutes from "@/routes/employee.route.ts"
import holidayRoutes from "@/routes/holiday.route.ts"
import payrollRoutes from "@/routes/payroll.route.ts"
import payslipTemplateRoutes from "@/routes/payslip-template.route.ts"
import profileRoutes from "@/routes/profile.route.ts"
import salaryComponentRoutes from "@/routes/salary-component.route.ts"
import salaryVariableRoutes from "@/routes/salary-variable.route.ts"
import scheduleRoutes from "@/routes/schedule.route.ts"
import shiftRoutes from "@/routes/shift.route.ts"
import taskRoutes from "@/routes/task.route.ts"
import projectRoutes from "@/routes/project.route.ts"
import dotenv from "dotenv"
import express, { NextFunction, Request, Response } from "express"
import rateLimit from "express-rate-limit"
import path from "path"
import swaggerUi from "swagger-ui-express"
import YAML from "yamljs"

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

app.use(cors)
app.use(express.json())

// Set up rate limiter: maximum of 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
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
  res.status(200).json({ message: "Connect to server successfully" }),
)

app.use("/api/auth", authRoutes)
app.use("/api/employees", employeeRoutes)
app.use("/api/profile", profileRoutes)

// Attendance & Scheduling routes
app.use("/api/shifts", shiftRoutes)
app.use("/api/schedules", scheduleRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/applications", applicationRoutes)
app.use("/api/holidays", holidayRoutes)
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
  app.listen(PORT, () => {
    console.log("Server start on port " + PORT)
    initCronJobs()
  })
})
