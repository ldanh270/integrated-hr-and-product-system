import { Page, expect } from "@playwright/test"

function resolveTestPassword(explicit?: string): string {
  const password = explicit ?? process.env.E2E_TEST_PASSWORD
  if (!password) {
    throw new Error("Set E2E_TEST_PASSWORD or pass password to loginAs()")
  }
  return password
}

export async function loginAs(page: Page, username: string, password?: string) {
  const resolvedPassword = resolveTestPassword(password)
  await page.goto("/login")
  await page.fill("#username", username)
  await page.fill("#password", resolvedPassword)
  await page.getByRole("button", { name: "Login" }).click()
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 })
}

export async function expectLoggedIn(page: Page) {
  await expect(page).not.toHaveURL(/\/login/)
}
