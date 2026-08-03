import type { IAttendanceRecordDTO, IAttendanceShiftDTO } from "@/types/attendance.types.ts"
import { isBeforeCheckOutWindow } from "@/utils/attendance/attendance-shift.util.ts"

function attendanceInstant(
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute = 0,
) {
  return new Date(Date.UTC(year, monthIndex, day, hour - 7, minute))
}

const record = {
  id: "attendance-1",
  employeeId: "employee-1",
  employeeShiftId: "employee-shift-1",
  date: new Date(Date.UTC(2026, 7, 2)),
  checkInAt: attendanceInstant(2026, 7, 2, 8),
  checkOutAt: null,
} as IAttendanceRecordDTO

const shift = {
  startTime: 8 * 60,
  endTime: 17 * 60,
  gracePeriodMinutes: 15,
} satisfies IAttendanceShiftDTO

describe("attendance shift checkout window", () => {
  it("requires the scheduled shift end time before checkout opens", () => {
    expect(isBeforeCheckOutWindow(attendanceInstant(2026, 7, 2, 16, 45), record, shift)).toBe(true)
    expect(isBeforeCheckOutWindow(attendanceInstant(2026, 7, 2, 17), record, shift)).toBe(false)
  })
})
