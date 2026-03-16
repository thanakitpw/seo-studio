import { Page, expect } from '@playwright/test'
import { BasePage } from './BasePage'
import { DashboardPage } from './DashboardPage'

export class ProjectListPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // --- Locators ---
  get heading() { return this.page.locator('text=โปรเจคของฉัน') }
  get searchInput() { return this.page.locator('input[placeholder*="ค้นหาโปรเจค"]') }
  get createButton() { return this.page.locator('text=สร้างโปรเจค').first() }
  get newProjectCard() { return this.page.locator('text=สร้างโปรเจคใหม่') }

  projectCard(name: string) {
    return this.page.locator(`text=${name}`).first()
  }

  // --- Actions ---
  async goto() {
    await this.page.goto('/projects')
    await this.waitForPageLoad()
    return this
  }

  async openProject(name: string): Promise<DashboardPage> {
    await this.projectCard(name).click()
    await this.page.waitForURL(/\/dashboard/, { timeout: 15000 })
    return new DashboardPage(this.page)
  }

  async clickCreateProject() {
    await this.createButton.click()
    await this.page.waitForURL(/\/projects\/new/)
  }

  // --- Assertions ---
  async expectProjectVisible(name: string) {
    await expect(this.projectCard(name)).toBeVisible()
  }

  async expectProjectCount(count: number) {
    const badge = this.page.locator('.rounded-full').filter({ hasText: String(count) })
    await expect(badge).toBeVisible()
  }
}
