import { PageCard } from "@/components/common"

interface MonthlyAttendanceSummaryCardProps {
  totalWorkMinutes: number
  lateCount: number
  absentCount: number
}

export function MonthlyAttendanceSummaryCard({
  totalWorkMinutes,
  lateCount,
  absentCount,
}: MonthlyAttendanceSummaryCardProps) {
  return (
    <PageCard padding="md" className="space-y-3">
      <h3 className="font-semibold text-sm">Tóm tắt tháng</h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xl font-bold text-foreground">{Math.floor(totalWorkMinutes / 60)}h</p>
          <p className="text-xs text-muted-foreground mt-0.5">Tổng giờ</p>
        </div>
        <div className="rounded-lg bg-warning/10 p-3">
          <p className="text-xl font-bold text-warning">{lateCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Đi muộn</p>
        </div>
        <div className="rounded-lg bg-destructive/10 p-3">
          <p className="text-xl font-bold text-destructive">{absentCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Vắng mặt</p>
        </div>
      </div>
    </PageCard>
  )
}
