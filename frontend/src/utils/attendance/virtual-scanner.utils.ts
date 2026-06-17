import { ATTENDANCE_TIME_RULES } from "@/config/rules/attendance.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import type { IAttendanceRecord, IWorkingShift } from "@/types/attendance.types"
import { formatDateParam } from "@/utils/attendance/format-date-param"
import { minutesToDayTime } from "@/utils/attendance/minutes-to-day-time"

const LOCATION_CACHE_TTL_MS = 30 * 60 * 1000
export const GEOLOCATION_TIMEOUT_MS = 10_000

export type ScanAction = "check_in" | "check_out"

export interface TodayShiftInfo {
  name: string
  workWindow: string
  checkInWindow: string
  checkOutWindow: string
  gpsLabel: string
}

export function persistScannerLocation(location: { lat: number; lng: number }) {
  const data = JSON.stringify({ ...location, timestamp: Date.now() })
  localStorage.setItem(SYSTEM_CONFIG.STORAGE_KEYS.LOCATION_CACHE, btoa(data))
}

export function readCachedScannerLocation(): { lat: number; lng: number } | null {
  const cached = localStorage.getItem(SYSTEM_CONFIG.STORAGE_KEYS.LOCATION_CACHE)
  if (!cached) return null

  try {
    const decoded = atob(cached)
    const parsed = JSON.parse(decoded) as { lat: number; lng: number; timestamp?: number }
    if (Date.now() - (parsed.timestamp ?? 0) > LOCATION_CACHE_TTL_MS) {
      localStorage.removeItem(SYSTEM_CONFIG.STORAGE_KEYS.LOCATION_CACHE)
      return null
    }
    return { lat: parsed.lat, lng: parsed.lng }
  } catch {
    return null
  }
}

export function getScannerApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { error?: { message?: string } } } }
  return err.response?.data?.error?.message ?? fallback
}

export function buildTodayShiftInfo(scheduleShift?: Partial<IWorkingShift>): TodayShiftInfo | null {
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
    workWindow: `${minutesToDayTime(scheduleShift.startTime)} - ${minutesToDayTime(scheduleShift.endTime)}`,
    checkInWindow: `${minutesToDayTime(scheduleShift.startTime - gracePeriod)} - ${minutesToDayTime(scheduleShift.startTime + gracePeriod)}`,
    checkOutWindow: `Từ ${minutesToDayTime(scheduleShift.endTime - gracePeriod)}`,
    gpsLabel: hasGps
      ? `${scheduleShift.gpsRadiusMeters}m quanh ${scheduleShift.gpsLat?.toFixed(5)}, ${scheduleShift.gpsLng?.toFixed(5)}`
      : "Chưa cấu hình GPS",
  }
}

export function resolveNextScanAction(records?: IAttendanceRecord[]): ScanAction {
  const openRecord = records?.find((record) => record.checkInAt && !record.checkOutAt)
  if (openRecord) return "check_out"

  const todayKey = formatDateParam(new Date())
  const todayRecord = records?.find((record) => formatDateParam(new Date(record.date)) === todayKey)

  return todayRecord?.checkInAt ? "check_out" : "check_in"
}

export function getCurrentScannerLocation(): Promise<{ lat: number; lng: number }> {
  if (!("geolocation" in navigator)) {
    return Promise.reject(new Error("Geolocation is not supported"))
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      reject,
      { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 0 },
    )
  })
}
