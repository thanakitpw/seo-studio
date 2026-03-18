import { test, expect } from '@playwright/test'
import { login } from '../helpers'

test.describe('Article Editor', () => {
  test.setTimeout(60000)

  let projectId: string
  let articleSlug: string

  test.beforeEach(async ({ page }) => {
    await login(page)

    // Navigate to Best Solutions project
    await page.locator('text=Best Solutions').first().click()
    await page.waitForURL(/\/projects\/.*\/dashboard/, { timeout: 30000 })

    // Extract project ID from URL
    const url = page.url()
    const match = url.match(/\/projects\/([^/]+)\//)
    projectId = match![1]

    // Navigate to keywords, find an article with draft/review status to edit
    await page.click('text=คีย์เวิร์ด')
    await page.waitForURL(/\/projects\/.*\/keywords/)

    // Click on the first keyword row that has an article (look for edit action or navigate via articles page)
    // Instead, go to articles list and pick the first one
    await page.goto(`/projects/${projectId}/articles`)
    await page.waitForLoadState('networkidle')

    // Fetch an article slug from the API
    const res = await page.request.get(`/api/articles?project_id=${projectId}&limit=1`)
    const json = await res.json()

    if (json.data && json.data.length > 0) {
      articleSlug = json.data[0].slug
    } else {
      // Skip tests if no articles exist
      test.skip()
      return
    }

    await page.goto(`/projects/${projectId}/articles/${encodeURIComponent(articleSlug)}/edit`)
    await page.waitForLoadState('networkidle')
  })

  test('should load editor with article content — โหลด editor พร้อมเนื้อหาบทความ', async ({ page }) => {
    // Editor should have a textarea with content
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible({ timeout: 10000 })
  })

  test('should show toolbar buttons — แสดงปุ่ม toolbar', async ({ page }) => {
    // Toolbar component should be visible (it contains formatting buttons)
    // Look for any toolbar buttons like bold, italic, heading, etc.
    const toolbar = page.locator('main').first()
    await expect(toolbar).toBeVisible()

    // Check for material icons in toolbar area (bold, heading, etc.)
    const buttons = page.locator('button').filter({ has: page.locator('.material-symbols-outlined') })
    await expect(buttons.first()).toBeVisible()
  })

  test('should show SEO checklist — แสดง SEO checklist', async ({ page }) => {
    // Click on SEO Checklist tab in sidebar
    await page.click('text=SEO Checklist')
    await expect(page.locator('text=SEO Checklist')).toBeVisible()
  })

  test('should show word count — แสดงจำนวนคำ', async ({ page }) => {
    // Word count is displayed in the header area
    await expect(page.locator('text=คำ').first()).toBeVisible()
  })

  test('should save draft manually — บันทึกร่างด้วยปุ่ม', async ({ page }) => {
    // Click the save draft button
    const saveButton = page.locator('button', { hasText: 'บันทึกร่าง' })
    await expect(saveButton).toBeVisible()
    await saveButton.click()

    // Should show saving/saved status
    await expect(
      page.locator('text=บันทึกแล้ว').or(page.locator('text=กำลังบันทึก'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('should show frontmatter tab with meta fields — แสดง Frontmatter tab พร้อม meta fields', async ({ page }) => {
    // Frontmatter tab should be active by default or clickable
    await page.click('text=Frontmatter')
    await expect(page.locator('text=Frontmatter')).toBeVisible()

    // Should show meta fields
    await expect(page.locator('text=Meta Title').first()).toBeVisible()
    await expect(page.locator('text=Meta Description').first()).toBeVisible()
    await expect(page.locator('text=Excerpt').first()).toBeVisible()
    await expect(page.locator('text=Tags').first()).toBeVisible()
  })
})
