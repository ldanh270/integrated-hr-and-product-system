import { ATTENDANCE_MESSAGES } from "@/config/messages/attendance.message"
import { MAP_INITIAL_CENTER } from "@/config/map.config"
import { ATTENDANCE_GPS_RULES, ATTENDANCE_TIME_RULES } from "@/config/rules/attendance.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import type { IAttendanceRecord, IWorkingShift } from "@/types/attendance.types"
import { minutesToDayTime } from "@/utils/attendance/minutes-to-day-time"

const LOCATION_CACHE_TTL_MS = 30 * 60 * 1000
const FPT_UNIVERSITY_DA_NANG_LOCATION = "Trường Đại học FPT Đà Nẵng"
const LOCATION_MATCH_PRECISION = 0.0001
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
    // Cached GPS is only a UI hint; each scan still requests a fresh browser position.
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
  const shiftName = scheduleShift?.name
  const startTime = scheduleShift?.startTime
  const endTime = scheduleShift?.endTime

  if (!shiftName || startTime == null || endTime == null) {
    return null
  }

  const gracePeriod = scheduleShift.gracePeriodMinutes ?? ATTENDANCE_TIME_RULES.DEFAULT_WINDOW_MINUTES
  const radius = scheduleShift.gpsRadiusMeters
  const lat = scheduleShift.gpsLat
  const lng = scheduleShift.gpsLng

  return {
    name: shiftName,
    workWindow: `${minutesToDayTime(startTime)} - ${minutesToDayTime(endTime)}`,
    checkInWindow: `${minutesToDayTime(startTime - gracePeriod)} - ${minutesToDayTime(startTime + gracePeriod)}`,
    checkOutWindow: `${ATTENDANCE_MESSAGES.SCANNER.CHECK_OUT_FROM} ${minutesToDayTime(endTime - gracePeriod)}`,
    gpsLabel: buildScannerGpsLabel(radius, lat, lng),
  }
}

function buildScannerGpsLabel(
  radius: number | null | undefined,
  lat: number | null | undefined,
  lng: number | null | undefined,
): string {
  const resolvedRadius = radius ?? ATTENDANCE_GPS_RULES.DEFAULT_RADIUS_METERS
  const resolvedLat = lat ?? MAP_INITIAL_CENTER.lat
  const resolvedLng = lng ?? MAP_INITIAL_CENTER.lng

  // Show the campus name for the configured default geofence; raw coordinates are only
  // useful for custom locations that HR deliberately configured.
  const locationName =
    Math.abs(resolvedLat - MAP_INITIAL_CENTER.lat) <= LOCATION_MATCH_PRECISION &&
    Math.abs(resolvedLng - MAP_INITIAL_CENTER.lng) <= LOCATION_MATCH_PRECISION
      ? FPT_UNIVERSITY_DA_NANG_LOCATION
      : ATTENDANCE_MESSAGES.SCANNER.GPS_COORDINATE_LABEL(resolvedLat, resolvedLng)

  return ATTENDANCE_MESSAGES.SCANNER.GPS_RADIUS_LABEL(resolvedRadius, locationName)
}

export function resolveNextScanAction(records?: IAttendanceRecord[]): ScanAction {
  // Only an open record flips the button to Checkout. Completed same-day records must not
  // trap the scanner in checkout mode after a successful checkout.
  const openRecord = records?.find((record) => record.checkInAt && !record.checkOutAt)
  if (openRecord) return "check_out"

  return "check_in"
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
