import { Page } from '@playwright/test'
import { BasePage } from './BasePage'
import { ProjectListPage } from './ProjectListPage'

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // --- Locators ---
  get passwordInput() { return this.page.locator('input[type="password"]') }
  get submitButton() { return this.page.locator('button[type="submit"]') }
  get errorMessage() { return this.page.locator('text=รหัสผ่านไม่ถูกต้อง') }

  // --- Actions ---
  async goto() {
    await this.page.goto('/login')
    return this
  }

  async login(password: string = 'bestsolutions2026'): Promise<ProjectListPage> {
    await this.passwordInput.fill(password)
    await this.submitButton.click()
    await this.page.waitForURL(/\/projects/, { timeout: 15000 })
    return new ProjectListPage(this.page)
  }

  async loginExpectError(password: string) {
    await this.passwordInput.fill(password)
    await this.submitButton.click()
    return this
  }
}
