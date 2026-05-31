import type { LucideIcon } from "lucide-react";
interface StatRowProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    colorClass: string;
    isLast?: boolean;
    className?: string;
}
/**
 * StatRow — Labeled stat row with icon, label, and numeric value.
 * Used in AttendanceStats, LeaveBalance, and any dashboard list card.
 */
export declare function StatRow({ label, value, icon, colorClass, isLast, className }: StatRowProps): import("react/jsx-runtime").JSX.Element;
export {};
