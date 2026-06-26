import { Page, expect } from "@playwright/test"

const DEFAULT_PASSWORD = "Admin123@"

export async function loginAs(page: Page, username: string, password = DEFAULT_PASSWORD) {
  await page.goto("/login")
  await page.fill("#username", username)
  await page.fill("#password", password)
  await page.getByRole("button", { name: "Login" }).click()
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 })
}

export async function expectLoggedIn(page: Page) {
  await expect(page).not.toHaveURL(/\/login/)
}
