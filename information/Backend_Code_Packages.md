# Backend Code Packages

## Package Diagram

_(Vui lòng mở file `Backend_Code_Packages.drawio` bằng phần mềm Draw.io / Diagrams.net để xem giao diện sơ đồ mũi tên chi tiết)._

## Detailed Package Descriptions (Kiến trúc Backend)

Dự án tuân theo kiến trúc Clean Architecture rất chặt chẽ, chia rạch ròi trách nhiệm của từng thư mục để dễ bảo trì và mở rộng.

| #   | Package (Thư mục) | Chức năng & Mô tả chi tiết (Description)                                                                                                                                           |
| --- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | `configs`         | Chứa cấu hình hệ thống (Database, Mailer, JWT, Cloud) lấy từ `.env`. Phân cụm rõ ràng theo tính năng (auth, entities, system, rules).                                              |
| 02  | `constants`       | Lưu trữ hằng số, các `ENUM` (Trạng thái nhân viên, Vai trò, Loại phép). Nguyên tắc bắt buộc: Phải đồng bộ khớp 100% với giá trị lưu trong Database.                                |
| 03  | `controllers`     | Tầng tiếp nhận HTTP. Trích xuất `req.body`, `req.params`, gọi tới Service xử lý, rồi đóng gói trả về `res.json()`. **Tuyệt đối không chứa logic nghiệp vụ hay query SQL tại đây.** |
| 04  | `entities`        | Định nghĩa các models/schemas tương tác trực tiếp với Database. Dùng để mapping cấu trúc các bảng (Tables) / bộ sưu tập (Collections).                                             |
| 05  | `libs`            | Cấu hình và khởi tạo các instance của thư viện bên thứ 3 (MongoDB Client, Prisma, Nodemailer, Cloudinary, Payment Gateways...).                                                    |
| 06  | `middlewares`     | Lớp màng lọc trung gian chặn request. Dùng để: Kiểm tra đăng nhập (JWT Auth), phân quyền truy cập, kiểm tra hợp lệ dữ liệu, hoặc bắt lỗi (Error Handler) tập trung.                |
| 07  | `repositories`    | Tầng truy xuất dữ liệu (Data Access Layer). Tầng duy nhất được phép "nói chuyện" với Database. Chỉ chứa các hàm query (find, insert, update, delete).                              |
| 08  | `routes`          | Nơi khai báo các đường dẫn API (`/api/v1/auth/login`). Làm nhiệm vụ lắp ráp Middleware và Controller tương ứng vào từng endpoint.                                                  |
| 09  | `schemas`         | Chứa các cấu trúc chuẩn dùng **Zod** để xác thực (validate) tính hợp lệ của dữ liệu đầu vào. Đảm bảo dữ liệu bẩn bị chặn ngay trước khi vào Controller.                            |
| 10  | `scripts`         | Các kịch bản chạy độc lập ngoài server chính. Dùng để thao tác tự động: Chạy Migrations (cập nhật bảng DB), Seeding (tạo dữ liệu mẫu ban đầu).                                     |
| 11  | `services`        | Trái tim của Backend. Chứa **100% logic nghiệp vụ**. Nó nhận dữ liệu sạch, thực hiện tính toán, kiểm tra rule nhân sự, và ra lệnh cho Repository lưu vào DB.                       |
| 12  | `types`           | File định nghĩa các Kiểu dữ liệu (`Interface`, `Type`) của TypeScript cho toàn dự án, đảm bảo Code Type-Safe và DTO (Data Transfer Object) chuẩn mực.                              |
| 13  | `utils`           | Chứa các hàm tiện ích thuần túy (Pure functions) độc lập, tái sử dụng cao như: Mã hóa mật khẩu (Bcrypt), tạo JWT, format ngày tháng, xử lý chuỗi.                                  |
