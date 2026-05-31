import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  action?: React.ReactNode
  className?: string
}

/**
 * SectionHeader — Card title row with optional right-side action slot.
 * Provides consistent `border-b` divider and spacing across all cards.
 */
export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-border/40 pb-2.5 mb-4",
        className
      )}
    >
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}
