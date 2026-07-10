/** User-facing attendance copy — mirror backend attendance.message.ts where applicable. */
export const ATTENDANCE_MESSAGES = {
  ERRORS: {
    SCAN_FAILED: "Lỗi khi chấm công",
  },
  SCANNER: {
    TITLE: "Máy Chấm Công Ảo",
    TODAY_SHIFT: "Ca hôm nay",
    SHIFT_NAME: "Tên ca",
    WORK_WINDOW: "Giờ làm",
    CHECK_IN_WINDOW: "Check-in đúng giờ",
    CHECK_OUT_WINDOW: "Check-out",
    CHECK_OUT_FROM: "Từ",
    NO_GPS_CONFIGURED: "Chưa cấu hình GPS",
    GPS_RADIUS_LABEL: (radius: number, lat: number, lng: number) =>
      `${radius}m quanh ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    NO_SHIFT_TODAY: "Chưa có ca làm việc được phân cho hôm nay.",
    GEO_NOT_SUPPORTED: "Trình duyệt không hỗ trợ lấy vị trí GPS",
    GEO_PERMISSION_DENIED: "Vui lòng cho phép truy cập vị trí để chấm công",
    GEO_LOCATING: "Đang lấy vị trí GPS...",
    GEO_READY: (lat: number, lng: number) => `📍 Đã lấy vị trí: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    GEO_MISSING: "⚠️ Chưa có vị trí GPS",
    GEO_PERMISSION_HINT:
      "Yêu cầu quyền truy cập vị trí (Location Permission) từ trình duyệt để đảm bảo chấm công đúng địa điểm.",
    CHECK_IN_SUCCESS: "Check-in thành công!",
    CHECK_OUT_SUCCESS: "Check-out thành công!",
    CHECK_IN_LABEL: "Check-in",
    CHECK_OUT_LABEL: "Check-out",
    PROCESSING: (actionLabel: string) => `Đang ${actionLabel}...`,
  },
} as const
