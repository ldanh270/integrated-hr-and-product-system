export const NOTIFICATION_TYPE = {
  SYSTEM: "system",
  APPROVAL: "approval",
  ALERT: "alert",
} as const

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE]
