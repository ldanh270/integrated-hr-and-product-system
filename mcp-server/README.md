# HRP MCP Server

> **Một MCP server (Node.js + TypeScript) kết nối AI agent (Claude Desktop, Cursor, Cline, v.v.) với hệ thống HRP backend, phơi bày hơn 70 công cụ để quản lý nhân sự, chấm công, lịch làm, dự án & công việc, bảng lương, đơn từ,…**

---

## 1. HRP là gì? HRP MCP Server là gì?

**HRP (Integrated Human Resource and Product System)** là hệ thống backend nội bộ của công ty công nghệ, quản lý **nhân sự** (HR) **và sản phẩm / dự án** (Product / Project) cho nhiều bộ phận (IT, Marketing, …), cung cấp REST API xử lý nghiệp vụ (xem `swagger.yaml`).

**HRP MCP Server** là cầu nối giữa **AI agent** (MCP client) và **HRP backend**:

- Nhận lệnh gọi tool từ AI agent (qua JSON-RPC).
- Xác thực phiên người dùng (JWT + cookie) bằng cơ chế đăng nhập qua trình duyệt.
- Chuyển tiếp request sang HRP backend (HTTP/REST) với header `Authorization: Bearer <jwt>` + cookie phiên.
- Trả response JSON cho AI agent.

### 1.1. Hai đối tượng độc giả của tài liệu này

- **Con người (developer / reviewer):** Hiểu kiến trúc, cách chạy, cách mở rộng.
- **AI agent (Claude / Cursor / Cline / …):** Biết chính xác tool nào có sẵn, tham số nào bắt buộc, luồng tương tác nào phải tuân theo. **Phần §5 trở đi viết cho AI agent.**

---

## 2. Kiến trúc tổng quan

Luồng chính: **AI Agent ↔ MCP Server ↔ HRP Backend**. Luồng phụ (login): **User (trình duyệt) ↔ MCP Server ↔ HRP Backend**.

```
                        ┌──────────────────────┐
                        │   AI Agent (MCP)     │
                        │  (Claude, Cursor…)   │
                        └──────────┬───────────┘
                                   │  JSON-RPC over SSE / STDIO
                                   │  (gọi tool, nhận kết quả)
                                   ▼
                        ┌──────────────────────┐
                        │   HRP MCP Server     │
                        │  (Node.js + TS)      │
                        │  cổng 3001 mặc định  │
                        └──────────┬───────────┘
                                   │  HTTP/REST qua axios
                                   │  (Bearer JWT + cookies của user)
                                   ▼
                        ┌──────────────────────┐
                        │  HRP Backend (REST)  │
                        │  HRP_API_BASE_URL    │
                        │  mặc định :5000      │
                        └──────────────────────┘

   ─── Nhánh phụ: login qua trình duyệt ────────────────────────────

                        ┌──────────────────────┐
                        │   AI Agent           │
                        │  (đưa URL cho user)  │
                        └──────────┬───────────┘
                                   │  "Hãy mở link này trong trình duyệt"
                                   ▼
                        ┌──────────────────────┐         ┌──────────────────────┐
                        │  Trình duyệt User    │  POST   │   HRP MCP Server     │
                        │  (Chrome, Edge, …)   │ /auth/  │  /auth/login         │
                        │  GET                 │ submit  │  /auth/submit        │
                        │  /auth/login?id=…    │ ──────► │  (form HTML +        │
                        │  (form HTML)         │         │   xử lý credential)  │
                        └──────────────────────┘         └──────────┬───────────┘
                                                                   │  HTTP/REST
                                                                   ▼
                                                        ┌──────────────────────┐
                                                        │  HRP Backend         │
                                                        │  POST /api/auth/     │
                                                        │  login               │
                                                        └──────────────────────┘
```

### 2.1. Bốn thành phần chính của source code

| Thư mục / file            | Vai trò                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| `src/server.ts`           | Entry point: chọn chế độ **SSE** (mặc định) hoặc **STDIO** (có flag `--stdio`). Mount route auth. |
| `src/mcp.ts`              | Khởi tạo `McpServer` (`name: "HRP-MCP-Server"`) và đăng ký 12 nhóm tool. |
| `src/tools/*.tools.ts`    | Đăng ký tool với `mcpServer.tool(...)` (name + description + Zod schema + handler). |
| `src/services/*.service.ts` | Gọi HRP backend bằng axios. Mỗi service ánh xạ 1 nhóm nghiệp vụ. |
| `src/session/`            | Quản lý phiên MCP server-side: `session.manager.ts` (in-memory, TTL 8h), `login-store.ts` (login request 5 phút). |
| `src/auth/`               | `login-page.html` (form đăng nhập đẹp), `login-store.ts` (cầu nối AI ↔ browser). |
| `src/utils/`              | `hrp-client.ts` (2 axios instance: `hrpClient` public, `createAuthedClient(session)` có Bearer + cookies), `logger.ts` (màu ANSI, tự chuyển sang `stderr` ở STDIO mode), `session-guard.ts` (`requireSession` ném `UnauthorizedError`), `tool-response.ts` (`buildSuccess` / `buildError`). |
| `src/constants/hrp-api.constants.ts` | Bảng endpoint URL của HRP backend, là nguồn sự thật duy nhất. |
| `src/schemas/*.schema.ts` | Zod schema cho input/output các service. |
| `src/constants/entities/*.config.ts` | Enum danh sách role, status, tracker, priority, v.v. dùng cho Zod. |

---

## 3. Cài đặt & chạy

### 3.1. Yêu cầu

- **Node.js ≥ 20** (TypeScript 6 / ESM / `NodeNext`).
- **pnpm ≥ 11.8** (xem `devEngines` trong `package.json`).
- HRP backend chạy được ở `HRP_API_BASE_URL` (mặc định `http://localhost:5000`).

### 3.2. Cài & build

```bash
# 1. Cài dependencies
pnpm install

# 2. Tạo file env
cp .env.example .env
# Sửa HRP_API_BASE_URL nếu cần

# 3. Dev mode (auto-reload với tsx watch)
pnpm dev
# → Mặc định khởi động SSE server ở cổng 3001

# 4. Production
pnpm build       # tsc → dist/
pnpm start       # node dist/server.js (SSE mode)
node dist/server.js --stdio   # chạy ở STDIO mode
```

