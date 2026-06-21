import { NOTIFICATION_TYPE } from "@/configs/entities/notification.config.ts"
import { prisma } from "@/libs/database.ts"
import { ICreateNotificationDTO, INotificationRepository } from "@/types/notification.types.ts"

export class NotificationRepository implements INotificationRepository {
  /**
   * Creates a new notification for a specific user.
   * 
   * @param data - The notification data including userId, title, message, type, and link.
   * @returns A promise that resolves to the created notification.
   */
  async create(data: ICreateNotificationDTO) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || NOTIFICATION_TYPE.SYSTEM,
        link: data.link,
      },
    })
  }

  /**
   * Retrieves all notifications for a specific user, ordered by creation date descending.
   * 
   * @param userId - The ID of the user.
   * @returns A promise that resolves to a list of notifications.
   */
  async findByUserId(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Marks a specific notification as read for a user.
   * 
   * @param id - The ID of the notification.
   * @param userId - The ID of the user owning the notification.
   * @returns A promise that resolves to the update result.
   */
  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    })
  }

  /**
   * Marks all unread notifications as read for a specific user.
   * 
   * @param userId - The ID of the user.
   * @returns A promise that resolves to the update result.
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  }
}
