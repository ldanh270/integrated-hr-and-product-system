import { TaskStatus } from "@prisma/client"
import { TASK_STATUS } from "@/configs/entities/project.config.ts"

/**
 * Maps a dynamic custom status name and completed flag back to the closest matching Prisma TaskStatus enum.
 * This is crucial for backward compatibility with existing features/branches that query task.status directly.
 */
export function mapStatusNameToEnum(name: string, isCompleted: boolean): TaskStatus {
  const norm = name.toLowerCase().trim()
  if (norm.includes("todo") || norm.includes("to do") || norm.includes("cần làm") || norm.includes("chuẩn bị")) {
    return TASK_STATUS.TODO
  }
  if (norm.includes("in progress") || norm.includes("in_progress") || norm.includes("đang làm") || norm.includes("đang thực hiện")) {
    return TASK_STATUS.IN_PROGRESS
  }
  if (norm.includes("review") || norm.includes("đánh giá") || norm.includes("kiểm tra")) {
    return TASK_STATUS.IN_REVIEW
  }
  if (norm.includes("done") || norm.includes("hoàn thành") || norm.includes("đã xong") || norm.includes("đóng") || norm.includes("closed")) {
    return TASK_STATUS.DONE
  }
  if (norm.includes("cancel") || norm.includes("hủy")) {
    return TASK_STATUS.CANCELLED
  }
  if (norm.includes("reopen") || norm.includes("mở lại")) {
    return TASK_STATUS.REOPENED
  }
  return isCompleted ? TASK_STATUS.DONE : TASK_STATUS.TODO
}
