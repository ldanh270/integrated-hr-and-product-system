import VirtualScanner from "@/components/features/attendance/VirtualScanner"

export default function MySchedule() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lịch Trình & Chấm Công</h1>
          <p className="text-muted-foreground mt-1">Xem lịch làm việc và thực hiện chấm công hằng ngày.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <VirtualScanner />
          
          <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6">
            <h3 className="font-semibold mb-4">Lưu ý</h3>
            <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
              <li>Bạn chỉ có thể Check In khi đang ở trong khu vực văn phòng.</li>
              <li>Nếu Check In trễ quá thời gian ân hạn, hệ thống sẽ ghi nhận Đi Muộn.</li>
              <li>Nhớ Check Out khi ra về để tính tổng thời gian làm việc.</li>
            </ul>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6 h-full min-h-[500px] flex items-center justify-center">
            {/* Placeholder for Attendance Calendar Component */}
            <div className="text-center text-muted-foreground">
              <p>Phần Lịch Làm Việc sẽ được hiển thị tại đây.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
