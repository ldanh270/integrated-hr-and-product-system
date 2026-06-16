import { PageHeader } from "@/components/common"
import { AttendanceAttentionPanel } from "@/components/features/attendance/dashboard/attendance-attention-panel"
import { AttendanceDashboardStatsRow } from "@/components/features/attendance/dashboard/attendance-dashboard-stats-row"
import { AttendanceRecordsFilters } from "@/components/features/attendance/dashboard/attendance-records-filters"
import { AttendanceRecordsTable } from "@/components/features/attendance/dashboard/attendance-records-table"
import VirtualScanner from "@/components/features/attendance/virtual-scanner"
import { Button } from "@/components/ui/button"
import { useAdminAttendanceDashboard } from "@/hooks/attendance/use-admin-attendance-dashboard"

import { Download } from "lucide-react"

export function AdminAttendanceDashboard() {
  const dashboard = useAdminAttendanceDashboard()

  return (
    <div className="container px-6 py-6 space-y-6">
      <PageHeader
        title="Tổng quan chấm công"
        description="Dữ liệu chấm công toàn bộ nhân sự và cá nhân bạn."
        actions={
          <Button variant="outline" className="gap-2" onClick={dashboard.handleExport}>
            <Download size={16} /> Xuất CSV
          </Button>
        }
      />

      <AttendanceDashboardStatsRow
        todayRecordsCount={dashboard.todayRecordsCount}
        presentToday={dashboard.presentToday}
        lateToday={dashboard.lateToday}
        absentToday={dashboard.absentToday}
      />

      <AttendanceAttentionPanel
        openCheckoutToday={dashboard.openCheckoutToday}
        attentionRecords={dashboard.attentionRecords}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <VirtualScanner />
        </div>

        <div className="lg:col-span-3 space-y-4">
          <AttendanceRecordsFilters
            startDate={dashboard.startDate}
            endDate={dashboard.endDate}
            statusFilter={dashboard.statusFilter}
            onStartDateChange={dashboard.setStartDate}
            onEndDateChange={dashboard.setEndDate}
            onStatusFilterChange={dashboard.setStatusFilter}
          />

          <AttendanceRecordsTable
            records={dashboard.records}
            isLoading={dashboard.isLoading}
            isError={dashboard.isError}
          />
        </div>
      </div>
    </div>
  )
}
