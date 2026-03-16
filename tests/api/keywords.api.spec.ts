import { test, expect } from '@playwright/test'
import { createAuthenticatedClient } from '../utils/api-client'

test.describe.serial('API: Keywords CRUD', () => {
  let projectId: string
  let testKeywordId: string

  test('setup — get Best Solutions project ID', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.getProjects()
    const projects = await res.json()
    const bestSolutions = projects.find((p: { name: string }) => p.name === 'Best Solutions')
    expect(bestSolutions).toBeTruthy()
    projectId = bestSolutions.id
  })

  test('GET /api/keywords — ดึงรายการ keywords', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.getKeywords(projectId)
    expect(res.ok()).toBeTruthy()

    const json = await res.json()
    expect(json).toHaveProperty('data')
    expect(json).toHaveProperty('total')
    expect(json).toHaveProperty('page')
    expect(Array.isArray(json.data)).toBe(true)
  })

  test('GET /api/keywords — pagination ทำงาน', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.getKeywords(projectId, { page: '1', limit: '5' })
    const json = await res.json()
    expect(json.data.length).toBeLessThanOrEqual(5)
    expect(json.page).toBe(1)
  })

  test('GET /api/keywords — search ทำงาน', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.getKeywords(projectId, { search: 'AI' })
    const json = await res.json()
    json.data.forEach((k: { title: string; primary_keyword: string }) => {
      const match = k.title.toLowerCase().includes('ai') || k.primary_keyword.toLowerCase().includes('ai')
      expect(match).toBe(true)
    })
  })

  test('GET /api/keywords — filter by status', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.getKeywords(projectId, { status: 'pending' })
    const json = await res.json()
    json.data.forEach((k: { status: string }) => {
      expect(k.status).toBe('pending')
    })
  })

  test('POST /api/keywords — เพิ่ม keyword', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const slug = `test-kw-${Date.now()}`
    const res = await api.createKeyword({
      project_id: projectId,
      title: 'E2E Test Keyword',
      primary_keyword: 'e2e test',
      slug,
      cluster: 'Test',
      content_type: 'Blog',
      priority: 'Medium',
    })
    expect(res.ok()).toBeTruthy()

    const data = await res.json()
    expect(data.title).toBe('E2E Test Keyword')
    expect(data.status).toBe('pending')
    testKeywordId = data.id
  })

  test('POST /api/keywords — reject missing fields', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.createKeyword({ project_id: projectId, title: '' })
    expect(res.status()).toBe(400)
  })

  test('PATCH /api/keywords/[id] — อัพเดท keyword', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.updateKeyword(testKeywordId, { priority: 'High' })
    expect(res.ok()).toBeTruthy()

    const data = await res.json()
    expect(data.priority).toBe('High')
  })

  test('DELETE /api/keywords/[id] — ลบ keyword', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.deleteKeyword(testKeywordId)
    expect(res.ok()).toBeTruthy()

    const data = await res.json()
    expect(data.success).toBe(true)
  })

  test('GET /api/keywords/template — ดาวน์โหลด CSV template', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.downloadTemplate()
    expect(res.ok()).toBeTruthy()

    const text = await res.text()
    expect(text).toContain('Title')
    expect(text).toContain('Primary Keyword')
  })
})
