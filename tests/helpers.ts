import { Page } from '@playwright/test'

export async function login(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="password"]', 'bestsolutions2026')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/projects/, { timeout: 30000 })
}
