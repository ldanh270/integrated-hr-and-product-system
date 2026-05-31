import type { LucideIcon } from "lucide-react";
export type SubsystemId = "hrm" | "application" | "attendance" | "payroll" | "asset" | "recruitment" | "training" | "security" | "settings";
export interface NavItem {
    name: string;
    path: string;
    icon: LucideIcon;
}
export interface SubsystemConfig {
    id: SubsystemId;
    name: string;
    description: string;
    icon: LucideIcon;
    routePrefix: string;
    sidebarItems: NavItem[];
}
export declare const SUBSYSTEMS: SubsystemConfig[];
