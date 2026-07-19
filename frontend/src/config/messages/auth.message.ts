/** Centralized copy for session expiry and temporary authorization outages. */
export const AUTH_MESSAGES = {
  AUTHORIZATION_UNAVAILABLE: {
    TITLE: "Không thể xác minh quyền truy cập",
    DESCRIPTION:
      "Máy chủ xác thực đang tạm thời không phản hồi. Phiên đăng nhập của bạn vẫn được giữ.",
    RETRY: "Thử lại",
  },
  SESSION_EXPIRED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
} as const
