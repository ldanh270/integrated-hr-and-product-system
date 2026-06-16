import { ROLE } from "@/config/entities/employee.config"
import { ROUTES } from "@/config/routes.config"

import {
  BookOpen,
  Briefcase,
  CalendarClock,
  CalendarDays,
  ChartNoAxesColumn,
  CircleDollarSign,
  FileText,
  Package,
  Settings,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

/** Navigation metadata for HR subsystems (routes, icons, role access). */
export type SubsystemId =
  | "hrm"
  | "application"
  | "attendance"
  | "payroll"
  | "asset"
  | "recruitment"
  | "training"
  | "security"
  | "settings"
  | "project"

export interface NavItem {
  name: string
  path: string
  icon: LucideIcon
  roles?: string[]
}

export interface SubsystemConfig {
  id: SubsystemId
  name: string
  description: string
  icon: LucideIcon
  routePrefix: string
  sidebarItems: NavItem[]
}

export const SUBSYSTEMS: SubsystemConfig[] = [
  {
    id: "hrm",
    name: "Nhân sự",
    description: "Quản lý hồ sơ, hợp đồng, bảo hiểm, công việc...",
    icon: Users,
    routePrefix: "/hrm",
    sidebarItems: [
      { name: "Tổng quan", path: ROUTES.HRM.DASHBOARD, icon: Users },
      { name: "Hồ sơ", path: ROUTES.HRM.EMPLOYEES, icon: Users },
    ],
  },
  {
    id: "application",
    name: "Đơn thư",
    description: "Tạo đơn từ và duyệt đơn trực tuyến",
    icon: FileText,
    routePrefix: "/application",
    sidebarItems: [{ name: "Tổng quan", path: ROUTES.APPLICATION.DASHBOARD, icon: FileText }],
  },
  {
    id: "attendance",
    name: "Chấm công",
    description: "Quản lý phân ca, chấm công và nghỉ phép",
    icon: CalendarClock,
    routePrefix: "/attendance",
    sidebarItems: [
      { name: "Lịch của tôi", path: ROUTES.ATTENDANCE.MY_SCHEDULE, icon: CalendarClock },
      {
        name: "Tổng quan",
        path: ROUTES.ATTENDANCE.DASHBOARD,
        icon: CalendarClock,
        roles: [ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER],
      },
      { name: "Tổng hợp", path: ROUTES.ATTENDANCE.SUMMARY, icon: ChartNoAxesColumn },
      {
        name: "Lịch làm việc",
        path: ROUTES.ATTENDANCE.WORK_SCHEDULES,
        icon: CalendarDays,
        roles: [ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER],
      },
      { name: "Đơn từ", path: ROUTES.ATTENDANCE.APPLICATIONS, icon: FileText },
      {
        name: "Lịch hàng tuần",
        path: ROUTES.ATTENDANCE.WEEKLY_SCHEDULES,
        icon: CalendarClock,
        roles: [ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER],
      },
      {
        name: "Cấu hình lịch tuần",
        path: ROUTES.ATTENDANCE.WEEKLY_SCHEDULE_CONFIG,
        icon: Settings2,
        roles: [ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER],
      },
      {
        name: "Ca làm việc",
        path: ROUTES.ATTENDANCE.SHIFTS,
        icon: CalendarClock,
        roles: [ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER],
      },
      { name: "Ngày lễ", path: ROUTES.ATTENDANCE.HOLIDAYS, icon: CalendarClock },
    ],
  },
  {
    id: "payroll",
    name: "Bảng lương",
    description: "Tự động việc tính và chi trả bảng lương",
    icon: CircleDollarSign,
    routePrefix: "/payroll",
    sidebarItems: [
      {
        name: "Kỳ lương",
        path: ROUTES.PAYROLL.LIST,
        icon: FileText,
        roles: [ROLE.ADMIN, ROLE.HR_MANAGER],
      },
      {
        name: "Thành phần lương",
        path: ROUTES.PAYROLL.SALARY_COMPONENTS,
        icon: Settings,
        roles: [ROLE.ADMIN, ROLE.HR_MANAGER],
      },
      {
        name: "Biến hệ thống",
        path: ROUTES.PAYROLL.SALARY_VARIABLES,
        icon: Settings,
        roles: [ROLE.ADMIN, ROLE.HR_MANAGER],
      },
      {
        name: "Mẫu bảng lương",
        path: ROUTES.PAYROLL.PAYSLIP_TEMPLATES,
        icon: FileText,
        roles: [ROLE.ADMIN, ROLE.HR_MANAGER],
      },
      {
        name: "Chu kỳ lương",
        path: ROUTES.PAYROLL.CYCLE,
        icon: CalendarClock,
        roles: [ROLE.ADMIN, ROLE.HR_MANAGER],
      },
      {
        name: "Lương nhân sự",
        path: ROUTES.PAYROLL.EMPLOYEE_SALARY,
        icon: Users,
        roles: [ROLE.ADMIN, ROLE.HR_MANAGER],
      },
      { name: "Lương của tôi", path: ROUTES.PAYROLL.MY_PAYSLIPS, icon: CircleDollarSign },
    ],
  },
  {
    id: "asset",
    name: "Tài sản",
    description: "Quản lý tài sản và thông tin bàn giao",
    icon: Package,
    routePrefix: "/asset",
    sidebarItems: [{ name: "Tổng quan", path: ROUTES.ASSET.DASHBOARD, icon: Package }],
  },
  {
    id: "recruitment",
    name: "Tuyển dụng",
    description: "Quản lý hồ sơ ứng viên và lịch phỏng vấn",
    icon: Briefcase,
    routePrefix: "/recruitment",
    sidebarItems: [{ name: "Tổng quan", path: ROUTES.RECRUITMENT.DASHBOARD, icon: Briefcase }],
  },
  {
    id: "training",
    name: "Đào tạo",
    description: "Quản lý các khóa đào tạo nội bộ",
    icon: BookOpen,
    routePrefix: "/training",
    sidebarItems: [{ name: "Tổng quan", path: ROUTES.TRAINING.DASHBOARD, icon: BookOpen }],
  },
  {
    id: "security",
    name: "Phân quyền",
    description: "Phân quyền nhân sự trong hệ thống",
    icon: ShieldCheck,
    routePrefix: "/security",
    sidebarItems: [
      { name: "Tổng quan", path: ROUTES.SECURITY.DASHBOARD, icon: ShieldCheck },
      { name: "Vai trò", path: ROUTES.SECURITY.ROLES, icon: ShieldCheck },
      { name: "Người dùng", path: ROUTES.SECURITY.USERS, icon: Users },
      { name: "Nhật ký", path: ROUTES.SECURITY.ACTIVITY_LOGS, icon: FileText },
    ],
  },
  {
    id: "settings",
    name: "Cài đặt",
    description: "Cài đặt hệ thống",
    icon: Settings,
    routePrefix: "/settings",
    sidebarItems: [{ name: "Tổng quan", path: ROUTES.SETTINGS.DASHBOARD, icon: Settings }],
  },
  {
    id: "project",
    name: "Dự án",
    description: "Quản lý dự án, tiến độ công việc và báo cáo",
    icon: Briefcase,
    routePrefix: "/project",
    sidebarItems: [
      { name: "Tổng quan", path: ROUTES.PROJECT.DASHBOARD, icon: FileText },
      { name: "Danh sách dự án", path: ROUTES.PROJECT.LIST, icon: Briefcase },
    ],
  },
]
