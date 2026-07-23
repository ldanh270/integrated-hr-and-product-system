/**
 * Weekly cron for Capacity Copilot snapshots.
 * It refreshes project forecasts in the background so Admin/PM does not have to click through projects.
 */
import { CAPACITY_COPILOT_RULES } from "@/configs/rules/capacity-copilot.config.ts"
import { capacityCopilotService } from "@/libs/capacity-copilot-runtime.ts"

import cron from "node-cron"

let lastRunWeekKey: string | null = null

/** Formats a local calendar date without converting it through UTC and shifting the selected week. */
const formatDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Normalizes any local date to Monday 00:00 of the same business week. */
const getWeekStart = (date: Date): Date => {
  const weekStart = new Date(date)
  const day = weekStart.getDay()
  const diff = day === 0 ? -CAPACITY_COPILOT_RULES.DAYS_PER_WEEK + 1 : 1 - day
  weekStart.setDate(weekStart.getDate() + diff)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

/**
 * Registers the weekly background refresh.
 * The scheduler polls every minute, but the weekday/time guard performs only one forecast per week
 * for each server process. Forecasts remain advisory and never assign employees automatically.
 */
export const initCapacityCopilotCron = () => {
  // Run every minute to reuse the existing project cron style, then gate by configured weekday/time.
  cron.schedule(CAPACITY_COPILOT_RULES.CRON_POLL_EXPRESSION, async () => {
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
      // Process-local idempotency prevents duplicate refreshes when the callback fires twice in one week.
      // A restart may run it again, which is safe because forecasting does not mutate project staffing.
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
