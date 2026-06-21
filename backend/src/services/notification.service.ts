import { ICreateNotificationDTO, INotificationRepository, INotificationService } from "@/types/notification.types.ts"

export class NotificationService implements INotificationService {
  constructor(private notificationRepo: INotificationRepository) {}

  /**
   * Creates a new notification for a specific user.
   * 
   * @param data - The notification data.
   * @returns A promise that resolves to the created notification.
   */
  async createNotification(data: ICreateNotificationDTO) {
    return this.notificationRepo.create(data)
  }

  /**
   * Retrieves all notifications for a specific user.
   * 
   * @param userId - The ID of the user.
   * @returns A promise that resolves to a list of notifications.
   */
  async getUserNotifications(userId: string) {
    return this.notificationRepo.findByUserId(userId)
  }

  /**
   * Marks a specific notification as read.
   * 
   * @param id - The ID of the notification.
   * @param userId - The ID of the user owning the notification.
   * @returns A promise that resolves to the update result.
   */
  async markAsRead(id: string, userId: string) {
    return this.notificationRepo.markAsRead(id, userId)
  }

  /**
   * Marks all unread notifications as read for a specific user.
   * 
   * @param userId - The ID of the user.
   * @returns A promise that resolves to the update result.
   */
  async markAllAsRead(userId: string) {
    return this.notificationRepo.markAllAsRead(userId)
  }
}
