interface PageCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  padding?: "sm" | "md" | "lg"
  noBorder?: boolean
}
/**
 * PageCard — Standard card container used across all pages.
 * Replaces ad-hoc `rounded-xl border border-border bg-card shadow-sm` divs.
 */
export declare function PageCard({
  children,
  className,
  padding,
  noBorder,
  ...props
}: PageCardProps): import("react/jsx-runtime").JSX.Element
export {}
