# HRM Application - Endpoints

Base path: /api/applications

## Required headers (all endpoints)

- x-requestid: UUID (required by CheckRequestId filter).
- x-apikey: API key (required by CheckRequestId filter).
- Authorization: Bearer {token} (required by API security scheme; used for identity/serial checks).
- x-serial-number: required when header x-fromWeb is not true; validated against token serial in CheckRequestId.

## Common status codes

- 200: Success.
- 201: Created (for POST requests).
- 400: Bad request (invalid request id, missing/invalid api key, or validation/Zod errors).
- 401: Unauthorized.
- 403: Forbidden (Insufficient role permissions).
- 406: Not acceptable (serial mismatch).
- 500: Internal server error.

---

## POST / (Tạo đơn)

Full URL: https://api-staging-lm.vnbro.com/api/applications
Create a new application. Body: JSON.
_Lưu ý: `employeeId` được hệ thống tự động trích xuất từ JWT token._

Required base fields (validated via Zod):

- type (string): "leave" | "overtime" | "work_from_home" | "shift_swap" | "business_trip" | "late_early" | "regime"
- startDate (date-time)
- detail (object): Yêu cầu các field cụ thể phụ thuộc vào giá trị của `type` (xem chi tiết bên dưới)

Optional base fields:

- endDate (date-time) - _Bắt buộc (Required) nếu type là "leave"_
- reason (string): 5 đến 500 ký tự
- note (string): Tối đa 1000 ký tự
- assignedToId (string cuid)

### Chi tiết required fields trong object `detail` theo từng `type`:

**1. type = "leave" (Đơn xin nghỉ phép)**

- Required: `leaveType` (enum), `regimeType` (enum).
- _(Nhắc lại: Bắt buộc phải có `endDate` ở phần base fields)._

**2. type = "overtime" (Đơn làm thêm giờ)**

- Required: `employeeShiftId` (string cuid).

**3. type = "work_from_home" (Đơn làm việc tại nhà/từ xa)**

- Optional: `location` (string, max 255 ký tự).

**4. type = "shift_swap" (Đơn đổi ca)**

- Required: `employeeShiftId` (string cuid).
- Optional: `workingShiftId` (string cuid), `swapWithEmployeeId` (string cuid), `swapWithShiftId` (string cuid).

**5. type = "business_trip" (Đơn công tác)**

- Required: `location` (string, 2-255 ký tự).
- Optional: `purpose` (string, max 500 ký tự), `budget` (number).

**6. type = "late_early" (Đơn đi muộn / về sớm)**

- Required: `employeeShiftId` (string cuid), `durationMinutes` (int, 1-480 phút), `isLate` (boolean).

**7. type = "regime" (Đơn chế độ: thai sản / con ốm...)**

- Required: `regimeType` (enum), `reducedMinutesPerDay` (int, 0-480).
- Optional: `applyToStart` (boolean, default false), `applyToEnd` (boolean, default false), `documentUrl` (url string).

---

## GET /me (Danh sách đơn của tôi)

Full URL: https://api-staging-lm.vnbro.com/api/applications/me
List own applications with pagination and filters.

Query parameters (optional):

- page (int): default 1
- pageSize (int): default 20
- type (string)
- status (string)
- startDate (date-time)
- endDate (date-time)

---

## GET /:id (Chi tiết đơn)

Full URL: https://api-staging-lm.vnbro.com/api/applications/{id}
Get specific application by ID (dành cho người nộp hoặc Quản lý).

---

## PATCH /:id/cancel (Hủy đơn)

Full URL: https://api-staging-lm.vnbro.com/api/applications/{id}/cancel
Cancel own pending application. Body: JSON.

Optional fields:

- reason (string): max 500 ký tự

---

## GET / (Danh sách toàn bộ đơn)

Full URL: https://api-staging-lm.vnbro.com/api/applications
List all applications across the organization.
_Yêu cầu quyền: Admin, HR Manager, General Manager, hoặc Team Leader._

Query parameters (optional):

- page (int): default 1
- pageSize (int): default 20
- type (string)
- status (string)
- employeeId (string cuid)
- startDate (date-time)
- endDate (date-time)

---

## GET /employee/:employeeId (Danh sách đơn theo nhân viên)

Full URL: https://api-staging-lm.vnbro.com/api/applications/employee/{employeeId}
List applications for a specific employee.
_Yêu cầu quyền: Admin, HR Manager, General Manager, hoặc Team Leader._

Required fields:

- employeeId (string cuid) truyền vào qua params trên URL. _(Note: Code hiện tại trong Controller có thể đang check thêm trường `employeeId` gửi qua Body, bạn cần gửi kèm body `{ "employeeId": "..." }` cho an toàn nếu chưa refactor)._

Query parameters (optional):

- Same as GET `/me` (page, pageSize, type, status, startDate, endDate).

---

## PATCH /:id/approve (Duyệt đơn)

Full URL: https://api-staging-lm.vnbro.com/api/applications/{id}/approve
Approve a pending application.
_Yêu cầu quyền: Admin, HR Manager, General Manager, hoặc Team Leader._
Body: JSON.

Required fields:

- status (string): Bắt buộc giá trị là `"approved"`

---

## PATCH /:id/reject (Từ chối đơn)

Full URL: https://api-staging-lm.vnbro.com/api/applications/{id}/reject
Reject a pending application.
_Yêu cầu quyền: Admin, HR Manager, General Manager, hoặc Team Leader._
Body: JSON.

Required fields:

- rejectReason (string): Bắt buộc từ 5 đến 500 ký tự.

Optional fields:

- status (string): `"rejected"`
