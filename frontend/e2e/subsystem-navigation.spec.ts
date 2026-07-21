import { expect, test } from "@playwright/test"

const staleUser = {
  id: "part-time-user",
  email: "ldanh27@example.com",
  fullName: "Nguyen Van L Danh",
  roles: ["employee"],
  permissions: [],
}

const refreshedUser = {
  ...staleUser,
  permissions: ["attendance.read", "project.read", "task.read"],
}

/** Persisted permissions must never decide a subsystem destination after reload. */
test("V8 refreshes stale permissions before opening Attendance", async ({ page }) => {
  await page.addInitScript((user) => {
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 }),
    )
  }, staleUser)

  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === "/api/auth/me") {
      await route.fulfill({ json: { data: { employee: refreshedUser }, error: null } })
      return
    }
    if (url.pathname === "/api/profile/me") {
      await route.fulfill({
        json: {
          status: "success",
          data: { ...refreshedUser, employeeType: "full_time", workScheduleType: "part_time" },
        },
      })
      return
    }
    if (url.pathname === "/api/schedules/my/week") {
      await route.fulfill({ json: { data: { weekStart: "2026-07-13", days: [] }, error: null } })
      return
    }
    if (url.pathname === "/api/schedules/my") {
      await route.fulfill({ json: { data: null, error: null } })
      return
    }
    await route.fulfill({ json: { data: [], error: null } })
  })

  await page.goto("/personal/schedule")
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const auth = JSON.parse(localStorage.getItem("auth-storage") ?? "{}")
        return auth.state?.user?.permissions ?? []
      })
    })
    .toContain("attendance.read")
  await page.getByRole("button", { name: /HRP Platform/i }).click()
  await page.getByRole("menuitem", { name: "Chấm công" }).click()

  await expect(page).toHaveURL(/\/attendance\/summary$/)
})

/** Transient outages block content without converting a valid session into logout. */
test("V9 preserves identity and offers retry when authorization service fails", async ({
  page,
}) => {
  await page.addInitScript((user) => {
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 }),
    )
  }, refreshedUser)
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({ status: 503, json: { data: null, error: { message: "Unavailable" } } })
  })

  await page.goto("/personal/schedule")

  await expect(
    page.getByRole("heading", { name: "Không thể xác minh quyền truy cập" }),
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem("auth-storage") ?? "{}").state?.user?.id),
    )
    .toBe(refreshedUser.id)
})

/** Confirmed token rejection remains the only bootstrap path that clears identity. */
test("V9 clears expired session after confirmed unauthorized response", async ({ page }) => {
  await page.addInitScript((user) => {
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 }),
    )
  }, refreshedUser)
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({ status: 401, json: { data: null, error: { message: "Unauthorized" } } })
  })
  await page.route("**/api/auth/refresh", async (route) => {
    await route.fulfill({ status: 401, json: { data: null, error: { message: "Unauthorized" } } })
  })

  await page.goto("/personal/schedule")

  await expect(page).toHaveURL(/\/login$/)
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem("auth-storage") ?? "{}").state?.user),
    )
    .toBeNull()
})
