import { PageCard } from "@/components/common"

import { CalendarX2, Clock, UserCheck, Users } from "lucide-react"

interface AttendanceDashboardStatsRowProps {
  todayRecordsCount: number
  presentToday: number
  lateToday: number
  absentToday: number
}

export function AttendanceDashboardStatsRow({
  todayRecordsCount,
  presentToday,
  lateToday,
  absentToday,
}: AttendanceDashboardStatsRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <PageCard padding="lg">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium tracking-tight">Tổng nhân sự</p>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold">{todayRecordsCount || "—"}</p>
        <p className="text-xs text-muted-foreground mt-1">Hôm nay có dữ liệu</p>
      </PageCard>

      <PageCard padding="lg">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium tracking-tight">Đã có mặt</p>
          <UserCheck className="h-4 w-4 text-success" />
        </div>
        <p className="text-2xl font-bold text-success">{presentToday}</p>
        <p className="text-xs text-muted-foreground mt-1">Đã check in hôm nay</p>
      </PageCard>

      <PageCard padding="lg">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium tracking-tight">Đi muộn</p>
          <Clock className="h-4 w-4 text-warning" />
        </div>
        <p className="text-2xl font-bold text-warning">{lateToday}</p>
        <p className="text-xs text-muted-foreground mt-1">Hôm nay</p>
      </PageCard>

      <PageCard padding="lg">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium tracking-tight">Vắng mặt</p>
          <CalendarX2 className="h-4 w-4 text-destructive" />
        </div>
        <p className="text-2xl font-bold text-destructive">{absentToday}</p>
        <p className="text-xs text-muted-foreground mt-1">Hôm nay</p>
      </PageCard>
    </div>
  )
}
