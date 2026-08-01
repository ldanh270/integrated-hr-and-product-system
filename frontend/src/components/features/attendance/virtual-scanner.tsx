import { ATTENDANCE_MESSAGES } from "@/config/messages/attendance.message"
import { useVirtualScanner } from "@/hooks/attendance/useVirtualScanner"

import { AlertCircle, CheckCircle2, Clock, Fingerprint, Loader2, MapPin } from "lucide-react"

export function VirtualScanner() {
  const {
    user,
    currentTime,
    location,
    locating,
    isProcessing,
    nextActionLabel,
    todayShift,
    canScan,
    scanDisabledLabel,
    isShiftLoading,
    handleScan,
  } = useVirtualScanner()

  return (
    <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6 flex flex-col items-center max-w-sm mx-auto">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <Fingerprint className="w-12 h-12 text-primary" />
      </div>

      <h2 className="text-xl font-bold tracking-tight">{ATTENDANCE_MESSAGES.SCANNER.TITLE}</h2>
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
            <p className="text-sm font-semibold text-foreground">
              {ATTENDANCE_MESSAGES.SCANNER.TODAY_SHIFT}
            </p>
            {isShiftLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          </div>

          {todayShift ? (
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-3">
                <span>{ATTENDANCE_MESSAGES.SCANNER.SHIFT_NAME}</span>
                <span className="font-semibold text-foreground">{todayShift.name}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>{ATTENDANCE_MESSAGES.SCANNER.WORK_WINDOW}</span>
                <span className="font-mono text-foreground">{todayShift.workWindow}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>{ATTENDANCE_MESSAGES.SCANNER.CHECK_IN_WINDOW}</span>
                <span className="font-mono text-foreground">{todayShift.checkInWindow}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>{ATTENDANCE_MESSAGES.SCANNER.CHECK_OUT_WINDOW}</span>
                <span className="font-mono text-foreground">{todayShift.checkOutWindow}</span>
              </div>
              <div className="flex items-start gap-2 pt-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{todayShift.gpsLabel}</span>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              {ATTENDANCE_MESSAGES.SCANNER.NO_SHIFT_TODAY}
            </p>
          )}
        </div>

        {/* The green success state intentionally hides raw coordinates; shift card owns geofence detail. */}
        {locating ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-warning/20 bg-warning/10 py-2 text-sm font-medium text-warning">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{ATTENDANCE_MESSAGES.SCANNER.GEO_LOCATING}</span>
          </div>
        ) : location ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-success/20 bg-success/10 py-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" />
            <span>{ATTENDANCE_MESSAGES.SCANNER.GEO_READY}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-warning/20 bg-warning/10 px-2 py-2 text-xs text-warning">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{ATTENDANCE_MESSAGES.SCANNER.GEO_MISSING}</span>
          </div>
        )}

        <div className="pt-4 border-t">
          <button
            onClick={handleScan}
            disabled={isProcessing || locating || !canScan}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Fingerprint className="w-5 h-5" />
            )}
            <span>
              {isProcessing
                ? ATTENDANCE_MESSAGES.SCANNER.PROCESSING(nextActionLabel)
                : scanDisabledLabel ?? nextActionLabel}
            </span>
          </button>
        </div>
      </div>

      {!location && !locating && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
          <p>{ATTENDANCE_MESSAGES.SCANNER.GEO_PERMISSION_HINT}</p>
        </div>
      )}
    </div>
  )
}
