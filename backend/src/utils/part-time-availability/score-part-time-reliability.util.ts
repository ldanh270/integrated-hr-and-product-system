/**
 * Pure attendance-history scorer used as one factor in part-time shift suggestions.
 * Keeping this calculation isolated makes its fallback and clamping behavior testable.
 */
import { ATTENDANCE_STATUS } from "@/configs/entities/attendance.config.ts"
import { PART_TIME_SHIFT_SUGGEST } from "@/configs/entities/part-time-availability.config.ts"
import type { IAttendanceRecordDTO } from "@/types/attendance.types.ts"

export interface IPartTimeReliabilityScore {
  score: number
  reasons: string[]
}

/**
 * Scores PT reliability from attendance history (0–100).
 * Neutral score when no records — avoids punishing new employees.
 */
export function scorePartTimeReliability(
  records: Array<Pick<IAttendanceRecordDTO, "status" | "lateMinutes">>,
): IPartTimeReliabilityScore {
  if (records.length === 0) {
    return {
      score: PART_TIME_SHIFT_SUGGEST.NEUTRAL_SCORE,
      reasons: ["Chưa có lịch sử chấm công — điểm trung lập"],
    }
  }

  const presentStatuses = new Set<string>([
    ATTENDANCE_STATUS.ON_TIME,
    ATTENDANCE_STATUS.LATE,
    ATTENDANCE_STATUS.EARLY_LEAVE,
    ATTENDANCE_STATUS.OVERTIME,
  ])

  let presentCount = 0
  let lateCount = 0
  let absentCount = 0
  let lateMinutesSum = 0

  for (const record of records) {
    if (record.status === ATTENDANCE_STATUS.ABSENT) {
      absentCount++
      continue
    }
    if (presentStatuses.has(record.status)) {
      presentCount++
      if (record.status === ATTENDANCE_STATUS.LATE || record.lateMinutes > 0) {
        lateCount++
        lateMinutesSum += record.lateMinutes
      }
    }
  }

  const total = records.length
  const attendanceRate = presentCount / total
  const avgLateMinutes = lateCount > 0 ? lateMinutesSum / lateCount : 0
  const latePenaltyRatio = Math.min(
    1,
    avgLateMinutes / PART_TIME_SHIFT_SUGGEST.LATE_PENALTY_CAP_MINUTES,
  )

  const rawScore =
    attendanceRate * PART_TIME_SHIFT_SUGGEST.WEIGHT_ATTENDANCE_RATE +
    (1 - latePenaltyRatio) * PART_TIME_SHIFT_SUGGEST.WEIGHT_LATE_PENALTY

  const score = Math.round(Math.max(0, Math.min(100, rawScore)))

  const reasons: string[] = [
    `Có mặt ${Math.round(attendanceRate * 100)}% (${presentCount}/${total} ngày)`,
  ]
  if (lateCount > 0) {
    reasons.push(`Đi muộn ${lateCount} lần, TB ${Math.round(avgLateMinutes)} phút`)
  } else {
    reasons.push("Không ghi nhận đi muộn")
  }
  if (absentCount > 0) {
    reasons.push(`Vắng ${absentCount} ngày`)
  }

  return { score, reasons }
}
