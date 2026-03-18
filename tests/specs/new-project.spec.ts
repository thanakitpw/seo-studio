import { test, expect } from '@playwright/test'
import { login } from '../helpers'

test.describe('New Project Wizard', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.click('text=สร้างโปรเจค')
    await page.waitForURL(/\/projects\/new/)
    await page.waitForLoadState('networkidle')
  })

  test('should show step 1 with name/domain/slug fields — แสดงขั้นตอนที่ 1 พร้อม fields', async ({ page }) => {
    // Step 1 indicator should be visible
    await expect(page.locator('text=ข้อมูลทั่วไป').first()).toBeVisible({ timeout: 10000 })

    // Fields
    await expect(page.locator('text=ชื่อโปรเจค').first()).toBeVisible()
    await expect(page.locator('text=Domain').first()).toBeVisible()
    await expect(page.locator('text=Slug').first()).toBeVisible()
  })

  test('should auto-generate slug from name — สร้าง slug อัตโนมัติจากชื่อ', async ({ page }) => {
    // Type in the name field
    const nameInput = page.locator('input[placeholder="เช่น Best Solutions"]')
    await expect(nameInput).toBeVisible({ timeout: 10000 })
    await nameInput.fill('Test Project Name')

    // Check that slug field auto-populated
    const slugInput = page.locator('input').nth(2) // Third input (name, domain, slug)
    const slugValue = await slugInput.inputValue()
    expect(slugValue).toContain('test-project-name')
  })

  test('should navigate to step 2 — ไปยังขั้นตอนที่ 2', async ({ page }) => {
    // Fill required name
    const nameInput = page.locator('input[placeholder="เช่น Best Solutions"]')
    await expect(nameInput).toBeVisible({ timeout: 10000 })
    await nameInput.fill('E2E Test Project')

    // Click next
    await page.click('text=ถัดไป')

    // Should show step 2 content
    await expect(page.locator('text=ประเภทการเชื่อมต่อ')).toBeVisible({ timeout: 5000 })
  })

  test('should show connection type options — แสดงตัวเลือกประเภทการเชื่อมต่อ', async ({ page }) => {
    // Go to step 2
    const nameInput = page.locator('input[placeholder="เช่น Best Solutions"]')
    await expect(nameInput).toBeVisible({ timeout: 10000 })
    await nameInput.fill('E2E Test Project')
    await page.click('text=ถัดไป')

    await expect(page.locator('text=ประเภทการเชื่อมต่อ')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Supabase Direct')).toBeVisible()
    await expect(page.locator('text=REST API')).toBeVisible()
  })

  test('should navigate to step 3 — ไปยังขั้นตอนที่ 3', async ({ page }) => {
    // Go to step 2
    const nameInput = page.locator('input[placeholder="เช่น Best Solutions"]')
    await expect(nameInput).toBeVisible({ timeout: 10000 })
    await nameInput.fill('E2E Test Project')
    await page.click('text=ถัดไป')
    await expect(page.locator('text=ประเภทการเชื่อมต่อ')).toBeVisible({ timeout: 5000 })

    // Click next to step 3
    await page.locator('button', { hasText: 'ถัดไป' }).click()

    // Should show step 3 content
    await expect(page.locator('text=Brand Voice').first()).toBeVisible({ timeout: 5000 })
  })

  test('should show content config fields — แสดง fields ตั้งค่าเนื้อหา', async ({ page }) => {
    // Navigate to step 3
    const nameInput = page.locator('input[placeholder="เช่น Best Solutions"]')
    await expect(nameInput).toBeVisible({ timeout: 10000 })
    await nameInput.fill('E2E Test Project')
    await page.click('text=ถัดไป')
    await expect(page.locator('text=ประเภทการเชื่อมต่อ')).toBeVisible({ timeout: 5000 })
    await page.locator('button', { hasText: 'ถัดไป' }).click()

    // Should show content config fields
    await expect(page.locator('text=Brand Voice').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Writing Rules').first()).toBeVisible()
    await expect(page.locator('text=Site Inventory').first()).toBeVisible()
    await expect(page.locator('text=Cover Image Style').first()).toBeVisible()

    // Should have submit button
    await expect(page.locator('button', { hasText: 'สร้างโปรเจค' })).toBeVisible()
  })
})
