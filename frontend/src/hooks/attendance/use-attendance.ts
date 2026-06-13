import { attendanceApi } from "@/lib/api/attendance.api"
import type { IAttendanceQuery } from "@/types/attendance.types"

import { useQuery } from "@tanstack/react-query"

export const ATTENDANCE_KEY = ["attendance"] as const

export function useAttendanceRecords(query?: IAttendanceQuery) {
  return useQuery({
    queryKey: [...ATTENDANCE_KEY, query],
    queryFn: () => attendanceApi.getRecords(query),
  })
}
