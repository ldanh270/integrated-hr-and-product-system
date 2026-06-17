import {
  WEEKLY_SCHEDULE_DEFAULTS,
  WEEKLY_SCHEDULE_SETTINGS_ID,
} from "@/configs/entities/attendance.config.ts"
import { prisma } from "@/libs/database.ts"
import { PrismaEmployeeShiftRepository } from "@/repositories/employee-shift.repository.ts"
import { PrismaShiftScheduleRepository } from "@/repositories/schedule.repository.ts"
import { ScheduleService } from "@/services/schedule.service.ts"
import { formatScheduleDateKey, normalizeScheduleDate } from "@/utils/schedule.util.ts"

import cron from "node-cron"

const scheduleRepo = new PrismaShiftScheduleRepository(prisma)
const employeeShiftRepo = new PrismaEmployeeShiftRepository(prisma)
const scheduleService = new ScheduleService(scheduleRepo, employeeShiftRepo)

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const initWeeklyScheduleCron = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const settings = await prisma.weeklyScheduleSettings.findUnique({
        where: { id: WEEKLY_SCHEDULE_SETTINGS_ID },
      })
      if (!settings) return

      const now = new Date()
      if (
        now.getDay() !== settings.triggerDayOfWeek ||
        now.getHours() !== settings.triggerHour ||
        now.getMinutes() !== settings.triggerMinute
      ) {
        return
      }

      const weekStart = normalizeScheduleDate(now)
      const weekKey = formatScheduleDateKey(weekStart)
      if (settings.lastGeneratedWeekKey === weekKey) return

      const employeeIds = await scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule(weekStart)
      const weekEnd = addDays(weekStart, 6)

      if (employeeIds.length > 0) {
        const result = await scheduleService.generateShifts({
          employeeIds,
          startDate: weekKey,
          endDate: formatScheduleDateKey(weekEnd),
          createdById: settings.updatedById,
        })
        console.log(
          `[CRON] Weekly shifts generated for week ${weekKey}: created=${result.created}, updated=${result.updated}, skipped=${result.skipped}`,
        )
      }

      await prisma.weeklyScheduleSettings.update({
        where: { id: WEEKLY_SCHEDULE_SETTINGS_ID },
        data: { lastGeneratedWeekKey: weekKey },
      })
    } catch (error) {
      console.error("[CRON] Error generating weekly shifts:", error)
    }
  })

  console.log("[CRON] Weekly schedule auto-generate job scheduled.")
}

export function getDefaultWeeklyScheduleSettings() {
  return {
    id: WEEKLY_SCHEDULE_SETTINGS_ID,
    triggerDayOfWeek: WEEKLY_SCHEDULE_DEFAULTS.TRIGGER_DAY_OF_WEEK,
    triggerHour: WEEKLY_SCHEDULE_DEFAULTS.TRIGGER_HOUR,
    triggerMinute: WEEKLY_SCHEDULE_DEFAULTS.TRIGGER_MINUTE,
    lastGeneratedWeekKey: null as string | null,
  }
}
