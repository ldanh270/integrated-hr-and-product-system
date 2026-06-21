import type { Notification } from "@prisma/client"

export interface ICreateNotificationDTO {
  userId: string
  title: string
  message: string
  type?: string
  link?: string
}

export interface INotificationRepository {
  create(data: ICreateNotificationDTO): Promise<Notification>
  findByUserId(userId: string): Promise<Notification[]>
  markAsRead(id: string, userId: string): Promise<any>
  markAllAsRead(userId: string): Promise<any>
}

export interface INotificationService {
  createNotification(data: ICreateNotificationDTO): Promise<Notification>
  getUserNotifications(userId: string): Promise<Notification[]>
  markAsRead(id: string, userId: string): Promise<any>
  markAllAsRead(userId: string): Promise<any>
}
