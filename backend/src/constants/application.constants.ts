export const APPLICATION_SERVICE_ERRORS = {
  INVALID_DATE_RANGE: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
  NOT_FOUND: "Không tìm thấy đơn",
  CANCEL_FORBIDDEN: "Từ chối quyền: Bạn chỉ có thể hủy đơn của chính mình",
  INVALID_STATUS_TRANSITION: (status: string) =>
    `Không thể chuyển đổi trạng thái cho đơn có trạng thái '${status}'`,
  CANCEL_FAILED: "Hủy đơn thất bại",
  EMPLOYEE_NOT_FOUND: (id: string) => `Không tìm thấy nhân viên '${id}'`,
  VIEW_FORBIDDEN: "Từ chối quyền: Bạn chỉ có thể xem đơn của nhân viên trong dự án của bạn",
  APPROVE_FAILED: "Duyệt đơn thất bại",
  REJECT_FAILED: "Từ chối đơn thất bại",
  USE_REJECT_ENDPOINT: "Sử dụng rejectApplication() — rejectReason là bắt buộc",
  INVALID_TRANSITION_TARGET: (status: string) => `Chuyển đổi trạng thái không hợp lệ: '${status}'`,
  INVALID_SWAP_APP: "Đơn không hợp lệ hoặc không phải là đơn đổi ca",
  SWAP_PARTNER_FORBIDDEN: "Từ chối quyền: Bạn không phải là người đổi ca trong đơn này",
  SWAP_PARTNER_RESPONDED: "Người được yêu cầu đổi ca đã phản hồi",
  SWAP_REJECTED_REASON: "Nhân viên được yêu cầu đổi ca đã từ chối.",
  APPROVER_NOT_FOUND: (id: string) => `Không tìm thấy người duyệt có ID '${id}'`,
  INVALID_APPROVER_ROLE: "Người được chọn không có quyền duyệt đơn",
} as const

export const APPLICATION_SERVICE_NOTIFICATIONS = {
  SWAP_AGREED_TITLE: "Đơn đổi ca đã được 2 bên đồng ý",
  SWAP_AGREED_MSG: "Đơn đổi ca đã được cả 2 nhân viên đồng ý. Vui lòng kiểm tra và duyệt.",
  SWAP_REJECTED_TITLE: "Đơn đổi ca bị từ chối",
  SWAP_REJECTED_MSG: "Nhân viên bạn muốn đổi ca cùng đã từ chối yêu cầu của bạn.",
} as const

export const APPLICATION_CONTROLLER_ERRORS = {
  UNAUTHORIZED: "Unauthorized",
  NO_ACCESS: "Không có quyền truy cập",
  NO_FILE: "Không có tệp nào được tải lên",
  UPLOAD_CLOUDINARY_FAILED: "Tải lên Cloudinary thất bại",
  UPLOAD_FAILED: "Tải lên tệp đính kèm thất bại",
  INVALID_QUERY: "Invalid query parameters",
  MISSING_EMPLOYEE_ID: "Missing employeeId in request body",
  VALIDATION_ERROR: "Validation error",
} as const

export const APPLICATION_NOTES = {
  WFH_APPROVED: "WFH có phê duyệt",
  LATE: "đi muộn",
  EARLY: "về sớm",
  LATE_EARLY_APPROVED: (action: string, minutes: number) => `Được duyệt ${action}: ${minutes} phút`,
} as const
