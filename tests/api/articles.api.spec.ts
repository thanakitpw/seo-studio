import { test, expect } from '@playwright/test'
import { createAuthenticatedClient } from '../utils/api-client'

test.describe.serial('API: Articles', () => {
  let projectId: string
  let articleSlug: string

  test('setup — get Best Solutions project ID', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.getProjects()
    const projects = await res.json()
    const bestSolutions = projects.find((p: { name: string }) => p.name === 'Best Solutions')
    expect(bestSolutions).toBeTruthy()
    projectId = bestSolutions.id
  })

  test('GET /api/articles — ดึงรายการบทความตาม project', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.getArticles(projectId)
    expect(res.ok()).toBeTruthy()

    const json = await res.json()
    expect(json).toHaveProperty('data')
    expect(json).toHaveProperty('total')
    expect(json).toHaveProperty('page')
    expect(json).toHaveProperty('totalPages')
    expect(Array.isArray(json.data)).toBe(true)

    // Store first article slug for next tests
    if (json.data.length > 0) {
      articleSlug = json.data[0].slug
    }
  })

  test('GET /api/articles — ต้องระบุ project_id', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.getArticles('')
    // Sending empty project_id — should fail with 400
    expect(res.status()).toBe(400)
  })

  test('GET /api/articles/[slug] — ดึงรายละเอียดบทความ', async ({ request }) => {
    if (!articleSlug) test.skip()

    const api = await createAuthenticatedClient(request)
    const res = await api.getArticle(articleSlug)
    expect(res.ok()).toBeTruthy()

    const data = await res.json()
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('slug')
    expect(data.slug).toBe(articleSlug)
    expect(data).toHaveProperty('content_md')
    expect(data).toHaveProperty('status')
  })

  test('GET /api/articles/[slug] — 404 ถ้าไม่เจอบทความ', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.getArticle('non-existent-slug-xyz-12345')
    expect(res.status()).toBe(404)
  })

  test('PATCH /api/articles/[slug] — อัพเดทร่างบทความ', async ({ request }) => {
    if (!articleSlug) test.skip()

    const api = await createAuthenticatedClient(request)
    const testTitle = `E2E Updated Title ${Date.now()}`

    const res = await api.updateArticle(articleSlug, {
      title: testTitle,
    })
    expect(res.ok()).toBeTruthy()

    const data = await res.json()
    expect(data.title).toBe(testTitle)
  })

  test('PATCH /api/articles/[slug] — reject empty update', async ({ request }) => {
    if (!articleSlug) test.skip()

    const api = await createAuthenticatedClient(request)
    const res = await api.updateArticle(articleSlug, {
      invalid_field: 'test',
    })
    expect(res.status()).toBe(400)
  })
})
