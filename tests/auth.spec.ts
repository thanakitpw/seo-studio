import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/projects')
    await expect(page).toHaveURL(/\/login/)
  })

  test('should login with correct password', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="password"]', 'bestsolutions2026')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/projects/, { timeout: 15000 })
  })

  test('should show error with wrong password', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="password"]', 'wrong-password')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=รหัสผ่านไม่ถูกต้อง')).toBeVisible()
  })
})
