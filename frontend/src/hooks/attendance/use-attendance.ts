import { attendanceApi } from "@/lib/api/attendance.api"
import type { IAttendanceMatrixQuery, IAttendanceQuery } from "@/types/attendance.types"

import { useQuery } from "@tanstack/react-query"

export const ATTENDANCE_KEY = ["attendance"] as const

/** Loads attendance records for summaries and personal history. */
export function useAttendanceRecords(query?: IAttendanceQuery) {
  return useQuery({
    queryKey: [...ATTENDANCE_KEY, query],
    queryFn: () => attendanceApi.getRecords(query),
  })
}

/** Loads the admin workforce matrix for one anchored week or month. */
export function useAttendanceMatrix(query: IAttendanceMatrixQuery) {
  return useQuery({
    queryKey: [...ATTENDANCE_KEY, "matrix", query],
    queryFn: () => attendanceApi.getMatrix(query),
  })
}
