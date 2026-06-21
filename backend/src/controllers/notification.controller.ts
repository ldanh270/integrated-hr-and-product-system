import { Response } from "express"
import { INotificationService } from "@/types/notification.types.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { ApiResponse } from "@/types"

export class NotificationController {
  constructor(private notificationService: INotificationService) {}

  /**
   * Retrieves all notifications for the authenticated user.
   * 
   * @param req - The authenticated request.
   * @param res - The response object containing the API response envelope.
   * @returns A promise that resolves to the response with the list of notifications.
   */
  getUserNotifications = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const userId = req.user!.empId
      const notifications = await this.notificationService.getUserNotifications(userId)
      res.status(HttpStatusCode.OK).json({ data: notifications, error: null })
    } catch (error) {
      throw error
    }
  }

  /**
   * Marks a specific notification as read for the authenticated user.
   * 
   * @param req - The authenticated request containing the notification ID parameter.
   * @param res - The response object containing the API response envelope.
   * @returns A promise that resolves to the response.
   */
  markAsRead = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const userId = req.user!.empId
      const id = String(req.params.id)
      await this.notificationService.markAsRead(id, userId)
      res.status(HttpStatusCode.OK).json({ data: { success: true }, error: null })
    } catch (error) {
      throw error
    }
  }

  /**
   * Marks all notifications as read for the authenticated user.
   * 
   * @param req - The authenticated request.
   * @param res - The response object containing the API response envelope.
   * @returns A promise that resolves to the response.
   */
  markAllAsRead = async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    try {
      const userId = req.user!.empId
      await this.notificationService.markAllAsRead(userId)
      res.status(HttpStatusCode.OK).json({ data: { success: true }, error: null })
    } catch (error) {
      throw error
    }
  }
}
