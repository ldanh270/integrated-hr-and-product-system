import { APPLICATION_TYPES } from "@/config/entities/attendance.config"
import { PERSONAL_TAB_LABELS } from "@/config/entities/personal.config"
import { ROUTES } from "@/config/routes.config"

import {
  BookOpen,
  Briefcase,
  CalendarClock,
  CalendarDays,
  ChartNoAxesColumn,
  CircleDollarSign,
  FilePlus2,
  FileText,
  Package,
  Settings,
  Settings2,
  ShieldCheck,
  User,
  UserCheck,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type SubsystemId =
  | "hrm"
  | "personal"
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
  permissions?: string[]
  subItems?: { name: string; path: string; icon?: LucideIcon }[]
}

export interface SubsystemConfig {
  id: SubsystemId
  name: string
  description: string
  icon: LucideIcon
  routePrefix: string
  sidebarItems: NavItem[]
  permissions?: string[]
}

export const SUBSYSTEMS: SubsystemConfig[] = [
  {
    id: "personal",
    name: "CĂ¡ nhĂ¢n",
    description: "CĂ¡c mĂ n hĂ¬nh cĂ¡ nhĂ¢n dĂ nh cho nhĂ¢n viĂªn",
    icon: User,
    routePrefix: "/personal",
    sidebarItems: [
      { name: PERSONAL_TAB_LABELS.schedule, path: ROUTES.PERSONAL.SCHEDULE, icon: CalendarClock },
      {
        name: PERSONAL_TAB_LABELS.payslips,
        path: ROUTES.PERSONAL.PAYSLIPS,
        icon: CircleDollarSign,
      },
      { name: PERSONAL_TAB_LABELS.projects, path: ROUTES.PERSONAL.PROJECTS, icon: Briefcase },
    ],
  },
  {
    id: "hrm",
    name: "NhĂ¢n sá»±",
    description: "Quáº£n lĂ½ há»“ sÆ¡, há»£p Ä‘á»“ng, báº£o hiá»ƒm, cĂ´ng viá»‡c...",
    icon: Users,
    routePrefix: "/hrm",
    sidebarItems: [
      { name: "Tá»•ng quan", path: ROUTES.HRM.DASHBOARD, icon: Users },
      { name: "Há»“ sÆ¡", path: ROUTES.HRM.EMPLOYEES, icon: Users },
      { name: "NgÆ°á»i dĂ¹ng", path: ROUTES.SECURITY.USERS, icon: Users, permissions: ["security.read"] },
      { name: "Nháº­t kĂ½", path: ROUTES.SECURITY.ACTIVITY_LOGS, icon: FileText, permissions: ["audit.read"] },
      { name: "Tá»•ng quan báº£o máº­t", path: ROUTES.SECURITY.DASHBOARD, icon: ShieldCheck, permissions: ["security.read"] },
    ],
  },
  {
    id: "application",
    name: "ÄÆ¡n thÆ°",
    description: "Táº¡o Ä‘Æ¡n tá»« vĂ  duyá»‡t Ä‘Æ¡n trá»±c tuyáº¿n",
    icon: FileText,
    routePrefix: "/application",
    sidebarItems: [
      { name: "Báº¡n duyá»‡t", path: ROUTES.APPLICATION.DASHBOARD + "?tab=manage", icon: UserCheck },
      {
        name: "ÄÆ¡n thÆ°",
        path: ROUTES.APPLICATION.DASHBOARD,
        icon: FilePlus2,
        subItems: Object.values(APPLICATION_TYPES).map((t) => ({
          name: t.DESCRIPTION,
          path: `${ROUTES.APPLICATION.DASHBOARD}?type=${t.LABEL}`,
        })),
      },
      { name: "Cá»§a báº¡n", path: ROUTES.APPLICATION.DASHBOARD + "?tab=mine", icon: User },
    ],
  },
  {
    id: "attendance",
    name: "Cháº¥m cĂ´ng",
    description: "Quáº£n lĂ½ phĂ¢n ca, cháº¥m cĂ´ng vĂ  nghá»‰ phĂ©p",
    icon: CalendarClock,
    routePrefix: "/attendance",
    sidebarItems: [
      {
        name: "Tá»•ng quan",
        path: ROUTES.ATTENDANCE.DASHBOARD,
        icon: CalendarClock,
        permissions: ["attendance.read"],
      },
      { name: "Tá»•ng há»£p", path: ROUTES.ATTENDANCE.SUMMARY, icon: ChartNoAxesColumn, permissions: ["attendance.read"] },
      { name: "Lá»‹ch cá»§a tĂ´i", path: ROUTES.ATTENDANCE.MY_SCHEDULE, icon: CalendarClock },
      {
        name: "Lá»‹ch lĂ m viá»‡c",
        path: ROUTES.ATTENDANCE.WORK_SCHEDULES,
        icon: CalendarDays,
        permissions: ["attendance.update"],
      },
      { name: "ÄÆ¡n tá»«", path: ROUTES.ATTENDANCE.APPLICATIONS, icon: FileText },
      {
        name: "Lá»‹ch hĂ ng tuáº§n",
        path: ROUTES.ATTENDANCE.WEEKLY_SCHEDULES,
        icon: CalendarClock,
        permissions: ["attendance.update"],
      },
      {
        name: "Cáº¥u hĂ¬nh lá»‹ch tuáº§n",
        path: ROUTES.ATTENDANCE.WEEKLY_SCHEDULE_CONFIG,
        icon: Settings2,
        permissions: ["attendance.update"],
      },
      {
        name: "Ca lĂ m viá»‡c",
        path: ROUTES.ATTENDANCE.SHIFTS,
        icon: CalendarClock,
        permissions: ["attendance.update"],
      },
      { name: "NgĂ y lá»…", path: ROUTES.ATTENDANCE.HOLIDAYS, icon: CalendarClock },
    ],
  },
  {
    id: "payroll",
    name: "Báº£ng lÆ°Æ¡ng",
    description: "Tá»± Ä‘á»™ng viá»‡c tĂ­nh vĂ  chi tráº£ báº£ng lÆ°Æ¡ng",
    icon: CircleDollarSign,
    routePrefix: "/payroll",
    sidebarItems: [
      {
        name: "Ká»³ lÆ°Æ¡ng",
        path: ROUTES.PAYROLL.LIST,
        icon: FileText,
        permissions: ["payroll.read"],
      },
      {
        name: "ThĂ nh pháº§n lÆ°Æ¡ng",
        path: ROUTES.PAYROLL.SALARY_COMPONENTS,
        icon: Settings,
        permissions: ["payroll.read"],
      },
      {
        name: "Biáº¿n há»‡ thá»‘ng",
        path: ROUTES.PAYROLL.SALARY_VARIABLES,
        icon: Settings,
        permissions: ["payroll.read"],
      },
      {
        name: "Máº«u báº£ng lÆ°Æ¡ng",
        path: ROUTES.PAYROLL.PAYSLIP_TEMPLATES,
        icon: FileText,
        permissions: ["payroll.read"],
      },
      {
        name: "Chu ká»³ lÆ°Æ¡ng",
        path: ROUTES.PAYROLL.CYCLE,
        icon: CalendarClock,
        permissions: ["payroll.read"],
      },
      {
        name: "LÆ°Æ¡ng nhĂ¢n sá»±",
        path: ROUTES.PAYROLL.EMPLOYEE_SALARY,
        icon: Users,
        permissions: ["payroll.read"],
      },
    ],
  },
  {
    id: "asset",
    name: "TĂ i sáº£n",
    description: "Quáº£n lĂ½ tĂ i sáº£n vĂ  thĂ´ng tin bĂ n giao",
    icon: Package,
    routePrefix: "/asset",
    sidebarItems: [{ name: "Tá»•ng quan", path: ROUTES.ASSET.DASHBOARD, icon: Package }],
  },
  {
    id: "recruitment",
    name: "Tuyá»ƒn dá»¥ng",
    description: "Quáº£n lĂ½ há»“ sÆ¡ á»©ng viĂªn vĂ  lá»‹ch phá»ng váº¥n",
    icon: Briefcase,
    routePrefix: "/recruitment",
    sidebarItems: [{ name: "Tá»•ng quan", path: ROUTES.RECRUITMENT.DASHBOARD, icon: Briefcase }],
  },
  {
    id: "training",
    name: "ÄĂ o táº¡o",
    description: "Quáº£n lĂ½ cĂ¡c khĂ³a Ä‘Ă o táº¡o ná»™i bá»™",
    icon: BookOpen,
    routePrefix: "/training",
    sidebarItems: [{ name: "Tá»•ng quan", path: ROUTES.TRAINING.DASHBOARD, icon: BookOpen }],
  },
  {
    id: "settings",
    name: "CĂ i Ä‘áº·t",
    description: "CĂ i Ä‘áº·t há»‡ thá»‘ng",
    icon: Settings,
    routePrefix: "/settings",
    sidebarItems: [
      { name: "Tá»•ng quan", path: ROUTES.SETTINGS.DASHBOARD, icon: Settings },
      { name: "Vai trĂ²", path: ROUTES.SETTINGS.ROLES, icon: ShieldCheck, permissions: ["role.read"] },
      { name: "Cáº¥u hĂ¬nh quyá»n", path: ROUTES.SETTINGS.ROLE_PERMISSIONS, icon: ShieldCheck, permissions: ["role.read"] },
      { name: "PhĂ¢n quyá»n", path: ROUTES.SETTINGS.PERMISSIONS, icon: ShieldCheck, permissions: ["role.read"] },
    ],
  },
  {
    id: "project",
    name: "Dá»± Ă¡n",
    description: "Quáº£n lĂ½ dá»± Ă¡n, tiáº¿n Ä‘á»™ cĂ´ng viá»‡c vĂ  bĂ¡o cĂ¡o",
    icon: Briefcase,
    routePrefix: "/project",
    sidebarItems: [
      { name: "Tá»•ng quan", path: ROUTES.PERSONAL.PROJECTS, icon: FileText },
      { name: "Danh sĂ¡ch dá»± Ă¡n", path: ROUTES.PROJECT.LIST, icon: Briefcase },
    ],
  },
]
