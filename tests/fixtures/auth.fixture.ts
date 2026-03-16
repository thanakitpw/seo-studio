import { test as base } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { ProjectListPage } from '../pages/ProjectListPage'
import { DashboardPage } from '../pages/DashboardPage'
import { KeywordListPage } from '../pages/KeywordListPage'

type Fixtures = {
  loginPage: LoginPage
  projectListPage: ProjectListPage
  dashboardPage: DashboardPage
  keywordListPage: KeywordListPage
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await use(loginPage)
  },

  projectListPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    const projectList = await loginPage.login()
    await use(projectList)
  },

  dashboardPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    const projectList = await loginPage.login()
    const dashboard = await projectList.openProject('Best Solutions')
    await use(dashboard)
  },

  keywordListPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    const projectList = await loginPage.login()
    const dashboard = await projectList.openProject('Best Solutions')
    const keywords = await dashboard.navigateToKeywords()
    await keywords.waitForPageLoad()
    await use(keywords)
  },
})

export { expect } from '@playwright/test'
