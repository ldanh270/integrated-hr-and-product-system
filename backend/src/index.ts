import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { PORT } from "@/configs/system/server.config.ts"
import { connectDB } from "@/libs/database.ts"
import { cors } from "@/middlewares/cors.middleware.ts"
import applicationRoutes from "@/routes/application.route.ts"
import approvalRoutes from "@/routes/approval.route.ts"
import attendanceRoutes from "@/routes/attendance.route.ts"
import authRoutes from "@/routes/auth.route.ts"
import employeeRoutes from "@/routes/employee.route.ts"
import employeeSalaryConfigRoutes from "@/routes/employee-salary-config.route.ts"
import holidayRoutes from "@/routes/holiday.route.ts"
import payrollRoutes from "@/routes/payroll.route.ts"
import payslipTemplateRoutes from "@/routes/payslip-template.route.ts"
import profileRoutes from "@/routes/profile.route.ts"
import salaryComponentRoutes from "@/routes/salary-component.route.ts"
import salaryVariableRoutes from "@/routes/salary-variable.route.ts"
import scheduleRoutes from "@/routes/schedule.route.ts"
import shiftRoutes from "@/routes/shift.route.ts"

import dotenv from "dotenv"
import express, { NextFunction, Request, Response } from "express"
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

// 404 handler
app.use((req, res) => {
  res.status(HttpStatusCode.NOT_FOUND).json({
    status: "error",
    message: "Route not found",
  })
})

// Global error
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err?.name === "AppError" || err?.statusCode) {
    res.status(err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      data: null,
      error: {
        message: err.message,
        code: err.errorCode || (err.layer ? err.layer.toUpperCase() + "_ERROR" : "APP_ERROR"),
      },
    })
    return
  }

  console.error("GLOBAL ERROR:", err)
  res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
    data: null,
    error: {
      message: "Internal Server Error",
      code: "INTERNAL_SERVER_ERROR",
    },
  })
})

import { initCronJobs } from "@/libs/payroll-cron.ts"

/**
 * Must connect to database successfully before start server
 */
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server start on port " + PORT)
    initCronJobs()
  })
})
