import { useVirtualScanner } from "@/hooks/attendance/useVirtualScanner"
import { AlertCircle, CheckCircle2, Clock, Fingerprint, MapPin } from "lucide-react"

export default function VirtualScanner() {
  const {
    user,
    currentTime,
    location,
    locating,
    isProcessing,
    getLocation,
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
        {!location ? (
          <button
            onClick={getLocation}
            disabled={locating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border hover:bg-accent text-sm font-medium transition-colors"
          >
            <MapPin className="w-4 h-4" />
            {locating ? "Đang lấy vị trí..." : "Lấy vị trí GPS"}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 py-2 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã xác định vị trí</span>
          </div>
        )}

        <div className="pt-4 border-t">
          <button
            onClick={handleScan}
            disabled={isProcessing || !location}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Fingerprint className="w-5 h-5" />
            <span>Chấm Công</span>
          </button>
        </div>
      </div>

      {!location && (
        <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <p>
            Yêu cầu quyền truy cập vị trí (Location Permission) từ trình duyệt để đảm bảo chấm công
            đúng địa điểm.
          </p>
        </div>
      )}
    </div>
  )
}
