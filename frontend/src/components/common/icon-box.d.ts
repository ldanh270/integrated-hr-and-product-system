import type { LucideIcon } from "lucide-react";
interface IconBoxProps {
    icon: LucideIcon;
    colorClass: string;
    size?: "sm" | "md";
    className?: string;
}
/**
 * IconBox — Colored icon badge used in stat rows, list items, and feature cells.
 * Enforces consistent icon container sizing across the app.
 */
export declare function IconBox({ icon: Icon, colorClass, size, className }: IconBoxProps): import("react/jsx-runtime").JSX.Element;
export {};
