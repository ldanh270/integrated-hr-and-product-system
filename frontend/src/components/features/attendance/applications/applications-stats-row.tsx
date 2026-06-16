import { PageCard } from "@/components/common"

import { FileCheck2, FileText, FileX2, Hourglass, type LucideIcon } from "lucide-react"

interface ApplicationsStats {
  pending: number
  approved: number
  rejected: number
  total: number
}

interface ApplicationsStatsRowProps {
  stats: ApplicationsStats
}

const STAT_ITEMS: {
  key: keyof ApplicationsStats
  label: string
  color: string
  bg: string
  icon: LucideIcon
}[] = [
  { key: "pending", label: "Chờ duyệt", color: "text-warning", bg: "bg-warning/10", icon: Hourglass },
  { key: "approved", label: "Đã duyệt", color: "text-success", bg: "bg-success/10", icon: FileCheck2 },
  { key: "rejected", label: "Từ chối", color: "text-destructive", bg: "bg-destructive/10", icon: FileX2 },
  { key: "total", label: "Tổng số", color: "text-muted-foreground", bg: "bg-muted", icon: FileText },
]

export function ApplicationsStatsRow({ stats }: ApplicationsStatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {STAT_ITEMS.map((stat) => {
        const Icon = stat.icon
        return (
          <PageCard key={stat.key} className={`p-4 ${stat.bg} border-none shadow-none`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} border border-current/10`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stats[stat.key]}</p>
              </div>
            </div>
          </PageCard>
        )
      })}
    </div>
  )
}