### 3.3. Biến môi trường (`.env`)

| Biến                | Mặc định                   | Ý nghĩa                                                   |
| ------------------- | -------------------------- | --------------------------------------------------------- |
| `PORT`              | `3001`                     | Cổng HTTP của MCP server.                                  |
| `HRP_API_BASE_URL`  | `http://localhost:5000`    | Base URL của HRP backend.                                 |
| `PUBLIC_BASE_URL`   | _(bắt buộc)_               | **Public URL** MCP server dùng để build link đăng nhập gửi cho user. **Bắt buộc** ở cả dev và prod (không có fallback localhost). Phải có scheme (`http://` hoặc `https://`), không trailing slash. VD: `http://localhost:3001` (dev), `https://hrp-mcp.example.com` (prod/nginx), `https://xxx.ngrok-free.dev` (ngrok). |
| `DEBUG`             | `false`                    | Bật log chi tiết (request/response body, v.v.).            |

Không cần cấu hình secret trong `.env` — JWT/cookie được cấp sau khi user đăng nhập qua trình duyệt (xem §4).

### 3.4. Hai chế độ vận chuyển (transport)

| Chế độ   | Cách khởi động                              | Khi nào dùng                                                  |
| -------- | ------------------------------------------- | ------------------------------------------------------------- |
| **SSE**  | `pnpm dev` / `pnpm start` (mặc định)        | Khi AI agent chạy ở máy khác, truy cập qua HTTP. Có endpoint `GET /sse` (stream) + `POST /message` (request). |
| **STDIO**| `node dist/server.js --stdio`               | Khi AI agent chạy local, mở process con trực tiếp. Tất cả log tự động chuyển sang `stderr` để không phá JSON-RPC stream. |

> **Lưu ý SSE mode:** server chỉ giữ **một** SSE transport tại một thời điểm. Nếu client mới kết nối mà transport cũ chưa đóng, server sẽ đóng transport cũ trước rồi mới accept cái mới.

### 3.5. Cấu hình MCP Client (Claude Desktop / Cursor / Cline)

**STDIO mode** (khuyến nghị cho local):

```json
{
  "mcpServers": {
    "hrp": {
      "command": "node",
      "args": ["/đường/dẫn/tuyệt/đối/tới/hrp-mcp-server/dist/server.js", "--stdio"],
      "env": {
        "HRP_API_BASE_URL": "http://localhost:5000"
      }
    }
  }
}
```

**SSE mode** (khi server chạy remote / Docker):

```json
{
  "mcpServers": {
    "hrp": {
      "url": "http://localhost:3001/mcp/sse",
      "transport": "sse"
    }
  }
}
```

> **Path prefix `/mcp`:** Tất cả HTTP endpoint của server được mount dưới prefix `/mcp` (cho cả SSE và STDIO mode). Endpoint đầy đủ:
> - `GET  /mcp/sse`
> - `POST /mcp/message`
> - `GET  /mcp/auth/login`
> - `POST /mcp/auth/submit`
>
> `PUBLIC_BASE_URL` phải khớp với prefix này (vd `https://x.ngrok-free.dev/mcp` → SSE URL tương ứng `https://x.ngrok-free.dev/mcp/sse`).

---

## 4. Luồng đăng nhập (BẮT BUỘC đọc — dành cho cả người và AI)

Hệ thống HRP backend trả JWT **+ Set-Cookie**. MCP server giữ chúng trong một **sessionId** nội bộ (in-memory, TTL 8h). Mọi tool (trừ `login_*`) đều yêu cầu `sessionId` hợp lệ.

**Không bao giờ** yêu cầu user nhập mật khẩu trong cửa sổ chat. MCP server cung cấp một **trang đăng nhập HTML** chạy trong trình duyệt của user.

### 4.1. Sơ đồ luồng

```
AI Agent                          MCP Server                        Browser (User)              HRP Backend
   │                                  │                                  │                          │
   │ 1. login_start()                 │                                  │                          │
   ├─────────────────────────────────►│                                  │                          │
   │   (no params)                    │                                  │                          │
   │                                  │ loginStore.create() → loginId    │                          │
   │ ◄─────────────────────────────────┤                                  │                          │
   │   { loginUrl: "http://...?id=X", │                                  │                          │
   │     loginId: "X",                │                                  │                          │
   │     instruction: "Present URL &  │                                  │                          │
   │      poll login_status" }        │                                  │                          │
   │                                  │                                  │                          │
   │ 2. Hiển thị loginUrl cho user    │                                  │                          │
   │   "Hãy mở link này trong trình   │                                  │                          │
   │    duyệt để đăng nhập."          │                                  │                          │
   │                                  │                                  │                          │
   │                                  │  3. GET /auth/login?id=X         │                          │
   │                                  │ ◄────────────────────────────────┤                          │
   │                                  │   → trả HTML form login          │                          │
   │                                  │                                  │  user nhập               │
   │                                  │                                  │  username + password     │
   │                                  │                                  │                          │
   │                                  │  4. POST /auth/submit            │                          │
   │                                  │ ◄────────────────────────────────┤                          │
   │                                  │   { loginId, username, password }│                          │
   │                                  │ ──────────────────────────────────────────────────────►     │
   │                                  │   POST /api/auth/login                                       │
   │                                  │ ◄──────────────────────────────────────────────────────      │
   │                                  │   { data: { token, employee }, set-cookie }                 │
   │                                  │                                  │                          │
   │                                  │   sessionManager.create({       │                          │
   │                                  │     jwt, role, employeeId,       │                          │
   │                                  │     cookies                     │                          │
   │                                  │   }) → sessionId                │                          │
   │                                  │                                  │                          │
   │                                  │   loginStore.setCompleted(      │                          │
   │                                  │     loginId, sessionId)         │                          │
   │                                  │                                  │                          │
   │                                  │  5. HTTP 200 + success screen    │                          │
   │                                  ├─────────────────────────────────►│                          │
   │                                  │                                  │  "Login successful!"     │
   │                                  │                                  │                          │
   │ 6. login_status(loginId)         │                                  │                          │
   ├─────────────────────────────────►│                                  │                          │
   │                                  │ loginStore.get(loginId)         │                          │
   │ ◄─────────────────────────────────┤   → status="completed",         │                          │
   │   { status: "completed",         │     sessionId: "session-..."     │                          │
   │     sessionId: "session-...",    │                                  │                          │
   │     instruction: "Pass this      │                                  │                          │
   │      sessionId to all tools" }    │                                  │                          │
   │                                  │                                  │                          │
   │ 7. Từ giờ truyền sessionId       │                                  │                          │
   │    vào MỌI tool khác.            │                                  │                          │
```

