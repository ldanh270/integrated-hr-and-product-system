/** Regression coverage for keeping demo attendance assignments aligned with work schedules. */
import { buildDemoShiftSelections } from "@/scripts/attendance-demo-assignment.util.ts"

describe("attendance demo assignment resolver", () => {
  const monday = new Date("2026-07-13T00:00:00.000Z")

  it("uses the employee schedule shift for the selected date", () => {
    const selections = buildDemoShiftSelections(
      [{ id: "karla" }],
      [
        {
          id: "schedule-karla",
          employeeId: "karla",
          validFrom: new Date("2026-06-01T00:00:00.000Z"),
          validTo: null,
          cycleWeeks: 1,
          days: [{ dayOfWeek: 1, weekIndex: 0, shiftId: "afternoon-shift" }],
        },
      ],
      [monday],
      "morning-shift",
    )

    expect(selections[0]).toMatchObject({
      employeeId: "karla",
      shiftId: "afternoon-shift",
      scheduleId: "schedule-karla",
    })
  })

  it("uses the fallback shift when no employee schedule exists", () => {
    const selections = buildDemoShiftSelections(
      [{ id: "employee-without-schedule" }],
      [],
      [monday],
      "morning-shift",
    )

    expect(selections[0]?.shiftId).toBe("morning-shift")
  })
})
