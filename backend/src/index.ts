import { connectDB } from "@/libs/database.ts"
import { cors } from "@/middlewares/cors.middleware.ts"
import authRoutes from "@/routes/auth.route.ts"
import employeeRoutes from "@/routes/employee.route.ts"

import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import express, { NextFunction, Request, Response } from "express"
import path from "path"
import swaggerUi from "swagger-ui-express"
import YAML from "yamljs"

/**
 * Server configurations
 */
dotenv.config() // Create config for using .env variables
const PORT = process.env.PORT || 5000 // Port where server runing on
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
app.use(cookieParser())

/**
 * Main routers
 */

// Public routes
app.get("/", async (req, res) =>
  res.status(200).json({ message: "Connect to server successfully" }),
)

app.use("/api/auth", authRoutes)
app.use("/api/employees", employeeRoutes)

// Private routes

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  })
})

// Global error
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("GLOBAL ERROR:", err)
  res.status(500).send("Internal Server Error")
})

/**
 * Must connect to database successfully before start server
 */
connectDB().then(() =>
  app.listen(PORT, () => {
    console.log("Server start on port " + PORT)
  }),
)
