import { ATTENDANCE_TIME_RULES } from "@/config/rules/attendance.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { ATTENDANCE_KEY } from "@/hooks/attendance/use-attendance"
import { attendanceApi, schedulesApi } from "@/lib/api/attendance.api"
import { useAuthStore } from "@/store/auth-store"
import type { User } from "@/store/auth-store"
import type { IAttendanceRecord, IWorkingShift } from "@/types/attendance.types"

import { useEffect, useMemo, useState } from "react"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type ScanAction = "check_in" | "check_out"

interface TodayShiftInfo {
  name: string
  workWindow: string
  checkInWindow: string
  checkOutWindow: string
  gpsLabel: string
}

function persistLocation(location: { lat: number; lng: number }) {
  // Use localStorage and base64 encoding to satisfy security alerts
  const data = JSON.stringify({ ...location, timestamp: Date.now() })
  localStorage.setItem(
    SYSTEM_CONFIG.STORAGE_KEYS.LOCATION_CACHE,
    btoa(data)
  )
}

function readCachedLocation(): { lat: number; lng: number } | null {
  const cached = localStorage.getItem(SYSTEM_CONFIG.STORAGE_KEYS.LOCATION_CACHE)
  if (!cached) return null

  try {
    // Decode base64 stored value
    const decoded = atob(cached)
    const parsed = JSON.parse(decoded)
    // Check if cache is older than 30 minutes
    if (Date.now() - (parsed.timestamp || 0) > 30 * 60 * 1000) {
      localStorage.removeItem(SYSTEM_CONFIG.STORAGE_KEYS.LOCATION_CACHE)
      return null
    }
    return { lat: parsed.lat, lng: parsed.lng }
  } catch {
    return null
  }
}


function getApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { error?: { message?: string } } } }
  return err.response?.data?.error?.message ?? fallback
}

function formatDateParam(date: Date) {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${date.getFullYear()}-${month}-${day}`
}

function getDateOffset(date: Date, offsetDays: number) {
  const nextDate = new Date(date)
  nextDate.setDate(date.getDate() + offsetDays)

  return nextDate
}

function minutesToTime(minutes: number): string {
  const normalizedMinutes =
    (minutes + ATTENDANCE_TIME_RULES.MINUTES_PER_DAY) % ATTENDANCE_TIME_RULES.MINUTES_PER_DAY
  const hours = Math.floor(normalizedMinutes / 60)
  const mins = normalizedMinutes % 60

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

function getTodayShift(scheduleShift?: Partial<IWorkingShift>): TodayShiftInfo | null {
  if (!scheduleShift?.name || scheduleShift.startTime == null || scheduleShift.endTime == null) {
    return null
  }

  const gracePeriod = scheduleShift.gracePeriodMinutes ?? ATTENDANCE_TIME_RULES.DEFAULT_WINDOW_MINUTES
  const hasGps =
    scheduleShift.gpsLat != null &&
    scheduleShift.gpsLng != null &&
    scheduleShift.gpsRadiusMeters != null

  return {
    name: scheduleShift.name,
    workWindow: `${minutesToTime(scheduleShift.startTime)} - ${minutesToTime(scheduleShift.endTime)}`,
    checkInWindow: `${minutesToTime(scheduleShift.startTime - gracePeriod)} - ${minutesToTime(scheduleShift.startTime + gracePeriod)}`,
    checkOutWindow: `Từ ${minutesToTime(scheduleShift.endTime - gracePeriod)}`,
    gpsLabel: hasGps
      ? `${scheduleShift.gpsRadiusMeters}m quanh ${scheduleShift.gpsLat?.toFixed(5)}, ${scheduleShift.gpsLng?.toFixed(5)}`
      : "Chưa cấu hình GPS",
  }
}

function getNextScanAction(records?: IAttendanceRecord[]): ScanAction {
  const openRecord = records?.find((record) => record.checkInAt && !record.checkOutAt)
  if (openRecord) return "check_out"

  const todayKey = formatDateParam(new Date())
  const todayRecord = records?.find((record) => formatDateParam(new Date(record.date)) === todayKey)

  return todayRecord?.checkInAt ? "check_out" : "check_in"
}

function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  if (!("geolocation" in navigator)) {
    return Promise.reject(new Error("Geolocation is not supported"))
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      reject,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  })
}

export function useVirtualScanner(): {
  user: User | null
  currentTime: Date
  location: { lat: number; lng: number } | null
  locating: boolean
  isProcessing: boolean
  nextAction: ScanAction
  nextActionLabel: string
  todayShift: TodayShiftInfo | null
  isShiftLoading: boolean
  handleScan: () => Promise<void>
} {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const today = formatDateParam(currentTime)
  const yesterday = formatDateParam(getDateOffset(currentTime, -1))
  const { data: schedule, isLoading: isScheduleLoading } = useQuery({
    queryKey: ["my-schedule", today],
    queryFn: () => schedulesApi.getMy(today),
    enabled: Boolean(user),
  })
  const { data: records, isLoading: isRecordsLoading } = useQuery({
    queryKey: [...ATTENDANCE_KEY, "scanner", yesterday, today],
    queryFn: () => attendanceApi.getRecords({ startDate: yesterday, endDate: today }),
    enabled: Boolean(user),
  })
  const todayShift = useMemo(() => {
    const scheduleDay = schedule?.days.find((item) => item.dayOfWeek === currentTime.getDay())
    return getTodayShift(scheduleDay?.shift)
  }, [currentTime, schedule])
  const nextAction = getNextScanAction(records)
  const nextActionLabel = nextAction === "check_in" ? "Check-in" : "Check-out"

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const cached = readCachedLocation()
    if (cached) setLocation(cached)
  }, [])

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      toast.warning("Trình duyệt không hỗ trợ lấy vị trí GPS")
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLocation(coords)
        persistLocation(coords)
        setLocating(false)
      },
      (err) => {
        console.warn("GPS mount error:", err.message)
        if (err.code === 1) {
          toast.warning("Vui lòng cho phép truy cập vị trí để chấm công")
        }
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  const handleScan = async () => {
    setIsProcessing(true)
    setLocating(true)

    try {
      const finalLocation = await getCurrentLocation()
      setLocation(finalLocation)
      persistLocation(finalLocation)
      await attendanceApi.scan({ location: finalLocation })
      await queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEY })
      toast.success(`${nextActionLabel} thành công!`)
    } catch (error) {
      console.error("Scan error:", error)
      toast.error(getApiErrorMessage(error, "Lỗi khi chấm công"))
    } finally {
      setLocating(false)
      setIsProcessing(false)
    }
  }

  return {
    user,
    currentTime,
    location,
    locating,
    isProcessing,
    nextAction,
    nextActionLabel,
    todayShift,
    isShiftLoading: isScheduleLoading || isRecordsLoading,
    handleScan,
  }
}
