import { test, expect } from '@playwright/test'
import { login } from '../helpers'

test.describe('Publish Flow', () => {
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

    // Fetch an article slug from the API
    const res = await page.request.get(`/api/articles?project_id=${projectId}&limit=1`)
    const json = await res.json()

    if (json.data && json.data.length > 0) {
      articleSlug = json.data[0].slug
    } else {
      test.skip()
      return
    }

    await page.goto(`/projects/${projectId}/articles/${encodeURIComponent(articleSlug)}/publish`)
    await page.waitForLoadState('networkidle')
  })

  test('should show publish page with checklist — แสดงหน้าเผยแพร่พร้อม checklist', async ({ page }) => {
    // Publish dialog header
    await expect(page.locator('text=เผยแพร่บทความ')).toBeVisible({ timeout: 10000 })

    // Checklist section
    await expect(page.locator('text=ตรวจสอบก่อนเผยแพร่')).toBeVisible()
  })

  test('should show target project info — แสดงข้อมูลโปรเจคเป้าหมาย', async ({ page }) => {
    // Target info card should show project name
    await expect(page.locator('text=จะเผยแพร่ไปที่')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Best Solutions').first()).toBeVisible()
  })

  test('should show JSON payload preview — แสดง JSON payload preview', async ({ page }) => {
    await expect(page.locator('text=Payload Preview')).toBeVisible({ timeout: 10000 })

    // Should have a pre element with JSON
    const preElement = page.locator('pre')
    await expect(preElement).toBeVisible()
    const preText = await preElement.textContent()
    expect(preText).toContain('slug')
  })

  test('should have publish button — มีปุ่มเผยแพร่', async ({ page }) => {
    const publishButton = page.locator('button', { hasText: 'เผยแพร่ทันที' })
    await expect(publishButton).toBeVisible({ timeout: 10000 })
  })
})
