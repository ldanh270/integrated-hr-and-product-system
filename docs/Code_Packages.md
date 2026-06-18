# Code Packages

## Package Diagram
*(See Code_Packages.drawio for the visual diagram)*

## Package Descriptions

| # | Package (Thư mục) | Description (Mô tả chức năng) |
|---|---|---|
| 01 | `backend/routes` | Định nghĩa các API endpoints và liên kết request tới controllers tương ứng. |
| 02 | `backend/middlewares` | Chặn và xử lý request trước khi vào hệ thống (Xác thực JWT, phân quyền, v.v.). |
| 03 | `backend/controllers` | Chịu trách nhiệm nhận HTTP request, gọi Service và trả về HTTP response. |
| 04 | `backend/services` | Nơi chứa toàn bộ logic nghiệp vụ (Business Logic) cốt lõi của hệ thống. |
| 05 | `backend/repositories` | Tầng tương tác trực tiếp với cơ sở dữ liệu (Database access layer). |
| 06 | `backend/entities` | Định nghĩa cấu trúc các bảng/collection trong cơ sở dữ liệu (Database schemas). |
| 07 | `frontend/routes` | Định tuyến điều hướng URL ở phía trình duyệt để mở trang tương ứng. |
| 08 | `frontend/pages` | Các file giao diện toàn trang của từng tính năng cụ thể. |
| 09 | `frontend/components` | Các thành phần giao diện nhỏ (UI elements) độc lập, có thể tái sử dụng. |
| 10 | `frontend/hooks` | Chứa các Custom Hook (React) dùng để gọi API Backend và xử lý logic chung. |
| 11 | `frontend/store` | Quản lý trạng thái toàn cục (Global State) của Frontend. |
