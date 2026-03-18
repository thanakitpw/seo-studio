import { test, expect } from '@playwright/test'
import { login } from '../helpers'

test.describe('Project Settings', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await login(page)

    // Navigate to Best Solutions project
    await page.locator('text=Best Solutions').first().click()
    await page.waitForURL(/\/projects\/.*\/dashboard/, { timeout: 30000 })

    // Navigate to settings via sidebar
    await page.locator('text=ตั้งค่า').first().click()
    await page.waitForURL(/\/projects\/.*\/settings/)
    await page.waitForLoadState('networkidle')
  })

  test('should show 4 tabs — แสดง 4 แท็บ', async ({ page }) => {
    // Wait for page to fully load
    await expect(page.getByRole('heading', { name: 'ตั้งค่าโปรเจค' })).toBeVisible({ timeout: 10000 })

    // Tab buttons are in the tab bar (border-b container) — use exact names with icons
    await expect(page.getByRole('button', { name: 'cable การเชื่อมต่อ' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'article เนื้อหา' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'image รูปปก' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'tune ทั่วไป' })).toBeVisible()
  })

  test('should show connection tab by default — แสดงแท็บการเชื่อมต่อเป็นค่าเริ่มต้น', async ({ page }) => {
    // Connection tab should be active and showing connection type radio
    await expect(page.locator('text=ประเภทการเชื่อมต่อ')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Supabase Direct')).toBeVisible()
  })

  test('should switch between tabs — สลับระหว่างแท็บ', async ({ page }) => {
    // Wait for page to load
    await expect(page.locator('text=ประเภทการเชื่อมต่อ')).toBeVisible({ timeout: 10000 })

    // Click on "เนื้อหา" tab
    await page.getByRole('button', { name: /เนื้อหา/ }).click()
    await expect(page.locator('text=Brand Voice').first()).toBeVisible()

    // Click on "รูปปก" tab
    await page.getByRole('button', { name: /รูปปก/ }).click()
    await page.waitForTimeout(500)

    // Click on "ทั่วไป" tab
    await page.getByRole('button', { name: /ทั่วไป/ }).click()
    await page.waitForTimeout(500)

    // Click back to "การเชื่อมต่อ" tab
    await page.getByRole('button', { name: /การเชื่อมต่อ/ }).click()
    await expect(page.locator('text=ประเภทการเชื่อมต่อ')).toBeVisible()
  })

  test('should show Supabase fields — แสดง Supabase fields', async ({ page }) => {
    await expect(page.locator('text=ประเภทการเชื่อมต่อ')).toBeVisible({ timeout: 10000 })

    // Supabase-specific fields
    await expect(page.locator('label', { hasText: 'Supabase URL' })).toBeVisible()
    await expect(page.locator('label', { hasText: 'Anon Key' })).toBeVisible()
    await expect(page.locator('label', { hasText: 'Service Role Key' })).toBeVisible()
    await expect(page.locator('label', { hasText: 'Storage Bucket' })).toBeVisible()
  })

  test('should show REST API fields when toggled — แสดง REST API fields เมื่อสลับ', async ({ page }) => {
    await expect(page.locator('text=ประเภทการเชื่อมต่อ')).toBeVisible({ timeout: 10000 })

    // Click REST API radio
    await page.locator('text=REST API').click()

    // Should show REST API specific fields
    await expect(page.locator('label', { hasText: 'API Endpoint' })).toBeVisible()
    await expect(page.locator('label', { hasText: 'API Key' })).toBeVisible()
    await expect(page.locator('label', { hasText: 'Method' })).toBeVisible()
  })

  test('should have test connection button — มีปุ่มทดสอบการเชื่อมต่อ', async ({ page }) => {
    await expect(page.locator('text=ประเภทการเชื่อมต่อ')).toBeVisible({ timeout: 10000 })

    const testButton = page.getByRole('button', { name: /ทดสอบการเชื่อมต่อ/ })
    await expect(testButton).toBeVisible()
  })

  test('should have save button — มีปุ่มบันทึก', async ({ page }) => {
    await expect(page.locator('text=ประเภทการเชื่อมต่อ')).toBeVisible({ timeout: 10000 })

    // Use exact match for "บันทึก" to avoid matching "กำลังบันทึก" etc.
    const saveButton = page.locator('button', { hasText: /^บันทึก$/ })
    await expect(saveButton).toBeVisible()
  })
})
