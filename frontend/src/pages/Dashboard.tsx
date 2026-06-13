import { PageCard, SectionHeader, StatusPill } from "@/components/common"
import AttendanceStats from "@/components/dashboard/attendance-stats.tsx"
import WorkSchedule from "@/components/dashboard/work-schedule.tsx"
import { useDashboard } from "@/hooks/dashboard/useDashboard"
import { useEffect } from "react"

/**
 * WelcomeIllustration — minimal developer SVG, scaled down for compact layout.
 */
const WelcomeIllustration = () => (
// ... (I'll copy the actual text from previous read)

  <svg viewBox="0 0 160 120" className="h-24 w-24 text-white select-none hidden sm:block shrink-0">
    <rect x="20" y="95" width="120" height="4" rx="2" fill="#ffffff" opacity="0.25" />
    <rect
      x="45"
      y="45"
      width="70"
      height="45"
      rx="3"
      fill="#0f172a"
      stroke="#ffffff"
      strokeWidth="2"
    />
    <path
      d="M52,52 h14 M52,59 h28 M52,66 h18 M52,73 h34"
      stroke="#3b82f6"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path d="M52,80 h10" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
    <polygon points="72,90 88,90 84,95 76,95" fill="#475569" stroke="#ffffff" strokeWidth="2" />
    <circle cx="110" cy="38" r="14" fill="#fed7aa" />
    <path d="M110,24 Q105,24 100,28 Q94,36 102,42 Q108,44 110,38 Z" fill="#1e293b" />
    <rect
      x="103"
      y="34"
      width="7"
      height="5"
      rx="1"
      fill="none"
      stroke="#1e293b"
      strokeWidth="1.5"
    />
    <rect
      x="112"
      y="34"
      width="7"
      height="5"
      rx="1"
      fill="none"
      stroke="#1e293b"
      strokeWidth="1.5"
    />
    <line x1="110" y1="36" x2="112" y2="36" stroke="#1e293b" strokeWidth="1.5" />
    <path d="M96,52 L124,52 L132,95 L88,95 Z" fill="#2563eb" />
  </svg>
)

/**
 * Dashboard page component
 * Composes visual cards, time-clock, attendance, and weekly calendar widgets.
 */
export default function Dashboard() {
  const { user, todayFormatted, shiftInfo } = useDashboard()

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Lưu tọa độ vào localStorage để trang chấm công dùng lại
        localStorage.setItem(
          "userLocation",
          JSON.stringify({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        )
      },
      (error) => {
        console.warn("GPS denied:", error.message)
        // Không hiện toast, không crash - âm thầm bỏ qua
      },
      { timeout: 10000, maximumAge: 300000 }, // cache 5 phút
    )
  }, [])

  return (
    <div className="container px-6 py-6">
      <div className="grid grid-cols-12 gap-5">
        {/* Left column — welcome banner, shift tracker, attendance stats */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-blue-600 via-indigo-600 to-indigo-700 p-5 text-white shadow-md flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                Dashboard Overview
              </span>
              <h2 className="text-xl font-bold leading-tight truncate">
                Xin chào, {user?.fullName || "Nhân viên"}!
              </h2>
              <p className="text-xs opacity-75">Chúc bạn một ngày làm việc hiệu quả.</p>
            </div>
            <WelcomeIllustration />
          </div>

          {/* Shift Tracker */}
          <PageCard>
            <SectionHeader
              title="Ca làm việc hôm nay"
              action={
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {todayFormatted}
                </span>
              }
            />

            <div className="space-y-2.5">
              {/* Check-in row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Giờ Vào</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-foreground">
                    {shiftInfo.checkInTime}
                  </span>
                  <StatusPill label="Đã vào ca" variant="success" />
                </div>
              </div>

              {/* Check-out row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Giờ Ra</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-foreground">
                    {shiftInfo.checkOutTime}
                  </span>
                  <StatusPill label="Về sớm 233ph" variant="danger" />
                  <StatusPill label={shiftInfo.status} variant="neutral" />
                </div>
              </div>

              {/* Hours worked progress */}
              <div className="pt-2 border-t border-border/40">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-1.5">
                  <span>Giờ Làm</span>
                  <span className="font-mono font-bold text-foreground">
                    {shiftInfo.hoursWorked} / {shiftInfo.totalHours}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${shiftInfo.progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </PageCard>

          {/* Attendance Stats */}
          <AttendanceStats />
        </div>

        {/* Right column — tasks & weekly calendar */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-8 space-y-4">
          <WorkSchedule />
        </div>
      </div>
    </div>
  )
}
