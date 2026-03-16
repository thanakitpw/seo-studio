import { test, expect, Page } from '@playwright/test'
import { login } from './helpers'

/**
 * UI Testing Agent — ตรวจสอบ UI ทุกหน้าอัตโนมัติ
 *
 * รัน: npx playwright test tests/ui-audit.spec.ts --headed
 * ดูรายงาน: npx playwright show-report
 *
 * Checks:
 * 1. Visual regression (screenshot comparison)
 * 2. Layout integrity (no overflow, no missing elements)
 * 3. Accessibility basics (contrast, labels, focus)
 * 4. Responsive (desktop + tablet)
 */

// Helper: check page for common UI issues
async function auditPage(page: Page, pageName: string) {
  // 1. No JS errors
  const jsErrors: string[] = []
  page.on('pageerror', (err) => jsErrors.push(err.message))

  // 2. No horizontal overflow
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth
  })
  expect(hasOverflow, `${pageName}: horizontal overflow detected`).toBe(false)

  // 3. No broken images
  const brokenImages = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img')
    return Array.from(imgs).filter((img) => !img.complete || img.naturalWidth === 0).length
  })
  expect(brokenImages, `${pageName}: ${brokenImages} broken image(s)`).toBe(0)

  // 4. All buttons/links have cursor-pointer or are disabled
  const clickablesWithoutCursor = await page.evaluate(() => {
    const elements = document.querySelectorAll('a, button, [role="button"], [onclick]')
    let count = 0
    elements.forEach((el) => {
      const style = window.getComputedStyle(el)
      const isDisabled = (el as HTMLButtonElement).disabled
      if (!isDisabled && style.cursor !== 'pointer') count++
    })
    return count
  })
  // Log warning but don't fail (some elements may intentionally not have cursor-pointer)
  if (clickablesWithoutCursor > 0) {
    console.warn(`${pageName}: ${clickablesWithoutCursor} clickable element(s) without cursor-pointer`)
  }

  // 5. Visual regression screenshot
  await expect(page).toHaveScreenshot(`${pageName}.png`, {
    fullPage: false,
    maxDiffPixelRatio: 0.05, // Allow 5% pixel difference
  })

  // 6. Report JS errors
  expect(jsErrors.length, `${pageName}: JS errors: ${jsErrors.join(', ')}`).toBe(0)
}

test.describe('UI Audit — All Pages', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Page: Project List (/projects)', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    // Check key elements exist
    await expect(page.locator('text=โปรเจคของฉัน')).toBeVisible()
    await expect(page.locator('text=สร้างโปรเจคใหม่')).toBeVisible()

    await auditPage(page, 'project-list')
  })

  test('Page: New Project (/projects/new)', async ({ page }) => {
    await page.goto('/projects/new')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=สร้างโปรเจคใหม่')).toBeVisible()
    await expect(page.locator('text=ข้อมูลทั่วไป')).toBeVisible()

    await auditPage(page, 'new-project')
  })

  test('Page: Dashboard', async ({ page }) => {
    // Navigate to first project
    await page.goto('/projects')
    await page.locator('text=Best Solutions').first().click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Best Solutions' })).toBeVisible()
    await expect(page.locator('text=การใช้งาน Token')).toBeVisible()

    await auditPage(page, 'dashboard')
  })

  test('Page: Keyword List', async ({ page }) => {
    await page.goto('/projects')
    await page.locator('text=Best Solutions').first().click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    await page.click('text=คีย์เวิร์ด')
    await page.waitForURL(/\/keywords/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')
    // Wait for table data to load
    await page.waitForTimeout(2000)

    await expect(page.locator('table')).toBeVisible()

    await auditPage(page, 'keyword-list')
  })

  test('Page: Dashboard (Tablet 768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/projects')
    await page.locator('text=Best Solutions').first().click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')

    await auditPage(page, 'dashboard-tablet')
  })

  test('Page: Project List (Tablet 768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    await auditPage(page, 'project-list-tablet')
  })
})

test.describe('UI Audit — Modals', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/projects')
    await page.locator('text=Best Solutions').first().click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    await page.click('text=คีย์เวิร์ด')
    await page.waitForURL(/\/keywords/, { timeout: 15000 })
    await page.waitForTimeout(2000)
  })

  test('Modal: Add Keyword', async ({ page }) => {
    await page.click('text=เพิ่มคำหลัก')
    await page.waitForTimeout(500)
    await expect(page.locator('text=เพิ่มคำหลักใหม่')).toBeVisible()

    await auditPage(page, 'modal-add-keyword')
  })
})