### 4.2. Thời hạn

- `loginId`: **5 phút** (TTL). Sau 5 phút user chưa đăng nhập → phải gọi `login_start` lại.
- `sessionId`: **8 giờ** (TTL mặc định, khớp refresh token HRP). Hết hạn → gọi `login_start` lại.

### 4.3. Sai lầm thường gặp

- ❌ Nhầm `loginId` với `sessionId` → server sẽ trả lỗi `Invalid or expired session`.
- ❌ Gọi tool bất kỳ mà **không có** `sessionId` → server trả `UnauthorizedError`.
- ❌ Hỏi user nhập password trong chat → **không làm vậy**. Luôn dùng `login_start` + URL.

---

## 5. Bảng tham chiếu Tool (DÀNH CHO AI AGENT)

> **Đọc kỹ mục này trước khi gọi bất kỳ tool nào.**
>
> - **Mọi tool (trừ `login_start`)** yêu cầu tham số `sessionId: string`. Nếu chưa có → gọi `login_start` trước.
> - **Mọi response** trả về dạng `MCP content block`:
>   - Thành công: `{ content: [{ type: "text", text: "<JSON string hoặc text>" }], isError: false }`.
>   - Lỗi: `{ content: [{ type: "text", text: "{\"error\":\"<msg>\",\"details\":<...>}" }], isError: true }`.
> - **Giờ ngày tháng** dùng ISO 8601: `YYYY-MM-DDTHH:mm:ssZ` (UTC). Ngày đơn dùng `YYYY-MM-DD`.
> - **Tọa độ GPS** (cho chấm công): `lat` ∈ `[-90, 90]`, `lng` ∈ `[-180, 180]`.

Tổng cộng **72 tool** trong **12 nhóm**:

| Nhóm         | Prefix                 | Số tool | Mô tả                                                         |
| ------------ | ---------------------- | ------- | ------------------------------------------------------------- |
| Auth         | `login_*`, `logout`    | 3       | Đăng nhập/đăng xuất, kiểm tra trạng thái.                     |
| Profile      | `profile_*`            | 3       | Thông tin cá nhân, đổi mật khẩu.                              |
| Employee     | `employee_*`           | 7       | Quản lý nhân viên (Admin/HR/GM).                              |
| Attendance   | `attendance_*`         | 4       | Check-in/out, scan thông minh, lịch sử chấm công.            |
| Shift        | `shift_*`              | 5       | CRUD ca làm việc (Admin/HR).                                  |
| Schedule     | `schedule_*`           | 10      | Phân ca, override, sinh lịch tự động, cài đặt.                |
| Weekly Template | `weekly_template_*` | 6       | Mẫu lịch tuần.                                                |
| Holiday      | `holiday_*`            | 6       | Quản lý ngày lễ.                                              |
| Shift Change | `shift_change_*`       | 4       | Yêu cầu đổi ca, duyệt/từ chối.                               |
| Application  | `application_*`        | 10      | Đơn từ: nghỉ phép, OT, WFH, đổi ca, đi muộn/về sớm.         |
| Project      | `project_*`            | 8       | Dự án + thành viên.                                            |
| Task         | `task_*`               | 5       | Công việc trong dự án.                                        |
| Category     | `category_*`           | 4       | Nhãn/tag task trong dự án.                                    |
| Spent Time   | `spent_time_*`         | 5       | Ghi nhận giờ làm việc.                                        |
| Payroll      | `salary_*`, `payslip_*`, `payroll_*` | 21 | Thành phần lương, biến lương, mẫu phiếu lương, bảng lương.    |

### 5.1. Auth (3 tool)

#### `login_start`
- **Mô tả:** Khởi tạo phiên đăng nhập qua trình duyệt. Trả về URL user cần mở.
- **Tham số:** _không có._
- **Trả về:**
  ```json
  {
    "message": "Login process started. Please ask the user to open the following URL in their browser to log in. Do NOT ask for their password.",
    "loginUrl": "http://localhost:3001/auth/login?id=login-<uuid>",
    "loginId": "login-<uuid>",
    "instruction": "CRITICAL: Present the loginUrl to the user. Then, periodically call the 'login_status' tool with loginId='login-<uuid>' to check if they have completed the login."
  }
  ```
- **Agent phải làm:**
  1. Hiển thị `loginUrl` cho user, **không** hỏi mật khẩu trong chat.
  2. Sau ~3–5 giây, gọi `login_status` với `loginId` để kiểm tra.
  3. Lặp lại cho đến khi `status === "completed"` (lấy `sessionId`) hoặc `status === "failed"`.
  4. Lưu `sessionId`, dùng cho mọi tool sau.

#### `login_status`
- **Tham số:**
  - `loginId: string` — ID từ `login_start`.
- **Trả về (3 trạng thái):**
  - `pending`: `{"status": "pending", "message": "User has not completed login yet. Please wait and check again in a few seconds."}`
  - `completed`: `{"status": "completed", "message": "Login successful!", "sessionId": "session-<uuid>", "instruction": "CRITICAL: Keep this sessionId and pass it as an argument to all other tools."}`
  - `failed`: Trả lỗi với message lỗi.
- **Nếu loginId không tồn tại / hết hạn (5 phút):** Lỗi → phải gọi `login_start` lại.

#### `logout`
- **Tham số:** `sessionId: string`.
- **Hành vi:** Gọi HRP backend logout, sau đó xóa session khỏi sessionManager.

---

### 5.2. Profile (3 tool)

