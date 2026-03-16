import { Page, expect } from '@playwright/test'
import { BasePage } from './BasePage'
import { AddKeywordModal } from './modals/AddKeywordModal'

export class KeywordListPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // --- Locators ---
  get heading() { return this.page.locator('h1:has-text("คำหลัก")') }
  get searchInput() { return this.page.locator('input[placeholder*="ค้นหา"]') }
  get addButton() { return this.page.locator('text=เพิ่มคำหลัก') }
  get importButton() { return this.page.locator('text=Import') }
  get table() { return this.page.locator('table') }
  get selectAllCheckbox() { return this.page.locator('thead input[type="checkbox"]') }
  get filterDropdowns() { return this.page.locator('select') }

  tableRow(index: number) { return this.page.locator(`tbody tr`).nth(index) }
  rowCheckbox(index: number) { return this.tableRow(index).locator('input[type="checkbox"]') }
  deleteButton(index: number) { return this.tableRow(index).locator('[title="ลบ"]') }

  // --- Actions ---
  async search(query: string) {
    await this.searchInput.fill(query)
    await this.page.waitForTimeout(600) // debounce
  }

  async clearSearch() {
    await this.searchInput.fill('')
    await this.page.waitForTimeout(600)
  }

  async openAddKeywordModal(): Promise<AddKeywordModal> {
    await this.addButton.click()
    await this.page.waitForTimeout(300)
    return new AddKeywordModal(this.page)
  }

  async selectAll() {
    await this.selectAllCheckbox.check()
  }

  async selectRow(index: number) {
    await this.rowCheckbox(index).check()
  }

  async deleteRow(index: number) {
    this.page.on('dialog', (dialog) => dialog.accept())
    await this.deleteButton(index).click()
    await this.page.waitForTimeout(500)
  }

  async filterByCluster(index: number) {
    await this.filterDropdowns.first().selectOption({ index })
    await this.page.waitForTimeout(500)
  }

  // --- Assertions ---
  async expectTableVisible() {
    await expect(this.table).toBeVisible()
  }

  async expectRowCount(count: number) {
    await expect(this.page.locator('tbody tr')).toHaveCount(count)
  }

  async expectKeywordInTable(title: string) {
    await expect(this.page.locator(`td:has-text("${title}")`)).toBeVisible()
  }
}
