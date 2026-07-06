export interface RouteManifestEntry {
  name: string
  description?: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "ALL"
  path: string
  authRequired: boolean
  permissions: string[] | null // Array of permissions or null if no specific permission is required
}

export const ROUTE_MANIFEST: RouteManifestEntry[] = [
  // Auth
  { name: "Đăng nhập", description: "Xác thực người dùng bằng username/password", method: "POST", path: "/api/auth/login", authRequired: false, permissions: null },
  { name: "Đăng xuất", description: "Xóa token và phiên làm việc", method: "POST", path: "/api/auth/logout", authRequired: true, permissions: null },
  { name: "Lấy thông tin cá nhân", description: "Lấy thông tin user hiện tại", method: "GET", path: "/api/auth/me", authRequired: true, permissions: null },
  
  // Attendance
  { name: "Lấy dữ liệu điểm danh", description: "Lấy danh sách điểm danh", method: "GET", path: "/api/attendance", authRequired: true, permissions: null },
  { name: "Xuất báo cáo điểm danh", description: "Xuất file Excel báo cáo", method: "GET", path: "/api/attendance/export", authRequired: true, permissions: ["attendance.export"] },
  { name: "Chấm công (Check-in)", method: "POST", path: "/api/attendance/check-in", authRequired: true, permissions: null },
  { name: "Chấm công (Check-out)", method: "POST", path: "/api/attendance/check-out", authRequired: true, permissions: null },
  
  // Payroll
  { name: "Xem bảng lương cá nhân", description: "Lấy danh sách phiếu lương của tôi", method: "GET", path: "/api/payrolls/my/payslips", authRequired: true, permissions: null },
  { name: "Lấy danh sách bảng lương", description: "Cho bộ phận HR/Admin", method: "GET", path: "/api/payrolls", authRequired: true, permissions: ["payroll.read"] },
  { name: "Tạo kỳ lương mới", method: "POST", path: "/api/payrolls/generate", authRequired: true, permissions: ["payroll.create"] },
  { name: "Duyệt bảng lương", method: "POST", path: "/api/payrolls/:id/approve", authRequired: true, permissions: ["payroll.approve"] },
  { name: "Cập nhật cài đặt lương", method: "PUT", path: "/api/payrolls/settings", authRequired: true, permissions: ["payroll.update"] },
  
  // Roles & Permissions
  { name: "Lấy danh sách Role", method: "GET", path: "/api/roles", authRequired: true, permissions: ["role.read"] },
  { name: "Tạo Role mới", method: "POST", path: "/api/roles", authRequired: true, permissions: ["role.create"] },
  { name: "Cập nhật quyền cho Role", method: "PUT", path: "/api/roles/:id/permissions", authRequired: true, permissions: ["role.update"] },
  { name: "Lấy danh sách toàn bộ quyền", method: "GET", path: "/api/permissions", authRequired: true, permissions: ["role.read"] },
  
  // Audit
  { name: "Xem nhật ký hệ thống", method: "GET", path: "/api/audit", authRequired: true, permissions: ["audit.read"] },
  { name: "Xem nhật ký cá nhân", method: "GET", path: "/api/auth/me/activity-logs", authRequired: true, permissions: null },
]