| Tool                  | Mô tả                                       | Tham số bắt buộc                | Tham số tuỳ chọn |
| --------------------- | ------------------------------------------- | ------------------------------- | ---------------- |
| `profile_get_me`      | Lấy profile người đang đăng nhập.            | `sessionId`                     | —                |
| `profile_update_me`   | Cập nhật profile.                           | `sessionId`                     | `firstName`, `lastName`, `phone`, `address`, `bankName`, `bankAccountNumber`, `taxNumber`, `emergencyContactName`, `emergencyContactPhone` |
| `profile_change_password` | Đổi mật khẩu.                          | `sessionId`, `newPassword` (≥6) | `currentPassword` |

---

### 5.3. Employee (7 tool) — *thường cần role Admin/HR/GM*

| Tool                          | Mô tả                                              | Tham số bắt buộc | Tham số tuỳ chọn |
| ----------------------------- | -------------------------------------------------- | ---------------- | ---------------- |
| `employee_list`               | Danh sách nhân viên (lọc theo search/role/status). | `sessionId`      | `page`, `pageSize`, `search`, `role`, `status` ∈ {`active`, `inactive`, `on_leave`, `terminated`} |
| `employee_list_approvers`     | Danh sách người có quyền duyệt đơn (Team Leader, HR Manager, Admin, GM). | `sessionId` | — |
| `employee_get`                | Chi tiết 1 nhân viên.                              | `sessionId`, `employeeId` | — |
| `employee_create`             | Tạo nhân viên mới. *(Admin/HR/GM)*                 | `sessionId`, `email`, `firstName`, `lastName`, `role` | `joinDate` (ISO 8601) |
| `employee_update`             | Cập nhật. *(Admin/HR/GM)*                          | `sessionId`, `employeeId`      | `firstName`, `lastName`, `role` |
| `employee_update_status`      | Đổi trạng thái. *(Admin/HR/GM)*                    | `sessionId`, `employeeId`, `status` | `reason` |
| `employee_delete`             | Xoá nhân viên. *(Admin/HR/GM)*                     | `sessionId`, `employeeId`      | — |

**Role hợp lệ** (xem `src/constants/entities/employee.config.ts`): `admin`, `hr_manager`, `general_manager`, `team_leader`, `employee`.

---

### 5.4. Attendance (4 tool) — *Chấm công*

| Tool                       | Mô tả                                                  | Tham số bắt buộc                              | Tham số tuỳ chọn |
| -------------------------- | ------------------------------------------------------ | --------------------------------------------- | ---------------- |
| `attendance_check_in`      | Check-in.                                              | `sessionId`, `lat`, `lng`                     | —                |
| `attendance_check_out`     | Check-out.                                             | `sessionId`, `lat`, `lng`                     | —                |
| `attendance_scan`          | Smart scan: tự check-in nếu chưa có, check-out nếu đã check-in. Trả 409 nếu cả hai đã ghi. | `sessionId`, `lat`, `lng` | — |
| `attendance_get_history`   | Lịch sử chấm công. Employee thường chỉ thấy của mình; Admin/HR/GM có thể lọc theo `employeeId`. | `sessionId` | `startDate`, `endDate` (ISO 8601), `employeeId`, `status` ∈ {`on_time`, `late`, `early_leave`, `absent`, `overtime`} |

> **Agent tip:** Khi user nói "chấm công giúp tôi" mà không nói rõ check-in/out → dùng `attendance_scan`.

---

### 5.5. Shift (5 tool) — *Admin/HR*

| Tool            | Mô tả                  | Tham số bắt buộc                                                  | Tham số tuỳ chọn |
| --------------- | ---------------------- | ----------------------------------------------------------------- | ---------------- |
| `shift_list`    | Danh sách ca.          | `sessionId`                                                       | —                |
| `shift_get`     | Chi tiết 1 ca.         | `sessionId`, `shiftId`                                            | —                |
| `shift_create`  | Tạo ca mới.            | `sessionId`, `name`, `startTime` (HH:mm), `endTime` (HH:mm)       | `color` (hex), `isActive` |
| `shift_update`  | Cập nhật ca.           | `sessionId`, `shiftId`                                            | `name`, `startTime`, `endTime`, `color`, `isActive` |
| `shift_delete`  | Xoá ca.                | `sessionId`, `shiftId`                                            | —                |

---

### 5.6. Schedule (10 tool) — *Phân ca / Override / Auto-generate*

