import { cn } from "@/lib/utils"

export function SubApplicationField({
  label,
  value,
  span,
  className,
}: {
  label: string
  value: string | number | null | undefined
  span?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", span && "col-span-full")}>
      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      <span className={cn("text-sm font-medium text-foreground", className)}>{value}</span>
    </div>
  )
}
