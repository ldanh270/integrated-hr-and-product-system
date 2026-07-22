/**
 * Request validation for project forecasts and the weekly capacity board.
 * The client selects only the week/lookback window; the committed target comes from Project deal data.
 */
import { CAPACITY_COPILOT_RULES } from "@/configs/rules/capacity-copilot.config.ts"

import { z } from "zod"

// Only forecast window is user-supplied; target percent is read from the project deal.
export const forecastProjectCapacitySchema = z
  .object({
    weekStart: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), "weekStart không hợp lệ"),
    lookbackWeeks: z
      .number()
      .int()
      .min(CAPACITY_COPILOT_RULES.MIN_LOOKBACK_WEEKS)
      .max(CAPACITY_COPILOT_RULES.MAX_LOOKBACK_WEEKS)
      .optional(),
  })
  .strict()

export type ForecastProjectCapacitySchemaType = z.infer<typeof forecastProjectCapacitySchema>

// Board endpoint uses query params because it is read-only and can reuse cron-refreshed snapshots.
export const forecastCapacityBoardQuerySchema = z
  .object({
    weekStart: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), "weekStart không hợp lệ"),
    lookbackWeeks: z.coerce
      .number()
      .int()
      .min(CAPACITY_COPILOT_RULES.MIN_LOOKBACK_WEEKS)
      .max(CAPACITY_COPILOT_RULES.MAX_LOOKBACK_WEEKS)
      .optional(),
  })
  .strict()
