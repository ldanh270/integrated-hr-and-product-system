import { SCHEDULE_INSIGHTS } from "@/configs/entities/attendance.config.ts"
import type { IAttendanceRepository } from "@/types/attendance.types.ts"
import type {
  IScheduleInsightsResult,
  IScheduleInsightsService,
  IShiftScheduleRepository,
  ISimulateWeeklyTemplateDraft,
  ISimulateWeeklyTemplateResult,
  ISuggestWeeklyTemplatesResult,
  IWorkingShiftRepository,
} from "@/types/shift.types.ts"
import {
  buildScheduleInsights,
  buildSuggestedWeeklyTemplates,
  normalizeScheduleDate,
  simulateWeeklyTemplateDraft,
} from "@/utils/schedule.util.ts"

/** Weekly Schedule Copilot: insights + template suggest + what-if simulate. */
export class ScheduleInsightsService implements IScheduleInsightsService {
  constructor(
    private scheduleRepo: IShiftScheduleRepository,
    private attendanceRepo: IAttendanceRepository,
    private workingShiftRepo: IWorkingShiftRepository,
  ) {}

  async getInsights(lookbackDays?: number): Promise<IScheduleInsightsResult> {
    const days = clampLookbackDays(lookbackDays)
    const periodEnd = normalizeScheduleDate(new Date())
    const periodStart = normalizeScheduleDate(new Date())
    periodStart.setDate(periodStart.getDate() - days)

    const employeeIds = await this.scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule(periodEnd)

    if (employeeIds.length === 0) {
      return buildScheduleInsights({
        lookbackDays: days,
        periodStart,
        periodEnd,
        employeeCount: 0,
        records: [],
      })
    }

    const records = await this.attendanceRepo.queryRecords({
      employeeIds,
      startDate: periodStart.toISOString(),
      endDate: periodEnd.toISOString(),
    })

    return buildScheduleInsights({
      lookbackDays: days,
      periodStart,
      periodEnd,
      employeeCount: employeeIds.length,
      records,
    })
  }

  async suggestTemplates(lookbackDays?: number): Promise<ISuggestWeeklyTemplatesResult> {
    const insights = await this.getInsights(lookbackDays)
    const shifts = await this.workingShiftRepo.listAll()
    return buildSuggestedWeeklyTemplates({
      insights,
      shifts: shifts.map((shift) => ({
        id: shift.id,
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        isActive: shift.isActive,
      })),
    })
  }

  async simulateTemplate(draft: ISimulateWeeklyTemplateDraft): Promise<ISimulateWeeklyTemplateResult> {
    const insights = await this.getInsights(draft.lookbackDays)
    const shifts = await this.workingShiftRepo.listAll()
    const shiftNamesById = new Map(shifts.map((shift) => [shift.id, shift.name]))
    return simulateWeeklyTemplateDraft({ draft, insights, shiftNamesById })
  }
}

function clampLookbackDays(value?: number): number {
  if (value === undefined || Number.isNaN(value)) {
    return SCHEDULE_INSIGHTS.DEFAULT_LOOKBACK_DAYS
  }
  return Math.min(
    SCHEDULE_INSIGHTS.MAX_LOOKBACK_DAYS,
    Math.max(SCHEDULE_INSIGHTS.MIN_LOOKBACK_DAYS, Math.floor(value)),
  )
}
