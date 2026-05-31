import { test, expect } from "@playwright/test"

test.describe("Authentication Flow", () => {
  test("should login successfully with valid credentials", async ({ page }) => {
    // 1. Navigate to login page
    await page.goto("/login")

    // 2. Fill credentials
    await page.fill('input[id="email"]', "admin@example.com")
    await page.fill('input[id="password"]', "Admin@123")

    // 3. Submit form
    await page.click('button[type="submit"]')

    // 4. Verify redirection to dashboard
    await expect(page).toHaveURL("/dashboard")
    await expect(page.locator("h1")).toContainText("Welcome back")
    await expect(page.locator("text=System Administrator")).toBeVisible()
  })

  test("should show error on invalid login", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[id="email"]', "wrong@example.com")
    await page.fill('input[id="password"]', "WrongPass123")
    await page.click('button[type="submit"]')

    // Verify error message
    await expect(page.locator("text=Invalid credentials")).toBeVisible()
  })

  test("should logout successfully", async ({ page }) => {
    // Login first
    await page.goto("/login")
    await page.fill('input[id="email"]', "admin@example.com")
    await page.fill('input[id="password"]', "Admin@123")
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL("/dashboard")

    // Click logout button in header
    await page.click('button[title="Logout"]')

    // Verify redirection back to login
    await expect(page).toHaveURL("/login")
    await expect(page.locator("text=Welcome Back")).toBeVisible()
  })

  test("should redirect unauthenticated user to login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL("/login")
  })
})
