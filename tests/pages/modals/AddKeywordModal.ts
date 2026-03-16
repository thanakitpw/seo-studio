import { Page, expect } from '@playwright/test'

export class AddKeywordModal {
  constructor(private page: Page) {}

  // --- Locators ---
  get modal() { return this.page.locator('text=เพิ่มคำหลักใหม่').locator('..').locator('..') }
  get titleInput() { return this.page.locator('input').nth(0) }
  get keywordInput() { return this.page.locator('input').nth(1) }
  get slugInput() { return this.page.locator('input').nth(2) }
  get clusterSelect() { return this.page.locator('select').first() }
  get typeSelect() { return this.page.locator('select').last() }
  get submitButton() { return this.page.locator('text=บันทึกข้อมูล') }
  get cancelButton() { return this.page.locator('text=ยกเลิก') }
  get closeButton() { return this.page.locator('[class*="close"], button:has(span:text("close"))') }
  get errorMessage() { return this.page.locator('.text-red-500') }

  // --- Actions ---
  async fillForm(data: {
    title: string
    keyword: string
    cluster?: string
    type?: string
    priority?: 'Low' | 'Medium' | 'High'
  }) {
    // Find inputs within the modal context
    const inputs = this.page.locator('.fixed input[type="text"], .fixed input:not([type])')
    await inputs.nth(0).fill(data.title)
    await inputs.nth(1).fill(data.keyword)

    if (data.cluster) {
      const selects = this.page.locator('.fixed select')
      await selects.first().selectOption(data.cluster)
    }
    if (data.type) {
      const selects = this.page.locator('.fixed select')
      await selects.last().selectOption(data.type)
    }
    if (data.priority) {
      await this.page.locator(`input[value="${data.priority}"]`).check()
    }
  }

  async submit() {
    await this.submitButton.click()
    await this.page.waitForTimeout(1000)
  }

  async cancel() {
    await this.cancelButton.click()
  }

  // --- Assertions ---
  async expectVisible() {
    await expect(this.page.locator('text=เพิ่มคำหลักใหม่')).toBeVisible()
  }

  async expectClosed() {
    await expect(this.page.locator('text=เพิ่มคำหลักใหม่')).not.toBeVisible()
  }

  async expectError() {
    await expect(this.errorMessage).toBeVisible()
  }
}
