import { Router } from "express"
import { NotificationController } from "@/controllers/notification.controller.ts"
import { NotificationService } from "@/services/notification.service.ts"
import { NotificationRepository } from "@/repositories/notification.repository.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"

const router = Router()

const notificationRepository = new NotificationRepository()
const notificationService = new NotificationService(notificationRepository)
const notificationController = new NotificationController(notificationService)

router.use(authenticate)

router.get("/", notificationController.getUserNotifications)
router.patch("/read-all", notificationController.markAllAsRead)
router.patch("/:id/read", notificationController.markAsRead)

export default router
