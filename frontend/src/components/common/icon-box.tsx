import { cn } from "@/lib/utils"

import type { LucideIcon } from "lucide-react"

interface IconBoxProps {
  icon: LucideIcon
  colorClass: string
  size?: "sm" | "md"
  className?: string
}

const sizeMap = {
  sm: { box: "h-7 w-7", icon: 14 },
  md: { box: "h-8 w-8", icon: 16 },
}

/**
 * IconBox — Colored icon badge used in stat rows, list items, and feature cells.
 * Enforces consistent icon container sizing across the app.
 */
export function IconBox({ icon: Icon, colorClass, size = "sm", className }: IconBoxProps) {
  const { box, icon } = sizeMap[size]
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        box,
        colorClass,
        className,
      )}
    >
      <Icon size={icon} />
    </div>
  )
}
