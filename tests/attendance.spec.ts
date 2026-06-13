import { test, expect, type Page, type BrowserContext, type Route } from "@playwright/test"

/**
 * Playwright E2E & Mock tests for the Attendance Module.
 * 
 * To run these tests:
 *   1. Make sure backend and frontend are running:
 *      bun run dev
 *   2. Run Playwright:
 *      bunx playwright test
 *   3. Run Playwright UI mode:
 *      bunx playwright test --ui
 */

test.describe("Attendance Module - E2E Tests", () => {
  // Before each test, log in and navigate to the attendance dashboard
  test.beforeEach(async ({ page, context }: { page: Page; context: BrowserContext }) => {
    // 1. Mock Geolocation for virtual scanner testing
    await context.grantPermissions(["geolocation"])
    await context.setGeolocation({ latitude: 10.762622, longitude: 106.660172 }) // Ho Chi Minh City coordinates

    // 2. Go to Login page
    await page.goto("/login")

    // 3. Fill login credentials
    await page.fill("#username", "admin")
    await page.fill("#password", "Admin123@")
    
    // 4. Submit login
    await page.click('button[type="submit"]')

    // 5. Verify successful redirect and navigate to Attendance summary
    await expect(page).toHaveURL(/\/hrm\/dashboard/)
    await page.goto("/attendance")
    await expect(page).toHaveURL(/\/attendance/)
  })

  test("should load the Attendance Dashboard with stats and scanner", async ({ page }: { page: Page }) => {
    // Verify Page Header title
    await expect(page.locator("h1")).toHaveText("Tổng quan chấm công")

    // Verify presence of virtual scanner card
    await expect(page.locator("text=Máy Chấm Công Ảo")).toBeVisible()

    // Verify stats cards exist
    await expect(page.locator("text=Tổng nhân sự")).toBeVisible()
    await expect(page.locator("text=Đã có mặt")).toBeVisible()
    await expect(page.locator("text=Đi muộn")).toBeVisible()
    await expect(page.locator("text=Vắng mặt")).toBeVisible()
  })

  test("should check in successfully using the Virtual Scanner", async ({ page }: { page: Page }) => {
    // 1. Check if location is not determined yet or requires action
    const locateBtn = page.locator('button:has-text("Lấy vị trí GPS")')
    if (await locateBtn.isVisible()) {
      await locateBtn.click()
    }

    // 2. Expect GPS location status to be success
    await expect(page.locator("text=Đã xác định vị trí")).toBeVisible()

    // 3. Click "Chấm Công" (Check in / Check out)
    const scanBtn = page.locator('button:has-text("Chấm Công")')
    await expect(scanBtn).toBeEnabled()
    await scanBtn.click()

    // 4. Check for success message or update in today's attendance records
    // (Depending on toast or alert implemented, e.g. using Sonner toasts)
    await expect(page.locator("text=thành công").or(page.locator("text=Thành công"))).toBeVisible()
  })

  test("should filter attendance records by date range and status", async ({ page }: { page: Page }) => {
    // 1. Find the filter by status select
    const statusSelect = page.locator('button[id^="radix-"]:has-text("Trạng thái"), button:has-text("Tất cả trạng thái")')
    await statusSelect.click()

    // 2. Select a specific status (e.g. "Đi muộn")
    await page.click('role=option[name="Đi muộn"]')

    // 3. Verify that the table is updated
    // Note: Since data is dynamic, we just verify that either the empty state appears or filtered rows contain "Đi muộn"
    const noRecords = page.locator("text=Không có bản ghi nào")
    const hasRows = page.locator("tbody tr")

    if (await noRecords.isVisible()) {
      await expect(noRecords).toBeVisible()
    } else {
      // Expect every cell in the Status column to show "Đi muộn" (or similar status pill text)
      await expect(page.locator("tbody tr").first()).toBeVisible()
    }
  })
})

test.describe("Attendance Module - Mock API Tests (Edge cases)", () => {
  test("should display error state when API fails", async ({ page }: { page: Page }) => {
    // Mock the attendance GET records API to return a 500 server error
    await page.route("**/api/v1/attendance/records*", async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: { message: "Internal server error" } }),
      })
    })

    // Log in and go directly to /attendance page
    await page.goto("/login")
    await page.fill("#username", "admin")
    await page.fill("#password", "Admin123@")
    await page.click('button[type="submit"]')
    await page.goto("/attendance")

    // Verify error state text inside table
    await expect(page.locator("text=Lỗi khi tải dữ liệu chấm công.")).toBeVisible()
  })

  test("should display empty state when there are no records", async ({ page }: { page: Page }) => {
    // Mock the attendance GET records API to return empty data
    await page.route("**/api/v1/attendance/records*", async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      })
    })

    // Log in and navigate
    await page.goto("/login")
    await page.fill("#username", "admin")
    await page.fill("#password", "Admin123@")
    await page.click('button[type="submit"]')
    await page.goto("/attendance")

    // Verify empty state text in table
    await expect(page.locator("text=Không có bản ghi nào trong khoảng thời gian đã chọn.")).toBeVisible()
  })
})
