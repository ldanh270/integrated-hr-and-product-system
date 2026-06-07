import VirtualScanner from "@/components/features/attendance/VirtualScanner"

import { CalendarX2, Clock, UserCheck, Users } from "lucide-react"

export default function AttendanceDashboard() {
  return (
    <div className="p-6 mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tổng Quan Chấm Công</h1>
        <p className="text-muted-foreground mt-1">
          Dữ liệu chấm công hôm nay của toàn bộ nhân sự và cá nhân bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Cards */}
        <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium">Tổng Nhân Sự</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">150</div>
            <p className="text-xs text-muted-foreground mt-1">Tất cả nhân sự hoạt động</p>
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium">Đã Có Mặt</h3>
            <UserCheck className="h-4 w-4 text-green-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">132</div>
            <p className="text-xs text-muted-foreground mt-1">88% tỷ lệ có mặt</p>
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium">Đi Muộn</h3>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-500">12</div>
            <p className="text-xs text-muted-foreground mt-1">Hôm nay</p>
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium">Vắng Mặt / Nghỉ Phép</h3>
            <CalendarX2 className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">6</div>
            <p className="text-xs text-muted-foreground mt-1">4 có phép, 2 không phép</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card text-card-foreground rounded-xl border shadow-sm flex flex-col">
          <div className="p-6 border-b">
            <h3 className="font-semibold text-lg">Hoạt Động Chấm Công Gần Đây</h3>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center text-muted-foreground min-h-100">
            Bảng danh sách các lượt Check-In/Check-Out mới nhất sẽ hiển thị ở đây.
          </div>
        </div>

        <div className="space-y-6">
          {/* Virtual Scanner placed directly on Dashboard for quick access */}
          <VirtualScanner />

          <div className="bg-card text-card-foreground rounded-xl border shadow-sm">
            <div className="p-6 border-b">
              <h3 className="font-semibold text-lg">Đơn Từ Cần Duyệt</h3>
            </div>
            <div className="p-6 min-h-62.5 flex items-center justify-center text-muted-foreground">
              Danh sách đơn xin phép chờ HR/Admin phê duyệt.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
