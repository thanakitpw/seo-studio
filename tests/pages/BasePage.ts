import { Page, expect } from '@playwright/test'

export class BasePage {
  constructor(protected page: Page) {}

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
  }

  async screenshot(name: string) {
    await expect(this.page).toHaveScreenshot(`${name}.png`, {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    })
  }

  async checkNoJsErrors() {
    const errors: string[] = []
    this.page.on('pageerror', (err) => errors.push(err.message))
    return errors
  }

  async checkNoOverflow() {
    const hasOverflow = await this.page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(hasOverflow, 'Horizontal overflow detected').toBe(false)
  }

  async checkNoBrokenImages() {
    const broken = await this.page.evaluate(() => {
      const imgs = document.querySelectorAll('img')
      return Array.from(imgs).filter((img) => !img.complete || img.naturalWidth === 0).length
    })
    expect(broken, `${broken} broken image(s) found`).toBe(0)
  }

  async fullAudit(name: string) {
    await this.checkNoOverflow()
    await this.checkNoBrokenImages()
    await this.screenshot(name)
  }
}
