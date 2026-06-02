import { cn } from "@/lib/utils"

interface PageCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  padding?: "sm" | "md" | "lg"
  noBorder?: boolean
}

const paddingMap = {
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
}

/**
 * PageCard — Standard card container used across all pages.
 * Replaces ad-hoc `rounded-xl border border-border bg-card shadow-sm` divs.
 */
export function PageCard({
  children,
  className,
  padding = "md",
  noBorder = false,
  ...props
}: PageCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card shadow-sm",
        !noBorder && "border border-border",
        paddingMap[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
