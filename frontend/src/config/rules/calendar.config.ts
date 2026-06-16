export const CALENDAR_WEEK_DAY_COUNT = 7

export const CALENDAR_START_HOUR = 6

export const CALENDAR_END_HOUR = 24

export const CALENDAR_HOURS = Array.from(
  { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1 },
  (_, index) => CALENDAR_START_HOUR + index,
)

export type CalendarTab = "planned" | "actual"
