import { Page, expect } from '@playwright/test'
import { BasePage } from './BasePage'
import { KeywordListPage } from './KeywordListPage'

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // --- Locators ---
  get projectName() { return this.page.getByRole('heading').first() }
  get settingsButton() { return this.page.locator('text=ตั้งค่า').first() }

  get stats() {
    return {
      total: this.page.locator('text=ทั้งหมด'),
      published: this.page.locator('div').filter({ hasText: /^เผยแพร่แล้ว$/ }).first(),
      draft: this.page.locator('text=ร่างอยู่'),
      pending: this.page.locator('div').filter({ hasText: /^รอดำเนินการ$/ }).first(),
    }
  }

  get sections() {
    return {
      categories: this.page.locator('text=หมวดหมู่'),
      activity: this.page.locator('text=กิจกรรมล่าสุด'),
      tokenUsage: this.page.locator('text=การใช้งาน Token'),
    }
  }

  // --- Actions ---
  async navigateToKeywords(): Promise<KeywordListPage> {
    await this.page.click('text=คีย์เวิร์ด')
    await this.page.waitForURL(/\/keywords/, { timeout: 15000 })
    return new KeywordListPage(this.page)
  }

  async navigateToSettings() {
    await this.settingsButton.click()
    await this.page.waitForURL(/\/settings/)
  }

  // --- Assertions ---
  async expectStatsVisible() {
    await expect(this.stats.total).toBeVisible()
    await expect(this.stats.published).toBeVisible()
    await expect(this.stats.draft).toBeVisible()
    await expect(this.stats.pending).toBeVisible()
  }

  async expectAllSectionsVisible() {
    await expect(this.sections.categories).toBeVisible()
    await expect(this.sections.activity).toBeVisible()
    await expect(this.sections.tokenUsage).toBeVisible()
  }
}
