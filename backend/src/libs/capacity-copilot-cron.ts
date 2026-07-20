/**
 * Weekly cron for Capacity Copilot snapshots.
 * It refreshes project forecasts in the background so Admin/PM does not have to click through projects.
 */
import { CAPACITY_COPILOT_RULES } from "@/configs/rules/capacity-copilot.config.ts"
import { capacityCopilotService } from "@/libs/capacity-copilot-runtime.ts"

import cron from "node-cron"

let lastRunWeekKey: string | null = null

const formatDateKey = (date: Date): string => date.toISOString().slice(0, 10)

const getWeekStart = (date: Date): Date => {
  const weekStart = new Date(date)
  const day = weekStart.getDay()
  const diff = day === 0 ? -CAPACITY_COPILOT_RULES.DAYS_PER_WEEK + 1 : 1 - day
  weekStart.setDate(weekStart.getDate() + diff)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

export const initCapacityCopilotCron = () => {
  // Run every minute to reuse the existing project cron style, then gate by configured weekday/time.
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date()
      if (
        now.getDay() !== CAPACITY_COPILOT_RULES.WEEKLY_CRON_DAY_OF_WEEK ||
        now.getHours() !== CAPACITY_COPILOT_RULES.WEEKLY_CRON_HOUR ||
        now.getMinutes() !== CAPACITY_COPILOT_RULES.WEEKLY_CRON_MINUTE
      ) {
        return
      }

      const weekStart = getWeekStart(now)
      const weekKey = formatDateKey(weekStart)
      // Prevent duplicate refreshes if the server clock or cron callback fires more than once that minute.
      if (lastRunWeekKey === weekKey) return

      const result = await capacityCopilotService.forecastCapacityBoard({
        weekStart: weekKey,
        lookbackWeeks: CAPACITY_COPILOT_RULES.DEFAULT_LOOKBACK_WEEKS,
      })
      lastRunWeekKey = weekKey

      console.log(
        `[CRON] Capacity Copilot refreshed for week ${result.weekStart}: projects=${result.projects.length}`,
      )
    } catch (error) {
      console.error("[CRON] Capacity Copilot weekly refresh failed:", error)
    }
  })

  console.log("[CRON] Capacity Copilot weekly forecast job scheduled.")
}
