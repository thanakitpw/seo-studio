import { test, expect } from '@playwright/test'
import { login } from '../helpers'

test.describe('Brief Review', () => {
  test.setTimeout(60000)

  let projectId: string

  test.beforeEach(async ({ page }) => {
    await login(page)

    // Navigate to Best Solutions project
    await page.locator('text=Best Solutions').first().click()
    await page.waitForURL(/\/projects\/.*\/dashboard/, { timeout: 30000 })

    // Extract project ID from URL
    const url = page.url()
    const match = url.match(/\/projects\/([^/]+)\//)
    projectId = match![1]
  })

  test('should show brief page with keyword info — แสดงหน้า Brief พร้อมข้อมูลคำหลัก', async ({ page }) => {
    // Fetch a keyword
    const res = await page.request.get(`/api/keywords?project_id=${projectId}&limit=100`)
    const json = await res.json()

    const keyword = json.data?.find(
      (k: { status: string }) =>
        ['brief-ready', 'generating-article', 'draft', 'review', 'published'].includes(k.status)
    ) || json.data?.[0]

    if (!keyword) {
      test.skip()
      return
    }

    await page.goto(`/projects/${projectId}/articles/${encodeURIComponent(keyword.slug)}/brief`)
    // Don't use networkidle — SSE streaming keeps connection open
    await page.waitForLoadState('domcontentloaded')

    // Should show keyword info card
    await expect(page.locator('text=ข้อมูลคำหลัก')).toBeVisible({ timeout: 30000 })

    // Should show keyword details
    await expect(page.locator('text=คำหลัก').first()).toBeVisible()
    await expect(page.locator('text=ปริมาณค้นหา').first()).toBeVisible()
    await expect(page.locator('text=ความยาก').first()).toBeVisible()
  })

  test('should show existing brief content (if exists) — แสดงเนื้อหา Brief ที่มีอยู่', async ({ page }) => {
    // Find a keyword that already has brief
    const res = await page.request.get(`/api/keywords?project_id=${projectId}&limit=100`)
    const json = await res.json()

    const keyword = json.data?.find(
      (k: { status: string }) =>
        ['brief-ready', 'generating-article', 'draft', 'review', 'published'].includes(k.status)
    )

    if (!keyword) {
      test.skip()
      return
    }

    await page.goto(`/projects/${projectId}/articles/${encodeURIComponent(keyword.slug)}/brief`)
    // Don't use networkidle — SSE streaming keeps connection open
    await page.waitForLoadState('domcontentloaded')

    // Should show Content Brief header
    await expect(page.locator('text=Content Brief')).toBeVisible({ timeout: 30000 })

    // Brief content area or streaming indicator should be present
    const briefContent = page.locator('.prose')
      .or(page.locator('text=กำลังสร้าง'))
      .or(page.locator('text=ยังไม่มี Brief'))
    await expect(briefContent.first()).toBeVisible({ timeout: 20000 })
  })
})
