import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Project List', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should show project list page', async ({ page }) => {
    await expect(page.locator('text=โปรเจคของฉัน')).toBeVisible()
  })

  test('should show Best Solutions project card', async ({ page }) => {
    await expect(page.locator('text=Best Solutions')).toBeVisible()
  })

  test('should show new project card', async ({ page }) => {
    await expect(page.locator('text=สร้างโปรเจคใหม่')).toBeVisible()
  })

  test('should navigate to project dashboard on card click', async ({ page }) => {
    await page.locator('text=Best Solutions').first().click()
    await expect(page).toHaveURL(/\/projects\/.*\/dashboard/)
  })
})

test.describe('New Project', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should navigate to new project page', async ({ page }) => {
    await page.click('text=สร้างโปรเจค')
    await expect(page.locator('text=สร้างโปรเจคใหม่')).toBeVisible()
    await expect(page.locator('text=ข้อมูลทั่วไป')).toBeVisible()
  })

  test('should show 3-step wizard', async ({ page }) => {
    await page.click('text=สร้างโปรเจค')
    await expect(page.locator('text=ข้อมูลทั่วไป')).toBeVisible()
    await expect(page.locator('text=การเชื่อมต่อ')).toBeVisible()
    await expect(page.locator('text=ตั้งค่าเนื้อหา')).toBeVisible()
  })
})
