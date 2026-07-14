import { PART_TIME_SHIFT_SUGGEST } from "@/configs/entities/part-time-availability.config.ts"
import type { IAttendanceRepository } from "@/types/attendance.types.ts"
import type {
  IPartTimeAvailabilityService,
  IPtShiftSuggestionService,
  ISuggestPartTimeShiftsResult,
} from "@/types/part-time-availability.types.ts"
import { buildPartTimeShiftSuggestions } from "@/utils/part-time-availability/build-part-time-shift-suggestions.util.ts"
import {
  scorePartTimeReliability,
  type IPartTimeReliabilityScore,
} from "@/utils/part-time-availability/score-part-time-reliability.util.ts"
import { normalizeWeekStart } from "@/utils/part-time-availability.util.ts"
import { formatScheduleDateKey } from "@/utils/schedule.util.ts"

const NEUTRAL_RELIABILITY: IPartTimeReliabilityScore = {
  score: PART_TIME_SHIFT_SUGGEST.NEUTRAL_SCORE,
  reasons: ["Chưa có lịch sử chấm công — điểm trung lập"],
}

/** Suggests PT shift assignments from free slots + attendance reliability — does not persist. */
export class PtShiftSuggestionService implements IPtShiftSuggestionService {
  constructor(
    private availabilityService: IPartTimeAvailabilityService,
    private attendanceRepo: IAttendanceRepository,
  ) {}

  async suggest(weekStart: string): Promise<ISuggestPartTimeShiftsResult> {
    const weekStartKey = formatScheduleDateKey(normalizeWeekStart(weekStart))
    const availabilities = await this.availabilityService.listForWeek(weekStartKey)

    const employeeIds = [...new Set(availabilities.map((item) => item.employeeId))]
    const scoresByEmployeeId = new Map<string, IPartTimeReliabilityScore>(
      employeeIds.map((employeeId) => [employeeId, NEUTRAL_RELIABILITY]),
    )

    if (employeeIds.length > 0) {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - PART_TIME_SHIFT_SUGGEST.LOOKBACK_DAYS)

      const records = await this.attendanceRepo.queryRecords({
        employeeIds,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      const recordsByEmployee = new Map<string, typeof records>()
      for (const record of records) {
        const list = recordsByEmployee.get(record.employeeId) ?? []
        list.push(record)
        recordsByEmployee.set(record.employeeId, list)
      }

      for (const employeeId of employeeIds) {
        scoresByEmployeeId.set(
          employeeId,
          scorePartTimeReliability(recordsByEmployee.get(employeeId) ?? []),
        )
      }
    }

    return buildPartTimeShiftSuggestions({
      weekStart: weekStartKey,
      availabilities,
      scoresByEmployeeId,
    })
  }
}
