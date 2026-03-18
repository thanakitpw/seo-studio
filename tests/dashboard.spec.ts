import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Project Dashboard', () => {
  test.setTimeout(60000)
  test.beforeEach(async ({ page }) => {
    await login(page)
    // Click on Best Solutions project
    await page.locator('text=Best Solutions').first().click()
    await page.waitForURL(/\/projects\/.*\/dashboard/, { timeout: 30000 })
  })

  test('should show project name and domain', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Best Solutions' })).toBeVisible()
    await expect(page.locator('text=bestsolutions.co.th')).toBeVisible()
  })

  test('should show stats cards', async ({ page }) => {
    await expect(page.locator('text=ทั้งหมด')).toBeVisible()
    await expect(page.locator('div').filter({ hasText: /^เผยแพร่แล้ว$/ }).first()).toBeVisible()
    await expect(page.locator('text=ร่างอยู่')).toBeVisible()
    await expect(page.locator('div').filter({ hasText: /^รอดำเนินการ$/ }).first()).toBeVisible()
  })

  test('should show category progress section', async ({ page }) => {
    await expect(page.locator('text=หมวดหมู่')).toBeVisible()
  })

  test('should show recent activity section', async ({ page }) => {
    await expect(page.locator('text=กิจกรรมล่าสุด')).toBeVisible()
  })

  test('should show token usage section', async ({ page }) => {
    await expect(page.locator('text=การใช้งาน Token')).toBeVisible()
  })

  test('should navigate to settings', async ({ page }) => {
    await page.click('text=ตั้งค่า >> nth=0')
    await expect(page).toHaveURL(/\/settings/)
  })
})
