import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Keyword List', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    // Navigate to Best Solutions → Keywords
    await page.locator('text=Best Solutions').first().click()
    await page.waitForURL(/\/projects\/.*\/dashboard/)
    await page.click('text=คีย์เวิร์ด')
    await page.waitForURL(/\/projects\/.*\/keywords/)
  })

  test('should show keyword list page', async ({ page }) => {
    await expect(page.locator('h1:has-text("คำหลัก")')).toBeVisible()
  })

  test('should show keyword count badge', async ({ page }) => {
    await expect(page.locator('.rounded-full:has-text("7")')).toBeVisible({ timeout: 10000 })
  })

  test('should show filter bar', async ({ page }) => {
    await expect(page.locator('select').first()).toBeVisible()
    await expect(page.locator('select').nth(1)).toBeVisible()
  })

  test('should show keyword table with data', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('th:has-text("ชื่อบทความ")')).toBeVisible()
  })

  test('should show add keyword and import buttons', async ({ page }) => {
    await expect(page.locator('text=เพิ่มคำหลัก')).toBeVisible()
    await expect(page.locator('text=Import')).toBeVisible()
  })

  test('should open add keyword modal', async ({ page }) => {
    await page.click('text=เพิ่มคำหลัก')
    await expect(page.locator('text=เพิ่มคำหลักใหม่')).toBeVisible()
  })

  test('should search keywords', async ({ page }) => {
    await page.fill('input[placeholder*="ค้นหา"]', 'AI')
    // Wait for debounce + fetch
    await page.waitForTimeout(500)
    await expect(page.locator('table')).toBeVisible()
  })

  test('should filter by category', async ({ page }) => {
    // Open category dropdown and select
    const dropdown = page.locator('select').first()
    await dropdown.selectOption({ index: 1 })
    await page.waitForTimeout(500)
    await expect(page.locator('table')).toBeVisible()
  })
})
