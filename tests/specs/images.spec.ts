import { test, expect } from '@playwright/test'
import { login } from '../helpers'

test.describe('Cover Image Gallery', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await login(page)

    // Navigate to Best Solutions project
    await page.locator('text=Best Solutions').first().click()
    await page.waitForURL(/\/projects\/.*\/dashboard/, { timeout: 30000 })

    // Navigate to images via sidebar
    await page.locator('text=รูปปก').first().click()
    await page.waitForURL(/\/projects\/.*\/images/)
    await page.waitForLoadState('networkidle')
  })

  test('should show images page — แสดงหน้ารูปปก', async ({ page }) => {
    await expect(page.locator('text=รูปปกบทความ')).toBeVisible({ timeout: 10000 })
  })

  test('should have create button — มีปุ่มสร้างรูปใหม่', async ({ page }) => {
    // Either "สร้างรูปใหม่" button in header or "สร้างรูปแรก" if no images
    const createButton = page.locator('button', { hasText: 'สร้างรูปใหม่' })
      .or(page.locator('button', { hasText: 'สร้างรูปแรก' }))
    await expect(createButton.first()).toBeVisible({ timeout: 10000 })
  })

  test('should open generate modal — เปิด modal สร้างรูป', async ({ page }) => {
    // Click the create button
    const createButton = page.locator('button', { hasText: 'สร้างรูปใหม่' })
      .or(page.locator('button', { hasText: 'สร้างรูปแรก' }))
    await createButton.first().click()

    // Modal should appear
    await page.waitForTimeout(500)
    // GenerateCoverModal should be visible
    const modal = page.locator('[role="dialog"]')
      .or(page.locator('text=สร้างรูปปก'))
    await expect(modal.first()).toBeVisible({ timeout: 5000 })
  })
})
