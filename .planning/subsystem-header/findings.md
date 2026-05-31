# Findings — Subsystem Header Dropdown

## Current Architecture

### Layout
- `MainLayout.tsx` → wraps `<Sidebar />` + `<Header />` + `<main>{children}</main>`
- Sidebar has hardcoded nav items under `/hrm/*`
- Header has: title "Tổng quan nhân sự" + sub-tabs (Cá nhân/Tổng hợp) + bell + user dropdown

### Routing
- `routes/index.ts` exports `publicRoutes` + `privateRoutes` arrays
- All private routes use `MainLayout` and are under `/hrm/*`
- Attendance pages already exist under `/hrm/attendance/*`

### Existing Pages
- `/hrm/dashboard` → Dashboard.tsx
- `/hrm/employees` → EmployeeList.tsx
- `/hrm/profile` → Profile.tsx
- `/hrm/attendance` → AttendanceDashboard.tsx
- `/hrm/attendance/my-schedule` → MySchedule.tsx
- `/hrm/attendance/applications` → Applications.tsx
- `/hrm/attendance/shifts` → ShiftManagement.tsx
- `/hrm/attendance/holidays` → Holidays.tsx

### State Management
- Auth store: Zustand (`auth-store.ts`)
- No subsystem/module store exists yet

### Design Tokens
- Uses shadcn + Tailwind CSS tokens
- Sidebar tokens: `sidebar`, `sidebar-foreground`, `sidebar-primary`, etc.
- Primary: `#2563eb` (blue-600)

## Screenshot Analysis
- "Phân hệ" button at top-right header opens a dropdown
- Dropdown items have icon + title + subtitle description
- Items: Nhân sự, Đơn thư, Chấm công, Bảng lương, Tài sản, Tuyển dụng, Đào tạo, Phân quyền, Cài đặt
- Each item has a chevron-right arrow icon
- Dropdown has rounded corners, shadow, clean white bg

## Key Design Decisions
- Each subsystem gets its OWN sidebar nav items
- Route prefix per subsystem: `/hrm/*`, `/application/*`, `/attendance/*`, `/payroll/*`, `/recruitment/*`, `/security/*`
- Migrate existing `/hrm/attendance/*` → `/attendance/*`
- Dropdown UI matches screenshot reference
