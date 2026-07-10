import { ATTENDANCE_GPS_RULES } from "@/configs/rules/attendance.config.ts"
import { ATTENDANCE_ERROR_MESSAGES } from "@/configs/messages/attendance.message.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { ATTENDANCE_LAYERS } from "@/constants/attendance.constants.ts"
import type { IAttendanceShiftDTO } from "@/types/attendance.types.ts"
import { AppError } from "@/utils/error.util.ts"

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / ATTENDANCE_GPS_RULES.DEGREES_TO_RADIANS_DIVISOR
}

function getDistanceMeters(
  first: { lat: number; lng: number },
  second: { lat: number; lng: number },
): number {
  const latDelta = toRadians(second.lat - first.lat)
  const lngDelta = toRadians(second.lng - first.lng)
  const firstLat = toRadians(first.lat)
  const secondLat = toRadians(second.lat)
  const chord =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lngDelta / 2) ** 2

  return (
    ATTENDANCE_GPS_RULES.EARTH_RADIUS_METERS *
    2 *
    Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord))
  )
}

/** Rejects check-in/out when client GPS is outside the shift geofence; no-op when shift has no GPS config. */
export function assertWithinShiftGps(
  location: { lat: number; lng: number },
  shift: IAttendanceShiftDTO | null | undefined,
): void {
  if (!shift || shift.gpsLat == null || shift.gpsLng == null || shift.gpsRadiusMeters == null) {
    return
  }

  const distanceMeters = getDistanceMeters(location, {
    lat: shift.gpsLat,
    lng: shift.gpsLng,
  })

  if (distanceMeters > shift.gpsRadiusMeters) {
    throw new AppError(
      ATTENDANCE_ERROR_MESSAGES.OUTSIDE_GPS_RADIUS,
      HttpStatusCode.BAD_REQUEST,
      ATTENDANCE_LAYERS.SERVICE,
    )
  }
}
