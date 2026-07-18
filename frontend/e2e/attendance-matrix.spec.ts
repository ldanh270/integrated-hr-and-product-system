/** Browser coverage for attendance matrix authentication and week/month period controls. */
import { expect, test } from "@playwright/test"

const ATTENDANCE_ROUTE = "/attendance/dashboard"
const API_PATTERN = "**/api/**"
const MATRIX_API_PATTERN = "**/api/attendance/matrix**"
const ADMIN_AUTH_STATE = {
  state: {
    user: {
      id: "admin-id",
      email: "admin@example.com",
      fullName: "Admin User",
      roles: ["admin"],
      permissions: ["attendance.read"],
    },
    isAuthenticated: true,
  },
  version: 0,
}

/** Builds the smallest valid API response needed to exercise matrix period controls. */
function matrixResponse(view: "week" | "month", anchor: string) {
  return {
    data: {
      view,
      rangeStart: view === "month" ? `${anchor.slice(0, 7)}-01` : "2026-07-13",
      rangeEnd: view === "month" ? `${anchor.slice(0, 7)}-31` : "2026-07-19",
      employees: [],
    },
    error: null,
  }
}

test("switches between week and month selectors and sends the selected anchor", async ({
  page,
}) => {
  await page.addInitScript((authState) => {
    window.localStorage.setItem("auth-storage", JSON.stringify(authState))
  }, ADMIN_AUTH_STATE)

  // Keep layout/background requests from triggering the global 401 logout interceptor.
  await page.route(API_PATTERN, async (route) => {
    await route.fulfill({ json: { data: null, error: null } })
  })
  await page.route(MATRIX_API_PATTERN, async (route) => {
    const url = new URL(route.request().url())
    const view = url.searchParams.get("view") === "month" ? "month" : "week"
    const anchor = url.searchParams.get("anchor") ?? "2026-07-18"
    await route.fulfill({ json: matrixResponse(view, anchor) })
  })

  await page.goto(ATTENDANCE_ROUTE)
  await expect(page.getByRole("heading", { name: "Bảng chấm công" })).toBeVisible()
  await expect(page.getByLabel("Chọn ngày trong tuần")).toHaveAttribute("type", "date")

  await page.getByRole("button", { name: "Theo tháng" }).click()
  const monthPicker = page.getByLabel("Chọn tháng")
  await expect(monthPicker).toHaveAttribute("type", "month")
  await monthPicker.fill("2026-06")

  await expect.poll(() => page.url()).toContain(ATTENDANCE_ROUTE)
  await expect(page.getByText("Tháng 06/2026")).toBeVisible()
})
