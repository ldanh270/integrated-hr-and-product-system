export const ATTENDANCE_QUERY_PARAMS = {
  END_DATE: "endDate",
  EMPLOYEE_ID: "employeeId",
  STATUS: "status",
  START_DATE: "startDate",
  DATE: "date",
  PERSONAL_ONLY: "personalOnly",
  WEEK_START: "weekStart",
} as const

/** Query param name for weekStart on part-time availability API calls. */
export const PART_TIME_AVAILABILITY_QUERY_PARAMS = {
  /** ISO week-start date; all availability APIs are scoped to one calendar week. */
  WEEK_START: "weekStart",
} as const
