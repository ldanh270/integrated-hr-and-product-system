# HRM Request - Authentication & Authorization Endpoints

Base path: /api/auth và /api/security

## Required headers (all endpoints)

- Content-Type: application/json (Bắt buộc đối với các yêu cầu có gửi kèm dữ liệu dạng JSON trong Body).
- Authorization: Bearer {token} (Bắt buộc đối với các API yêu cầu xác thực bảo mật/phân quyền: Đăng xuất, Đổi mật khẩu, Nhật ký hoạt động, Dashboard bảo mật, Mở khóa tài khoản).

## Common status codes

- 200: Success (ResponseInfo).
- 400: Bad request (invalid request body, missing fields, or Zod validation errors).
- 401: Unauthorized (missing or invalid Authorization token).
- 403: Forbidden (insufficient roles or permissions).
- 404: Not found (resource not found).
- 500: Internal server error.

## POST /login (Đăng nhập)

Full URL: {{base_url}}/api/auth/login
Đăng nhập người dùng vào hệ thống và nhận mã Access Token (JWT). Body: JSON.

### Request Body

```json
{
  "username": "username_hoac_email",
  "password": "Mật khẩu (tối thiểu 8 ký tự, gồm 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt)"
}
```

### Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "employee": {
      "id": "7b58fae4-05db-4e1b-90a6-c9bc6b328a9b",
      "username": "nguyenvana",
      "email": "vana@company.com",
      "fullName": "Nguyễn Văn A",
      "role": "employee"
    }
  }
}
```

### Response (401 Unauthorized)

```json
{
  "status": "error",
  "message": "Invalid username or password"
}
```

---

## POST /logout (Đăng xuất)

Full URL: {{base_url}}/api/auth/logout
Đăng xuất người dùng ra khỏi hệ thống và lưu nhật ký hoạt động. Body: None.
Yêu cầu header `Authorization: Bearer {token}`.

### Response (200 OK)

```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

## POST /change-password (Thay đổi mật khẩu)

Full URL: {{base_url}}/api/auth/change-password
Thay đổi mật khẩu cho người dùng hiện tại đang đăng nhập. Body: JSON.
Yêu cầu header `Authorization: Bearer {token}`.

### Request Body

```json
{
  "oldPassword": "Mật khẩu hiện tại",
  "newPassword": "Mật khẩu mới (phải khác mật khẩu hiện tại, tối thiểu 8 ký tự, có chữ hoa, thường, số, ký tự đặc biệt)"
}
```

### Response (200 OK)

```json
{
  "status": "success",
  "message": "Password changed successfully."
}
```

---

## POST /forgot-password (Quên mật khẩu)

Full URL: {{base_url}}/api/auth/forgot-password
Yêu cầu gửi email đặt lại mật khẩu. Hệ thống sẽ gửi token reset về email nếu email tồn tại và đang hoạt động. Body: JSON.

### Request Body

```json
{
  "email": "employee_email@company.com"
}
```

### Response (200 OK - Luôn trả về phản hồi chung để bảo mật thông tin tài khoản)

```json
{
  "status": "success",
  "message": "If an account exists, a reset email has been sent."
}
```

---

## POST /validate-reset-token (Xác thực token reset mật khẩu)

Full URL: {{base_url}}/api/auth/validate-reset-token
Kiểm tra xem token đặt lại mật khẩu nhận từ email có hợp lệ và còn thời hạn hay không. Body: JSON.

### Request Body

```json
{
  "token": "token_chuoi_hex_nhan_tu_email"
}
```

### Response (200 OK - Token hợp lệ)

```json
{
  "status": "success",
  "data": {
    "isValid": true
  }
}
```

### Response (400 Bad Request - Token không hợp lệ hoặc đã hết hạn)

```json
{
  "status": "error",
  "message": "Reset link has expired"
}
```

---

## POST /reset-password (Đặt lại mật khẩu)

Full URL: {{base_url}}/api/auth/reset-password
Thiết lập mật khẩu mới bằng token reset mật khẩu nhận được qua email. Body: JSON.

### Request Body

```json
{
  "token": "token_chuoi_hex",
  "newPassword": "Mật khẩu mới muốn thay đổi"
}
```

### Response (200 OK)

```json
{
  "status": "success",
  "message": "Password reset successfully. You can now login with your new password."
}
```

---

## GET /activity-logs (Xem lịch sử hoạt động)

Full URL: {{base_url}}/api/auth/activity-logs
Lấy danh sách lịch sử hoạt động có phân trang và lọc dữ liệu. Body: Query Params.
Yêu cầu header `Authorization: Bearer {token}`. Vai trò được phép: `ADMIN`, `HR_MANAGER`, `GENERAL_MANAGER`.

