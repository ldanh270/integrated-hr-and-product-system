import { PageCard } from "@/components/common"

interface AttendanceSummaryStatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ComponentType<{ className?: string }>
}

export function AttendanceSummaryStatCard({
  title,
  value,
  description,
  icon: Icon,
}: AttendanceSummaryStatCardProps) {
  return (
    <PageCard padding="lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </PageCard>
  )
}