| Tool                          | Mô tả                                              | Tham số bắt buộc | Tham số tuỳ chọn |
| ----------------------------- | -------------------------------------------------- | ---------------- | ---------------- |
| `schedule_get_mine`           | Lịch ca hiện tại của tôi.                          | `sessionId`      | —                |
| `schedule_list_mine`          | Tất cả lịch sử + tương lai của tôi.                | `sessionId`      | —                |
| `schedule_get_employee`       | Lịch ca hiện tại của 1 nhân viên. *(Admin/HR/GM)*  | `sessionId`, `employeeId` | — |
| `schedule_list_employee`      | Tất cả lịch của 1 nhân viên.                       | `sessionId`, `employeeId` | — |
| `schedule_assign`             | Gán ca cho nhiều nhân viên trong khoảng ngày.       | `sessionId`, `employeeIds[]`, `shiftId`, `startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD) | — |
| `schedule_override`           | Override ca 1 ngày cho 1 nhân viên.                 | `sessionId`, `employeeId`, `date` (YYYY-MM-DD), `shiftId` | `note` |
| `schedule_generate_preview`   | Xem trước lịch sẽ sinh theo weekly template.        | `sessionId`, `startDate`, `endDate` | — |
| `schedule_generate`           | Sinh lịch thật sự cho tất cả nhân viên.             | `sessionId`, `startDate`, `endDate` | — |
| `schedule_get_settings`       | Lấy cài đặt auto-generate.                         | `sessionId`      | —                |
| `schedule_update_settings`    | Cập nhật cài đặt auto-generate.                    | `sessionId`, `triggerDayOfWeek` (0=Sun..6=Sat) | `triggerHour` (0-23), `triggerMinute` (0-59) |

---

### 5.7. Weekly Template (6 tool) — *Mẫu lịch tuần (Admin/HR)*

| Tool                       | Mô tả                                       | Tham số bắt buộc | Tham số tuỳ chọn |
| -------------------------- | ------------------------------------------- | ---------------- | ---------------- |
| `weekly_template_list`     | Danh sách mẫu.                             | `sessionId`      | —                |
| `weekly_template_get`      | Chi tiết 1 mẫu.                            | `sessionId`, `templateId` | — |
| `weekly_template_create`   | Tạo mẫu.                                   | `sessionId`, `name`, `shifts[]` (mảng `{dayOfWeek: 0-6, shiftId}`) | `description`, `isDefault` |
| `weekly_template_update`   | Cập nhật mẫu.                              | `sessionId`, `templateId` | `name`, `description`, `isDefault`, `shifts[]` |
| `weekly_template_delete`   | Xoá mẫu.                                   | `sessionId`, `templateId` | — |
| `weekly_template_apply`    | Áp mẫu cho nhiều nhân viên.                | `sessionId`, `templateId`, `employeeIds[]` | — |

---

### 5.8. Holiday (6 tool) — *Ngày lễ (Admin/HR)*

| Tool               | Mô tả                                  | Tham số bắt buộc | Tham số tuỳ chọn |
| ------------------ | -------------------------------------- | ---------------- | ---------------- |
| `holiday_list`     | Danh sách ngày lễ.                    | `sessionId`      | —                |
| `holiday_get`      | Chi tiết 1 ngày lễ.                   | `sessionId`, `holidayId` | — |
| `holiday_check`    | Kiểm tra 1 ngày có phải lễ không.     | `sessionId`, `date` (YYYY-MM-DD) | — |
| `holiday_create`   | Tạo ngày lễ.                          | `sessionId`, `name`, `startDate` (ISO 8601), `endDate` (ISO 8601), `type` ∈ {`public`, `company`, `other`} | `description`, `isActive` |
| `holiday_update`   | Cập nhật.                             | `sessionId`, `holidayId` | `name`, `startDate`, `endDate`, `type`, `description`, `isActive` |
| `holiday_delete`   | Xoá.                                  | `sessionId`, `holidayId` | — |

---

### 5.9. Shift Change Request (4 tool) — *Đổi ca*

| Tool                          | Mô tả                                | Tham số bắt buộc | Tham số tuỳ chọn |
| ----------------------------- | ------------------------------------ | ---------------- | ---------------- |
| `shift_change_list_mine`      | Danh sách yêu cầu đổi ca của tôi.   | `sessionId`      | —                |
| `shift_change_submit`         | Tạo yêu cầu.                       | `sessionId`, `date` (ISO 8601), `employeeShiftId` | `workingShiftId`, `swapWithEmployeeId`, `swapWithShiftId`, `reason`, `note`, `assignedToId` |
| `shift_change_approve`        | Duyệt. *(Approver)*                  | `sessionId`, `requestId` | — |
| `shift_change_reject`         | Từ chối. *(Approver)*                | `sessionId`, `requestId` | — |

---

### 5.10. Application (10 tool) — *Đơn từ*

#### Tạo đơn (5 tool, mỗi loại 1 tool)

| Tool                          | Mô tả                                  | Tham số bắt buộc | Tham số tuỳ chọn |
| ----------------------------- | -------------------------------------- | ---------------- | ---------------- |
| `application_create_leave`    | Đơn nghỉ phép.                       | `sessionId`, `startDate`, `endDate` (ISO 8601), `leaveType` ∈ {`annual_leave`, `sick_leave`, `maternity_leave`, `bereavement_leave`, `marriage_leave`, `unpaid_leave`, `other`}, `regimeType` ∈ {`paid`, `unpaid`} | `reason` (5-500), `note` (≤1000), `assignedToId` |
| `application_create_overtime` | Đơn làm thêm giờ (OT).                | `sessionId`, `startDate`, `employeeShiftId` | `reason`, `note`, `assignedToId` |
| `application_create_wfh`      | Đơn làm việc tại nhà.                | `sessionId`, `startDate` | `location`, `reason`, `note`, `assignedToId` |
| `application_create_shift_swap` | Đơn đổi ca.                         | `sessionId`, `startDate`, `employeeShiftId` | `workingShiftId`, `swapWithEmployeeId`, `swapWithShiftId`, `reason`, `note`, `assignedToId` |
| `application_create_late_early` | Đơn đi muộn / về sớm.             | `sessionId`, `startDate`, `employeeShiftId`, `durationMinutes` (1-480), `isLate` (boolean) | `reason`, `note`, `assignedToId` |

#### Quản lý đơn (5 tool)

| Tool                              | Mô tả                                          | Tham số bắt buộc | Tham số tuỳ chọn |
| --------------------------------- | ---------------------------------------------- | ---------------- | ---------------- |
| `application_get_mine`            | Danh sách đơn của tôi.                         | `sessionId`      | `page`, `pageSize`, `type` ∈ {`leave`,`overtime`,`work_from_home`,`shift_swap`,`late_early`,`resignation`}, `status` ∈ {`pending`,`approved`,`rejected`,`cancelled`}, `startDate`, `endDate` |
| `application_get`                 | Chi tiết 1 đơn.                                | `sessionId`, `applicationId` | — |
| `application_cancel`              | Hủy đơn đang `pending` của tôi.                | `sessionId`, `applicationId` | `reason` |
| `application_list_all`            | Tất cả đơn công ty. *(Admin/HR/GM/Team Leader)* | `sessionId`     | `page`, `pageSize`, `type`, `status`, `employeeId`, `startDate`, `endDate` |
| `application_list_by_employee`    | Đơn của 1 nhân viên. *(Admin/HR/GM/Team Leader)* | `sessionId`, `employeeId` | `page`, `pageSize`, `type`, `status`, `startDate`, `endDate` |
| `application_approve`             | Duyệt đơn. *(Approver)*                       | `sessionId`, `applicationId` | — |
| `application_reject`              | Từ chối. *(Approver)*                         | `sessionId`, `applicationId`, `rejectReason` (5-500) | — |

> **Lưu ý:** Có 1 chỗ trong type list cho tool tạo đơn có `resignation` (theo enum `APPLICATION_TYPES`) nhưng chưa có tool tạo riêng cho resignation; nếu user cần tạo đơn thôi việc, dùng `application_get_mine` để kiểm tra API HRP có hỗ trợ hay gọi tới HRP team.

---

### 5.11. Project + Task + Category + Spent Time (22 tool)

#### Project (8 tool) — *Dự án*

| Tool                       | Mô tả                                  | Tham số bắt buộc | Tham số tuỳ chọn |
| -------------------------- | -------------------------------------- | ---------------- | ---------------- |
| `project_list`             | Danh sách dự án. Admin/GM thấy tất cả; khác thấy của mình. | `sessionId` | `page`, `limit`, `search`, `status` ∈ {`planning`,`active`,`on_hold`,`completed`,`cancelled`}, `sortBy`, `sortOrder` ∈ {`asc`,`desc`} |
| `project_get`              | Chi tiết 1 dự án.                      | `sessionId`, `projectId` | — |
| `project_create`           | Tạo dự án. *(Admin/GM)*                | `sessionId`, `name` (2-100), `techStack` (chuỗi CSV, vd "React, Node.js") | `description` (≤500), `status`, `taskCreationPolicy` ∈ {`leader_only`,`all_members`}, `startDate`, `expectedEndDate`, `teamLeaderId` |
| `project_update`           | Cập nhật. *(Admin/GM/Team Leader)*      | `sessionId`, `projectId` | `name`, `techStack`, `description`, `status`, `taskCreationPolicy`, `startDate`, `expectedEndDate`, `actualEndDate`, `teamLeaderId` |
| `project_delete`           | Xoá. *(Admin/GM)*                      | `sessionId`, `projectId` | — |
| `project_get_members`      | Danh sách thành viên.                  | `sessionId`, `projectId` | — |
| `project_add_member`       | Thêm thành viên. *(Admin/GM/Team Leader)* | `sessionId`, `projectId`, `employeeId` | — |
| `project_remove_member`    | Bỏ thành viên.                         | `sessionId`, `projectId`, `employeeId` | — |

> **`techStack` là chuỗi CSV** (vd `"React, Node.js, Postgres"`); server tự split thành mảng trước khi gửi HRP.

#### Task (5 tool) — *Công việc*

| Tool           | Mô tả                                   | Tham số bắt buộc | Tham số tuỳ chọn |
| -------------- | --------------------------------------- | ---------------- | ---------------- |
| `task_list`    | Danh sách task (lọc, phân trang, sắp xếp). | `sessionId`      | `projectId`, `page`, `limit`, `search`, `tracker` ∈ {`feature`,`bug`,`support`,`task`,`meeting`,`test`,`subtask`,`management`}, `status` ∈ {`todo`,`in_progress`,`in_review`,`done`,`cancelled`,`reopened`}, `priority` ∈ {`low`,`medium`,`high`,`urgent`}, `assigneeId`, `createdById`, `sortBy`, `sortOrder` |
| `task_get`     | Chi tiết 1 task.                        | `sessionId`, `taskId` | — |
| `task_create`  | Tạo task.                               | `sessionId`, `projectId`, `title` (2-150) | `description` (≤1000), `tracker`, `priority`, `status`, `assigneeId`, `startDate`, `dueDate`, `estimatedTime` (giờ), `progress` (0-100), `categoryId` |
| `task_update`  | Cập nhật task.                          | `sessionId`, `taskId` | `title`, `description`, `tracker`, `priority`, `status`, `assigneeId`, `startDate`, `dueDate`, `completedAt`, `estimatedTime`, `progress`, `categoryId` |
| `task_delete`  | Xoá task.                               | `sessionId`, `taskId` | — |

#### Category (4 tool) — *Nhãn task trong dự án*

| Tool               | Mô tả                       | Tham số bắt buộc | Tham số tuỳ chọn |
| ------------------ | --------------------------- | ---------------- | ---------------- |
| `category_list`    | Danh sách nhãn trong dự án. | `sessionId`, `projectId` | — |
| `category_create`  | Tạo nhãn.                  | `sessionId`, `projectId`, `name` (1-50) | — |
| `category_update`  | Đổi tên nhãn.              | `sessionId`, `projectId`, `categoryId`, `name` (1-50) | — |
| `category_delete`  | Xoá nhãn.                  | `sessionId`, `projectId`, `categoryId` | — |

#### Spent Time (5 tool) — *Ghi nhận giờ làm*

| Tool                 | Mô tả                                  | Tham số bắt buộc | Tham số tuỳ chọn |
| -------------------- | -------------------------------------- | ---------------- | ---------------- |
| `spent_time_list`    | Lịch sử log giờ.                       | `sessionId`      | `taskId`, `employeeId`, `projectId`, `startDate`, `endDate` (ISO 8601) |
| `spent_time_get`     | Chi tiết 1 log.                        | `sessionId`, `spentTimeId` | — |
| `spent_time_log`     | Ghi log giờ.                          | `sessionId`, `taskId`, `date` (ISO 8601), `hours` (0.01-24), `activity` ∈ {`develop`,`design`,`test`,`manage`,`other`} | `employeeId` (mặc định là user hiện tại), `comment` (≤255), `workTimeType` ∈ {`working_day`,`overtime`} |
| `spent_time_update`  | Cập nhật log.                         | `sessionId`, `spentTimeId` | `date`, `hours`, `activity`, `comment`, `workTimeType` |
| `spent_time_delete`  | Xoá log.                              | `sessionId`, `spentTimeId` | — |

---

### 5.12. Payroll (21 tool)

#### Salary Component (5 tool) — *Thành phần lương (Admin/HR)*

| Tool                                  | Mô tả                          | Tham số bắt buộc | Tham số tuỳ chọn |
| ------------------------------------- | ------------------------------ | ---------------- | ---------------- |
| `salary_component_list`               | Danh sách.                    | `sessionId`      | —                |
| `salary_component_create`             | Tạo mới.                     | `sessionId`, `name`, `type` ∈ {`addition`,`deduction`}, `valueType` ∈ {`currency`,`number`,`percentage`}, `formula` | `description` |
| `salary_component_update`             | Cập nhật.                    | `sessionId`, `componentId` | `name`, `type`, `valueType`, `formula`, `description` |
| `salary_component_delete`             | Xoá.                          | `sessionId`, `componentId` | — |
| `salary_component_validate_formula`   | Kiểm tra công thức có hợp lệ. | `sessionId`, `formula` | — |

**Biến có thể dùng trong `formula`** (xem `src/constants/entities/payroll.config.ts`): `baseSalary`, `mealAllowance`, `transportAllowance`, `housingAllowance`, `phoneAllowance`, `responsibilityAllowance`, `seniorityAllowance`, `standardDays`, `workingDays`, `absentDays`, `overtimeMinutes`, `lateMinutes`, `holidayDays`.

#### Salary Variable (4 tool) — *Biến lương (Admin/HR)*

| Tool                          | Mô tả                  | Tham số bắt buộc | Tham số tuỳ chọn |
| ----------------------------- | ---------------------- | ---------------- | ---------------- |
| `salary_variable_list`        | Danh sách biến.        | `sessionId`      | —                |
| `salary_variable_get`         | Chi tiết biến.        | `sessionId`, `variableId` | — |
| `salary_variable_create`      | Tạo biến.            | `sessionId`, `code`, `name`, `value` (number) | `description` |
| `salary_variable_update`      | Cập nhật biến.       | `sessionId`, `variableId` | `code`, `name`, `value`, `description` |

#### Payslip Template (4 tool) — *Mẫu phiếu lương (Admin/HR)*

| Tool                          | Mô tả                                | Tham số bắt buộc | Tham số tuỳ chọn |
| ----------------------------- | ------------------------------------ | ---------------- | ---------------- |
| `payslip_template_list`       | Danh sách mẫu.                      | `sessionId`      | —                |
| `payslip_template_create`     | Tạo mẫu. `componentIds` là **chuỗi CSV** (vd `"id1,id2,id3"`); server tự split. | `sessionId`, `name`, `componentIds` (CSV string) | `description` |
| `payslip_template_update`     | Cập nhật mẫu.                       | `sessionId`, `templateId` | `name`, `componentIds` (CSV), `description` |
| `payslip_template_delete`     | Xoá mẫu.                            | `sessionId`, `templateId` | — |

#### Employee Salary Config (3 tool) — *Cấu hình lương nhân viên (Admin/HR)*

| Tool                            | Mô tả                                  | Tham số bắt buộc | Tham số tuỳ chọn |
| ------------------------------- | -------------------------------------- | ---------------- | ---------------- |
| `salary_config_get`             | Lấy cấu hình hiện tại.               | `sessionId`, `employeeId` | — |
| `salary_config_get_history`     | Lịch sử cấu hình.                    | `sessionId`, `employeeId` | — |
| `salary_config_set`             | Đặt cấu hình mới (sẽ tạo version mới trong history). | `sessionId`, `employeeId`, `templateId`, `baseSalary` (số dương), `effectiveFrom` (ISO 8601) | `effectiveTo` (ISO 8601), `note` |

#### Payroll & Payslip (8 tool)

| Tool                              | Mô tả                                                  | Tham số bắt buộc | Tham số tuỳ chọn |
| --------------------------------- | ------------------------------------------------------ | ---------------- | ---------------- |
| `payroll_get_settings`            | Cài đặt auto-generate bảng lương. *(Admin/HR)*         | `sessionId`      | —                |
| `payroll_update_settings`         | Cập nhật cài đặt.                                     | `sessionId`, `triggerDay` (1-31), `triggerHour` (0-23), `triggerMinute` (0-59) | — |
| `payroll_generate`                | Trigger sinh bảng lương tay. *(Admin/HR)*              | `sessionId`, `periodMonth` (1-12), `periodYear`, `name` | — |
| `payroll_list`                    | Danh sách bảng lương đã sinh. *(Admin/HR/GM)*          | `sessionId`      | —                |
| `payroll_get`                     | Chi tiết 1 bảng lương (kèm tất cả payslip).            | `sessionId`, `payrollId` | — |
| `payroll_approve`                 | Duyệt bảng lương. *(Admin/GM)*                        | `sessionId`, `payrollId` | — |
| `payroll_reject`                  | Từ chối bảng lương. *(Admin/GM)*                      | `sessionId`, `payrollId`, `rejectReason` (≥1 ký tự) | — |
| `payroll_get_payslip`             | Lấy 1 payslip cụ thể. *(Admin/HR/GM)*                  | `sessionId`, `payrollId`, `employeeId` | — |
| `payroll_get_employee_payslips`   | Tất cả payslip của 1 nhân viên (mọi kỳ). *(Admin/HR)* | `sessionId`, `employeeId` | — |
| `payroll_get_my_payslips`         | Payslip của **chính user đang đăng nhập**.             | `sessionId`      | —                |

---

## 6. Hướng dẫn tương tác cho AI Agent (Playbook)

### 6.1. Quy tắc bắt buộc

1. **Không bao giờ hỏi password trong chat.** Luôn dùng `login_start` → trình duyệt.
2. **Cache `sessionId`** trong suốt cuộc hội thoại. Truyền vào **mọi** tool khác. Nếu `sessionId` bị từ chối → gọi lại `login_start`.
3. **Đọc response kỹ.** Mọi response thành công đều có `content[0].text` chứa JSON.stringify. Hãy parse và dùng `data` cho bước tiếp theo.
4. **Poll `login_status`** với delay 3-5 giây, **không spam** liên tục.
5. **Tôn trọng role-restriction.** Một số tool chỉ dành cho Admin/HR/GM/Team Leader; nếu user là employee bình thường mà gọi → HRP sẽ trả 403.
6. **Date format:**
   - Ngày đơn → `YYYY-MM-DD` (vd `2026-06-21`).
   - Ngày giờ → ISO 8601 UTC (vd `2026-06-21T08:00:00Z`).
7. **Khi lỗi `UnauthorizedError`** → session hết hạn. Gọi lại `login_start` ngay.

### 6.2. Ví dụ end-to-end

> **User:** "Giúp tôi check-in hôm nay."
>
> **Agent:**
> 1. Kiểm tra: đã có `sessionId` chưa? _Chưa._
> 2. Gọi `login_start` → nhận `loginUrl`.
> 3. Trả lời user: "Hãy mở [link] trong trình duyệt để đăng nhập, rồi cho tôi biết khi xong."
> 4. Sau vài giây, gọi `login_status(loginId)`. Lặp lại nếu `pending`.
> 5. Khi `completed` → lưu `sessionId`.
> 6. Hỏi user: "Bạn đang ở đâu? Cho tôi vĩ độ/kinh độ hiện tại." (Hoặc giải thích rằng tool cần GPS.)
> 7. Gọi `attendance_scan(sessionId, lat, lng)` → trả kết quả.
> 8. Tóm tắt: "Đã check-in lúc …, mã ca …."

### 6.3. Mẹo xử lý lỗi

| Lỗi trả về                                        | Nguyên nhân / Cách xử lý                                              |
| -------------------------------------------------- | ---------------------------------------------------------------------- |
| `Invalid or expired session...`                    | Session hết hạn (sau 8h) hoặc truyền nhầm `loginId`. Gọi lại `login_start`. |
| `Login request not found or expired`               | `loginId` hết hạn (5 phút). Gọi lại `login_start`.                     |
| `User failed to login` (trong `login_status`)      | User nhập sai tài khoản. Bảo user đăng nhập lại (sẽ tạo `loginId` mới). |
| HRP backend trả 4xx/5xx                            | Server chuyển tiếp nguyên message lỗi. Hiển thị cho user.               |
| Zod validation fail (param sai)                    | MCP client sẽ báo lỗi schema. Sửa lại param theo §5.                  |

---

## 7. Phát triển & đóng góp

### 7.1. Scripts có sẵn

| Lệnh                                  | Mô tả                                       |
| ------------------------------------- | ------------------------------------------- |
| `pnpm dev`                            | Chạy với `tsx watch`, auto-reload khi sửa. |
| `pnpm build`                          | `tsc` → `dist/`.                            |
| `pnpm start`                          | Chạy `dist/server.js` (SSE mode).           |
| `node dist/server.js --stdio`         | Chạy ở STDIO mode.                          |

### 7.2. Cách thêm 1 tool mới (step-by-step)

Ví dụ: thêm tool `my_new_tool`.

1. **Thêm endpoint HRP** (nếu chưa có) vào `src/constants/hrp-api.constants.ts`.
2. **Tạo method service** trong file service tương ứng (`src/services/*.service.ts`):
   ```ts
   public async myMethod(session: SessionData, payload: MyInput): Promise<MyOutput> {
     const client = createAuthedClient(session);
     const res = await client.post<MyOutput>(HRP_API_CONSTANTS.ENDPOINTS.X.MY, payload);
     return res.data;
   }
   ```
3. **Đăng ký tool** trong file `src/tools/*.tools.ts` tương ứng:
   ```ts
   mcpServer.tool(
     "my_new_tool",
     "Human-readable description for the agent.",
     {
       sessionId: z.string().describe("Active session ID"),
       // ... các tham số khác với Zod schema
     },
     async ({ sessionId, ...payload }) => {
       try {
         const session = requireSession(sessionId);
         const data = await someService.myMethod(session, payload);
         return buildSuccess(data);
       } catch (error: any) {
         return buildError("Friendly message", error.message);
       }
     },
   );
   ```
4. Nếu là **nhóm mới** → thêm hàm `registerMyGroupTools()` trong `src/mcp.ts` và gọi trong `registerTools()`.
5. Chạy `pnpm dev` để test, cập nhật README mục §5.

### 7.3. Nguyên tắc code style

- TypeScript strict mode. ESM (`"type": "module"`).
- Dùng **Zod** cho mọi input → tool tự động có schema cho AI agent.
- Dùng `requireSession(sessionId)` ở **mọi tool** (trừ `login_*`).
- Dùng `buildSuccess(data)` / `buildError(msg, details)` thay vì `return { content: ... }` thủ công.
- Không gọi HRP trực tiếp từ tool — luôn qua service.

---

## 8. Ghi chú bảo mật

- **Session và loginId lưu in-memory** → nếu restart MCP server thì tất cả session mất, user phải đăng nhập lại. Đây là chủ đích cho môi trường dev.
- **JWT/cookie không bao giờ log ra ngoài** (logger chỉ log status code, không log body response ở `authed` client — xem `src/utils/hrp-client.ts`).
- **Không nên expose port 3001 ra public internet** mà không có reverse-proxy + HTTPS. Cổng này chứa cả `GET /sse` (MCP) **và** `GET /auth/login` (form login).
- Khi chạy production, set `DEBUG=false`.

### 8.1. Triển khai sau nginx (hoặc bất kỳ reverse proxy nào)

- Set `PUBLIC_BASE_URL=https://your-domain` hoặc `https://your-domain/mcp` (nếu muốn prefix `/mcp`) trong `.env` (không trailing slash, không port, **phải có scheme** `https://`).
- **Mọi route** của MCP server mount dưới prefix `/mcp`. Nginx phải forward `location /mcp/` về MCP server (cả `GET /mcp/sse`, `POST /mcp/message`, `GET /mcp/auth/login`, `POST /mcp/auth/submit`).
- **Bắt buộc** cấu hình nginx để **không buffer** SSE response (`proxy_buffering off;` + `proxy_cache off;` cho `location /mcp/sse`).
- **Bắt buộc** timeout dài cho `location /mcp/sse` (vd `proxy_read_timeout 86400;`).
- Chuyển tiếp header `X-Forwarded-For` để log IP thật của user.
- Cấu hình HTTPS (Let's Encrypt / certbot) — không chạy HTTP public vì cookie/JWT bị sniff.

### 8.2. Dùng ngrok cho dev (chia sẻ MCP server ra ngoài)

```bash
ngrok http 3001
# Copy URL Forwarding (vd https://abc123.ngrok-free.dev)
# Set PUBLIC_BASE_URL=https://abc123.ngrok-free.dev/mcp trong .env
# (hoặc bỏ /mcp nếu dùng prefix-less mode cũ)
# Restart: pnpm dev
```

Lúc này link `login_start` trả về sẽ có domain ngrok → user mở được từ máy khác.

---

## 9. Roadmap / Known issues

- Hỗ trợ chưa có cho đơn `resignation` (chỉ xuất hiện trong enum `application.type`).
- Chưa có Resource / Prompt / Sampling (chỉ có Tool).
- Session storage in-memory — chưa hỗ trợ multi-instance / Redis.
- Có một số tool dùng HTTP method chưa khớp với backend (xem log `WARN` nếu backend trả 405).

---

## 10. License

ISC.
