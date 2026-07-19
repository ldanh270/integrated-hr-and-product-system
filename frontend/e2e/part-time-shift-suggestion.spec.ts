import { expect, test } from "@playwright/test"

const AUTH_STATE = {
  state: {
    user: {
      id: "admin-id",
      email: "admin@example.com",
      fullName: "Admin User",
      roles: ["admin"],
      permissions: ["attendance.read", "attendance.update"],
    },
    isAuthenticated: true,
  },
  version: 0,
}

test("V7 reviews team matrix and explicitly confirms selected suggestions", async ({ page }) => {
  await page.addInitScript((authState) => {
    window.localStorage.setItem("auth-storage", JSON.stringify(authState))
  }, AUTH_STATE)
  await page.route("**/api/**", async (route) => {
    if (new URL(route.request().url()).pathname === "/api/auth/me") {
      await route.fulfill({ json: { data: { employee: AUTH_STATE.state.user }, error: null } })
      return
    }
    await route.fulfill({ json: { data: null, error: null } })
  })
  await page.route("**/api/part-time-availabilities?**", async (route) => {
    await route.fulfill({
      json: {
        data: [
          {
            id: "availability-1",
            employeeId: "employee-1",
            weekStart: "2026-07-20",
            status: "submitted",
            note: null,
            submittedAt: null,
            reviewedById: null,
            reviewedAt: null,
            rejectReason: null,
            createdAt: "2026-07-18",
            updatedAt: "2026-07-18",
            days: [
              {
                dayOfWeek: 1,
                isBusyAllDay: false,
                slots: [{ startTime: 480, endTime: 720, sortOrder: 0 }],
              },
            ],
            employee: {
              id: "employee-1",
              fullName: "Lan",
              email: "lan@example.com",
              employeeType: "part_time",
            },
          },
        ],
        error: null,
      },
    })
  })
  await page.route("**/api/part-time-availabilities/suggest", async (route) => {
    await expect.poll(async () => (await route.request().postDataJSON()).weekStart).toBeTruthy()
    await route.fulfill({
      json: {
        data: {
          weekStart: "2026-07-20",
          suggestions: [
            {
              availabilityId: "availability-1",
              employeeId: "employee-1",
              employeeName: "Lan",
              score: 95,
              reasons: ["Có mặt 100%"],
              assignments: [
                {
                  shiftId: "morning",
                  shiftName: "Ca sáng",
                  dayOfWeek: 1,
                  startTime: "08:00",
                  endTime: "12:00",
                },
              ],
            },
          ],
          coverage: [
            {
              shiftId: "morning",
              shiftName: "Ca sáng",
              dayOfWeek: 1,
              startTime: "08:00",
              endTime: "12:00",
              requiredCount: 1,
              assignedCount: 1,
              coverageScore: 100,
            },
          ],
          unassignedGaps: [],
        },
        error: null,
      },
    })
  })

  let confirmBody: Record<string, unknown> | null = null
  await page.route(
    "**/api/part-time-availabilities/availability-1/assign-shifts",
    async (route) => {
      confirmBody = await route.request().postDataJSON()
      await route.fulfill({ json: { data: { assigned: 1, skipped: 0 }, error: null } })
    },
  )

  await page.goto("/attendance/part-time-availability")
  await page.getByRole("button", { name: "Gợi ý xếp ca" }).click()
  await expect(page.getByTestId("pt-suggestion-matrix")).toBeVisible()
  await expect(page.getByText("T2 Ca sáng: 1/1")).toBeVisible()
  await page.getByTestId("confirm-selected-suggestions").click()
  await expect.poll(() => confirmBody).toMatchObject({ suggestionDecision: "accepted" })
})
