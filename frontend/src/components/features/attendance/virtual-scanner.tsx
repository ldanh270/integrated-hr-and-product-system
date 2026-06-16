import { useVirtualScanner } from "@/hooks/attendance/useVirtualScanner"

import { AlertCircle, CheckCircle2, Clock, Fingerprint, Loader2, MapPin } from "lucide-react"

export default function VirtualScanner() {
  const {
    user,
    currentTime,
    location,
    locating,
    isProcessing,
    nextActionLabel,
    todayShift,
    isShiftLoading,
    handleScan,
  } = useVirtualScanner()

  return (
    <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6 flex flex-col items-center max-w-sm mx-auto">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <Fingerprint className="w-12 h-12 text-primary" />
      </div>

      <h2 className="text-xl font-bold tracking-tight">Máy Chấm Công Ảo</h2>
      <p className="text-muted-foreground text-sm mt-1">{user?.fullName}</p>

      <div className="flex items-center gap-2 mt-6 text-3xl font-mono tracking-tighter">
        <Clock className="w-6 h-6 text-muted-foreground" />
        {currentTime.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </div>

      <div className="mt-6 w-full space-y-3">
        <div className="rounded-xl border bg-muted/40 p-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">Ca hôm nay</p>
            {isShiftLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          </div>

          {todayShift ? (
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-3">
                <span>Tên ca</span>
                <span className="font-semibold text-foreground">{todayShift.name}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Giờ làm</span>
                <span className="font-mono text-foreground">{todayShift.workWindow}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Check-in đúng giờ</span>
                <span className="font-mono text-foreground">{todayShift.checkInWindow}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Check-out</span>
                <span className="font-mono text-foreground">{todayShift.checkOutWindow}</span>
              </div>
              <div className="flex items-start gap-2 pt-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{todayShift.gpsLabel}</span>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Chưa có ca làm việc được phân cho hôm nay.
            </p>
          )}
        </div>

        {locating ? (
          <div className="flex items-center justify-center gap-2 text-sm text-warning bg-warning/10 py-2 rounded-lg border border-warning/20 font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang lấy vị trí GPS...</span>
          </div>
        ) : location ? (
          <div className="flex items-center justify-center gap-2 text-sm text-success bg-success/10 py-2 rounded-lg border border-success/20 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>📍 Đã lấy vị trí: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs text-warning bg-warning/10 py-2 rounded-lg border border-warning/20">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>⚠️ Chưa có vị trí GPS</span>
          </div>
        )}

        <div className="pt-4 border-t">
          <button
            onClick={handleScan}
            disabled={isProcessing || locating}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Fingerprint className="w-5 h-5" />
            )}
            <span>{isProcessing ? `Đang ${nextActionLabel}...` : nextActionLabel}</span>
          </button>
        </div>
      </div>

      {!location && !locating && (
        <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 text-warning shrink-0" />
          <p>
            Yêu cầu quyền truy cập vị trí (Location Permission) từ trình duyệt để đảm bảo chấm công
            đúng địa điểm.
          </p>
        </div>
      )}
    </div>
  )
}
