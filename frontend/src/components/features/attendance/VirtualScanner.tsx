import { useVirtualScanner } from "@/hooks/attendance/useVirtualScanner"

import { AlertCircle, CheckCircle2, Clock, Fingerprint, Loader2 } from "lucide-react"

export default function VirtualScanner() {
  const { user, currentTime, location, locating, isProcessing, handleScan } =
    useVirtualScanner()

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
        {locating ? (
          <div className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 py-2 rounded-lg border border-amber-100 dark:border-amber-900/50 font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang lấy vị trí GPS...</span>
          </div>
        ) : location ? (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 py-2 rounded-lg border border-green-100 dark:border-green-900/50 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>📍 Đã lấy vị trí: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 py-2 rounded-lg border border-amber-100 dark:border-amber-900/50">
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
            <span>{isProcessing ? "Đang xử lý..." : "Chấm Công"}</span>
          </button>
        </div>
      </div>

      {!location && !locating && (
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
