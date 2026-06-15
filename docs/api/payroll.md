# HRM Request - Payroll & Salary Endpoints

Base paths: `/api/salary-components`, `/api/salary-variables`, `/api/payslip-templates`, `/api/employees`, `/api/payrolls`

## Required headers (all endpoints)

- Content-Type: application/json (Bắt buộc đối với các yêu cầu có gửi kèm dữ liệu dạng JSON trong Body).
- Authorization: Bearer {token} (Bắt buộc đối với tất cả các API).

## Common status codes

- 200: Success (Phản hồi thành công).
- 201: Created (Tạo mới thành công).
- 400: Bad request (Lỗi dữ liệu đầu vào hoặc lỗi nghiệp vụ, ví dụ: công thức lương sai).
- 401: Unauthorized (Không có token hoặc token không hợp lệ).
- 403: Forbidden (Không đủ quyền để thực hiện hành động).
- 404: Not found (Không tìm thấy tài nguyên).
- 500: Internal server error.

---

## 1. Salary Component APIs (Thành phần lương)

Thành phần lương có thể là một khoản cộng (`addition`) hoặc trừ (`deduction`), giá trị có thể là tiền mặt (`currency`), số (`number`), phần trăm (`percentage`). Các thành phần này sẽ có công thức (`formula`) sử dụng các biến số (`variables`).

### GET /api/salary-components

Lấy danh sách các thành phần lương. Body: None.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

### POST /api/salary-components

Tạo mới một thành phần lương. Body: JSON.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

```json
{
  "name": "Phụ cấp ăn trưa",
  "type": "addition",
  "valueType": "currency",
  "formula": "500000",
  "description": "Phụ cấp ăn trưa hàng tháng"
}
```

### PUT /api/salary-components/:id

Cập nhật thông tin thành phần lương. Body: JSON.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

### DELETE /api/salary-components/:id

Xóa (hoặc vô hiệu hóa) thành phần lương. Body: None.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

### POST /api/salary-components/validate

Xác thực tính đúng đắn của công thức lương. Body: JSON.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

```json
{
  "formula": "base_salary * 0.1 + overtime_hours * 100000"
}
```

---

## 2. Salary Variable APIs (Biến số lương)

Biến số được dùng để đưa vào tính toán công thức lương (Ví dụ: mức thuế, mức giảm trừ gia cảnh, hoặc các biến hệ thống).

### GET /api/salary-variables

Lấy danh sách các biến số. Body: None.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

### GET /api/salary-variables/:id

Lấy chi tiết một biến số theo ID. Body: None.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

### POST /api/salary-variables

Tạo mới một biến số lương. Body: JSON.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

```json
{
  "code": "TAX_RATE",
  "name": "Thuế thu nhập",
  "value": 10,
  "description": "Mức thuế chung 10%"
}
```

### PUT /api/salary-variables/:id

Cập nhật biến số lương. Body: JSON.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

### DELETE /api/salary-variables/:id

Xóa biến số lương. Body: None.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

---

## 3. Payslip Template APIs (Mẫu phiếu lương)

Quản lý các mẫu phiếu lương áp dụng cho từng nhóm nhân sự, bao gồm các thành phần lương (Salary Component) cụ thể.

### GET /api/payslip-templates

Lấy danh sách các mẫu phiếu lương. Body: None.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

### POST /api/payslip-templates

Tạo mới một mẫu phiếu lương. Body: JSON.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

```json
{
  "name": "Mẫu lương NV Văn Phòng",
  "description": "Áp dụng cho khối văn phòng",
  "componentIds": ["comp_id_1", "comp_id_2"]
}
```

### PUT /api/payslip-templates/:id

Cập nhật mẫu phiếu lương. Body: JSON.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

### DELETE /api/payslip-templates/:id

Xóa mẫu phiếu lương. Body: None.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

---

## 4. Employee Salary Config APIs (Cấu hình lương nhân viên)

Cài đặt mức lương cơ bản và áp dụng mẫu lương cho nhân viên cụ thể.

### GET /api/employees/:id/salary-config

Lấy cấu hình lương đang được áp dụng hiện tại của một nhân viên. Body: None.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

### GET /api/employees/:id/salary-config/history

Lấy lịch sử các lần thay đổi cấu hình lương của nhân viên. Body: None.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

### POST /api/employees/:id/salary-config

Gán cấu hình lương mới cho nhân viên. Body: JSON.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

```json
{
  "templateId": "template_id_here",
  "baseSalary": 15000000,
  "effectiveFrom": "2026-06-01T00:00:00Z",
  "effectiveTo": null,
  "note": "Tăng lương định kỳ"
}
```

---

## 5. Payroll & Payslip APIs (Bảng lương & Phiếu lương)

### GET /api/payrolls/settings

Lấy cấu hình chu kỳ tự động tính lương (Ngày, Giờ, Phút trong tháng). Body: None.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

### PUT /api/payrolls/settings

Cập nhật cài đặt chu kỳ tính lương. Body: JSON.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

```json
{
  "triggerDay": 25,
  "triggerHour": 0,
  "triggerMinute": 0
}
```

### POST /api/payrolls/generate

Tính toán và tạo ra một Bảng lương mới cho tháng/năm chỉ định (Tính lương toàn bộ công ty hoặc 1 nhóm nhân sự). Body: JSON.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

```json
{
  "periodMonth": 6,
  "periodYear": 2026,
  "name": "Bảng lương tháng 6/2026"
}
```

### GET /api/payrolls

Lấy danh sách các bảng lương đã được tạo. Body: None.
Yêu cầu: `ADMIN`, `HR_MANAGER`, `GENERAL_MANAGER`.

### GET /api/payrolls/:id

Xem chi tiết một bảng lương cụ thể (Bao gồm tổng quan và danh sách phiếu lương các nhân viên thuộc bảng lương này). Body: None.
Yêu cầu: `ADMIN`, `HR_MANAGER`, `GENERAL_MANAGER`.

### POST /api/payrolls/:id/approve

Phê duyệt bảng lương (Chuyển trạng thái từ `pending_approval` -> `approved`). Body: None.
Yêu cầu: `ADMIN`, `GENERAL_MANAGER`.

### POST /api/payrolls/:id/reject

Từ chối bảng lương, yêu cầu làm lại. Body: JSON.
Yêu cầu: `ADMIN`, `GENERAL_MANAGER`.

```json
{
  "rejectReason": "Sai số liệu phụ cấp ăn trưa"
}
```

### GET /api/payrolls/:id/payslips/:empId

Lấy chi tiết phiếu lương (Payslip) của một nhân viên trong một bảng lương cụ thể. Body: None.
Yêu cầu: `ADMIN`, `HR_MANAGER`, `GENERAL_MANAGER`.

### GET /api/payrolls/employee/:empId/payslips

Lấy danh sách lịch sử tất cả các phiếu lương (của các tháng) của một nhân viên. Body: None.
Yêu cầu: `ADMIN`, `HR_MANAGER`.

### GET /api/payrolls/my/payslips

Lấy danh sách các phiếu lương của CHÍNH nhân viên đang đăng nhập. (Dành cho mọi Role `EMPLOYEE`). Body: None.
Yêu cầu: `Tất cả các Role`.

```json
{
  "status": "success",
  "data": [
    {
      "id": "payslip_id_1",
      "payroll": {
        "periodMonth": 5,
        "periodYear": 2026
      },
      "totalAdditions": 2000000,
      "totalDeductions": 500000,
      "netSalary": 16500000
    }
  ]
}
```
