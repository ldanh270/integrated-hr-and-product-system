/** Regression coverage for converting attendance timestamps to the configured local clock. */
import {
  getAttendanceClockMinutes,
  toAttendanceInstant,
} from "@/utils/attendance/attendance-time-zone.util.ts"

describe("attendance timezone utilities", () => {
  it("keeps an 08:00 Vietnam shift at 08:00 after database serialization", () => {
    const instant = toAttendanceInstant(new Date("2026-07-13T00:00:00.000Z"), 8 * 60)

    expect(instant.toISOString()).toBe("2026-07-13T01:00:00.000Z")
    expect(getAttendanceClockMinutes(instant)).toBe(8 * 60)
  })

  it("preserves late minutes in the attendance timezone", () => {
    const instant = toAttendanceInstant(new Date("2026-07-13T00:00:00.000Z"), 8 * 60 + 15)

    expect(getAttendanceClockMinutes(instant) - 8 * 60).toBe(15)
  })
})
