import { test, expect } from "@playwright/test"
import { loginAs } from "./helpers/auth"

test.describe("Part-time spent time approval", () => {
  test("team leader can open project spent time tab and approve a pending log", async ({ page }) => {
    await loginAs(page, "team_leader")

    await page.goto("/project/list")
    await expect(page.getByRole("heading", { name: "Danh sách dự án" })).toBeVisible({
      timeout: 10000,
    })

    const projectLink = page.locator('table a[href^="/project/"]').first()
    await expect(projectLink).toBeVisible({ timeout: 10000 })
    await projectLink.click()

    await expect(page.getByRole("tab", { name: /Giờ làm việc|Spent Time/i })).toBeVisible({
      timeout: 10000,
    })
    await page.getByRole("tab", { name: /Giờ làm việc|Spent Time/i }).click()

    await expect(page.getByRole("heading", { name: /Duyệt giờ làm việc/i })).toBeVisible()

    const pendingFilter = page.getByRole("button", { name: "Chờ duyệt" })
    if (await pendingFilter.isVisible()) {
      await pendingFilter.click()
    }

    const approveButton = page.getByTitle("Duyệt").first()
    if (await approveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await approveButton.click()
      await expect(page.getByText("Đã duyệt giờ làm việc")).toBeVisible({ timeout: 10000 })
    } else {
      await expect(page.getByText("Không có bản ghi giờ làm việc nào.")).toBeVisible()
    }
  })

  test("part-time account can access project module after login", async ({ page }) => {
    await loginAs(page, "part_time")
    await page.goto("/project/list")
    await expect(page).toHaveURL(/\/project\/list/)
  })
})
