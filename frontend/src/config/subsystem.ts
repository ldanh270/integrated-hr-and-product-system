import { ROLE } from "@/config/entities/employee.config"
import { ROUTES } from "@/config/routes.config"

import {
  BookOpen,
  Briefcase,
  CalendarClock,
  CircleDollarSign,
  FileText,
  Package,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

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
      { name: "Tổng quan", path: "/hrm/dashboard", icon: Users },
      { name: "Nhân sự", path: "/hrm/employees", icon: Users },
    ],
  },
  {
    id: "application",
    name: "Đơn thư",
    description: "Tạo đơn từ và duyệt đơn trực tuyến",
    icon: FileText,
    routePrefix: "/application",
    sidebarItems: [{ name: "Tổng quan", path: "/application/dashboard", icon: FileText }],
  },
  {
    id: "attendance",
    name: "Chấm công",
    description: "Quản lý phân ca, chấm công và nghỉ phép",
    icon: CalendarClock,
    routePrefix: "/attendance",
    sidebarItems: [
      { name: "Tổng quan", path: "/attendance", icon: CalendarClock },
      { name: "Lịch của tôi", path: "/attendance/my-schedule", icon: CalendarClock },
      { name: "Đơn từ", path: "/attendance/applications", icon: FileText },
      { name: "Ca làm việc", path: "/attendance/shifts", icon: CalendarClock },
      { name: "Ngày lễ", path: "/attendance/holidays", icon: CalendarClock },
    ],
  },
  {
    id: "payroll",
    name: "Bảng lương",
    description: "Tự động việc tính và chi trả bảng lương",
    icon: CircleDollarSign,
    routePrefix: "/payroll",
    sidebarItems: [
      { name: "Tổng quan", path: ROUTES.PAYROLL.DASHBOARD, icon: CircleDollarSign },
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
      {
        name: "Trường tùy chỉnh",
        path: ROUTES.PAYROLL.CUSTOM_FIELDS,
        icon: Settings,
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
    sidebarItems: [{ name: "Tổng quan", path: "/asset/dashboard", icon: Package }],
  },
  {
    id: "recruitment",
    name: "Tuyển dụng",
    description: "Quản lý hồ sơ ứng viên và lịch phỏng vấn",
    icon: Briefcase,
    routePrefix: "/recruitment",
    sidebarItems: [{ name: "Tổng quan", path: "/recruitment/dashboard", icon: Briefcase }],
  },
  {
    id: "training",
    name: "Đào tạo",
    description: "Quản lý các khóa đào tạo nội bộ",
    icon: BookOpen,
    routePrefix: "/training",
    sidebarItems: [{ name: "Tổng quan", path: "/training/dashboard", icon: BookOpen }],
  },
  {
    id: "security",
    name: "Phân quyền",
    description: "Phân quyền nhân sự trong hệ thống",
    icon: ShieldCheck,
    routePrefix: "/security",
    sidebarItems: [
      { name: "Tổng quan", path: "/security/dashboard", icon: ShieldCheck },
      { name: "Vai trò", path: "/security/roles", icon: ShieldCheck },
      { name: "Người dùng", path: "/security/users", icon: Users },
      { name: "Nhật ký", path: "/security/activity-logs", icon: FileText },
    ],
  },
  {
    id: "settings",
    name: "Cài đặt",
    description: "Cài đặt hệ thống",
    icon: Settings,
    routePrefix: "/settings",
    sidebarItems: [{ name: "Tổng quan", path: "/settings/dashboard", icon: Settings }],
  },
]
