export interface ICreateNotificationDTO {
  userId: string
  title: string
  message: string
  type?: string
  link?: string
}

export interface INotificationRepository {
  create(data: ICreateNotificationDTO): Promise<any>
  findByUserId(userId: string): Promise<any[]>
  markAsRead(id: string, userId: string): Promise<any>
  markAllAsRead(userId: string): Promise<any>
}

export interface INotificationService {
  createNotification(data: ICreateNotificationDTO): Promise<any>
  getUserNotifications(userId: string): Promise<any[]>
  markAsRead(id: string, userId: string): Promise<any>
  markAllAsRead(userId: string): Promise<any>
}