### Optional Query Parameters

- `employeeId` (string): Lọc theo ID nhân viên
- `category` (string): Lọc theo nhóm hành động (`auth`, `role`, `security`)
- `actionType` (string): Lọc theo loại hành động (`login`, `logout`, `failed_login`, `account_locked`, v.v.)
- `fromDate` (date-string ISO): Từ ngày (Ví dụ: `2026-06-01T00:00:00Z`)
- `toDate` (date-string ISO): Đến ngày (Ví dụ: `2026-06-15T23:59:59Z`)
- `page` (int, default: 1): Trang cần xem
- `limit` (int, default: 20): Số bản ghi trên mỗi trang

### Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "data": [
      {
        "id": "e391ca34-738b-4b1f-aa2c-29a3a9bf8c19",
        "employeeId": "7b58fae4-05db-4e1b-90a6-c9bc6b328a9b",
        "employeeName": "Nguyễn Văn A",
        "category": "auth",
        "actionType": "login",
        "ipAddress": "127.0.0.1",
        "details": null,
        "createdAt": "2026-06-14T12:00:00.000Z"
      }
    ],
    "meta": {
      "total": 120,
      "page": 1,
      "limit": 20,
      "totalPages": 6
    }
  }
}
```

---

## GET /activity-logs/:id (Chi tiết lịch sử hoạt động)

Full URL: {{base_url}}/api/auth/activity-logs/{id}
Xem chi tiết một bản ghi lịch sử hoạt động theo ID. Body: None.
Yêu cầu header `Authorization: Bearer {token}`. Vai trò được phép: `ADMIN`, `HR_MANAGER`, `GENERAL_MANAGER`.

### Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "id": "e391ca34-738b-4b1f-aa2c-29a3a9bf8c19",
    "employeeId": "7b58fae4-05db-4e1b-90a6-c9bc6b328a9b",
    "employeeName": "Nguyễn Văn A",
    "category": "security",
    "actionType": "account_locked",
    "ipAddress": "127.0.0.1",
    "details": "{\"failedLoginCount\":5,\"lockedUntil\":\"2026-06-14T12:05:00.000Z\"}",
    "createdAt": "2026-06-14T12:00:00.000Z"
  }
}
```

---

## GET /security/dashboard (Tổng quan bảo mật)

Full URL: {{base_url}}/api/security/dashboard
Lấy thống kê nhanh phục vụ hiển thị Dashboard giám sát an ninh hệ thống. Body: None.
Yêu cầu header `Authorization: Bearer {token}`. Vai trò được phép: `ADMIN`, `GENERAL_MANAGER`, `HR_MANAGER`.

### Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "lockedAccountsCount": 2,
    "failedLoginsToday": 8,
    "successfulLoginsToday": 42,
    "recentSecurityEvents": [
      {
        "id": "a1b2c3d4-...",
        "employeeName": "Trần Văn B",
        "category": "security",
        "actionType": "account_locked",
        "createdAt": "2026-06-14T09:15:30.000Z"
      }
    ],
    "recentRoleEvents": []
  }
}
```

---

## GET /security/locked-accounts (Danh sách tài khoản bị khóa)

Full URL: {{base_url}}/api/security/locked-accounts
Lấy danh sách tất cả tài khoản nhân viên hiện đang bị khóa tạm thời do nhập sai mật khẩu quá 5 lần. Body: None.
Yêu cầu header `Authorization: Bearer {token}`. Vai trò được phép: `ADMIN`, `GENERAL_MANAGER`, `HR_MANAGER`.

### Response (200 OK)

```json
{
  "status": "success",
  "data": [
    {
      "employeeId": "8f8bca12-32a1-432d-98bc-ab543ef8902c",
      "employeeName": "Trần Văn B",
      "email": "tranvanb@company.com",
      "failedLoginCount": 5,
      "lockedUntil": "2026-06-14T13:05:00.000Z"
    }
  ]
}
```

---

## PATCH /security/unlock/:employeeId (Mở khóa tài khoản)

Full URL: {{base_url}}/api/security/unlock/{employeeId}
Mở khóa tài khoản thủ công cho nhân viên đang bị khóa. Body: None.
Yêu cầu header `Authorization: Bearer {token}`. Vai trò được phép: `ADMIN`, `GENERAL_MANAGER`, `HR_MANAGER`.

### Response (200 OK)

```json
{
  "status": "success",
  "message": "Account unlocked successfully"
}
```
