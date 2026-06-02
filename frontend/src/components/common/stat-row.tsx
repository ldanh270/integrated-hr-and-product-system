import { IconBox } from "@/components/common/icon-box"
import { cn } from "@/lib/utils"

import type { LucideIcon } from "lucide-react"

interface StatRowProps {
  label: string
  value: string | number
  icon: LucideIcon
  colorClass: string
  isLast?: boolean
  className?: string
}

/**
 * StatRow — Labeled stat row with icon, label, and numeric value.
 * Used in AttendanceStats, LeaveBalance, and any dashboard list card.
 */
export function StatRow({ label, value, icon, colorClass, isLast, className }: StatRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-1.5",
        !isLast && "border-b border-border/20",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <IconBox icon={icon} colorClass={colorClass} size="sm" />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-bold text-foreground tabular-nums">{value}</span>
    </div>
  )
}
