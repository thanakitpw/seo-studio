import { test, expect } from '@playwright/test'
import { createAuthenticatedClient } from '../utils/api-client'

test.describe.serial('API: Projects CRUD', () => {
  let testProjectId: string

  test('GET /api/projects — ดึงรายการโปรเจค', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.getProjects()
    expect(res.ok()).toBeTruthy()

    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)

    const project = data[0]
    expect(project).toHaveProperty('id')
    expect(project).toHaveProperty('name')
    expect(project).toHaveProperty('slug')
    expect(project.status).toBe('active')
  })

  test('POST /api/projects — สร้างโปรเจคใหม่', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const slug = `test-e2e-${Date.now()}`
    const res = await api.createProject({
      name: 'E2E Test Project',
      slug,
      domain: 'test.example.com',
    })
    expect(res.ok()).toBeTruthy()

    const data = await res.json()
    expect(data.name).toBe('E2E Test Project')
    expect(data.slug).toBe(slug)
    testProjectId = data.id
  })

  test('POST /api/projects — reject missing name', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.createProject({ name: '', slug: 'no-name' })
    expect(res.status()).toBe(400)
  })

  test('GET /api/projects/[id] — ดึงโปรเจคเดียว', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.getProject(testProjectId)
    expect(res.ok()).toBeTruthy()

    const data = await res.json()
    expect(data.id).toBe(testProjectId)
  })

  test('GET /api/projects/[id] — 404 not found', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.getProject('00000000-0000-0000-0000-000000000000')
    expect(res.status()).toBe(404)
  })

  test('PATCH /api/projects/[id] — อัพเดทโปรเจค', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.updateProject(testProjectId, {
      domain: 'updated.example.com',
    })
    expect(res.ok()).toBeTruthy()

    const data = await res.json()
    expect(data.domain).toBe('updated.example.com')
  })

  test('DELETE /api/projects/[id] — archive โปรเจค', async ({ request }) => {
    const api = await createAuthenticatedClient(request)
    const res = await api.deleteProject(testProjectId)
    expect(res.ok()).toBeTruthy()

    const getRes = await api.getProject(testProjectId)
    const data = await getRes.json()
    expect(data.status).toBe('archived')
  })
})
