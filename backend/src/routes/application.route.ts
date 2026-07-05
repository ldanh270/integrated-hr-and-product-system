import { ApplicationController } from "@/controllers/application.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { PrismaApplicationRepository } from "@/repositories/application.repository.ts"
import { ApplicationService } from "@/services/application.service.ts"

import express from "express"

import { NotificationService } from "@/services/notification.service.ts"
import { NotificationRepository } from "@/repositories/notification.repository.ts"

const applicationRoutes = express.Router()

const notifRepo = new NotificationRepository()
const notifService = new NotificationService(notifRepo)
const repository = new PrismaApplicationRepository(prisma)
const service = new ApplicationService(repository, notifService)
const controller = new ApplicationController(service)

// All routes require authentication
applicationRoutes.use(authenticate)

// ─── Employee endpoints ───────────────────────────────────────

import multer from "multer"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB max
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(new Error("Chỉ cho phép ảnh (JPEG, PNG, WEBP, GIF) hoặc PDF"))
    } else {
      cb(null, true)
    }
  },
})

// Submit a new application (any authenticated employee)
applicationRoutes.post("/", controller.submit)

// Upload attachment
applicationRoutes.post("/upload-attachment", upload.single("file"), controller.uploadAttachment as express.RequestHandler)

// List own applications (with pagination + filters)
applicationRoutes.get("/me", controller.listMine)

// Get specific application by ID (own or manager)
applicationRoutes.get("/:id", controller.getById)

// Cancel own pending application
applicationRoutes.patch("/:id/cancel", controller.cancel)

// Partner approves shift swap
applicationRoutes.patch("/:id/partner-approve", controller.partnerApprove)

// ─── Manager endpoints ────────────────────────────────────────

// List all applications across all employees
applicationRoutes.get(
  "/",
  requirePermission("application.read"),
  controller.listAll,
)

// List applications for a specific employee
applicationRoutes.get(
  "/employee/:employeeId",
  requirePermission("application.read"),
  controller.listByEmployee,
)

// Approve an application (sets status=approved)
applicationRoutes.patch(
  "/:id/approve",
  requirePermission("application.approve"),
  controller.approve,
)

// Reject an application with a mandatory rejectReason
applicationRoutes.patch(
  "/:id/reject",
  requirePermission("application.approve"),
  controller.reject,
)

export default applicationRoutes
