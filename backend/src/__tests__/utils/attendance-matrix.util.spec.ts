/** Regression coverage for attendance matrix period ranges and variance classification. */
import {
  ATTENDANCE_MATRIX_VIEW,
  CHECK_IN_VARIANCE_STATUS,
} from "@/configs/entities/attendance.config.ts"
import { ATTENDANCE_MATRIX_RULES } from "@/configs/rules/attendance.config.ts"
import {
  classifyCheckInVariance,
  resolveAttendanceMatrixRange,
} from "@/utils/attendance/attendance-matrix.util.ts"

describe("attendance matrix utilities", () => {
  it("resolves the full Monday-Sunday week containing the selected date", () => {
    expect(
      resolveAttendanceMatrixRange({
        view: ATTENDANCE_MATRIX_VIEW.WEEK,
        anchor: "2026-07-18",
      }),
    ).toEqual({ startDate: "2026-07-13", endDate: "2026-07-19" })
  })

  it("resolves the full calendar month containing the selected date", () => {
    expect(
      resolveAttendanceMatrixRange({
        view: ATTENDANCE_MATRIX_VIEW.MONTH,
        anchor: "2026-06-18",
      }),
    ).toEqual({ startDate: "2026-06-01", endDate: "2026-06-30" })
  })

  it("classifies check-in variance at the configured grace boundaries", () => {
    const grace = ATTENDANCE_MATRIX_RULES.CHECK_IN_GRACE_MINUTES

    expect(classifyCheckInVariance()).toBe(CHECK_IN_VARIANCE_STATUS.UNAVAILABLE)
    expect(classifyCheckInVariance(-grace - 1)).toBe(CHECK_IN_VARIANCE_STATUS.EARLY)
    expect(classifyCheckInVariance(grace)).toBe(CHECK_IN_VARIANCE_STATUS.ON_TIME)
    expect(classifyCheckInVariance(grace + 1)).toBe(CHECK_IN_VARIANCE_STATUS.LATE)
  })
})
