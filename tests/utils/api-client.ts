import { APIRequestContext } from '@playwright/test'

const BASE_URL = 'http://localhost:3000/api'

export class ApiClient {
  constructor(private request: APIRequestContext) {}

  // --- Auth ---
  async login(password: string = 'bestsolutions2026') {
    const res = await this.request.post(`${BASE_URL}/auth/login`, {
      data: { password },
    })
    return res
  }

  // --- Projects ---
  async getProjects() {
    return this.request.get(`${BASE_URL}/projects`)
  }

  async createProject(data: { name: string; slug: string; [key: string]: unknown }) {
    return this.request.post(`${BASE_URL}/projects`, { data })
  }

  async getProject(id: string) {
    return this.request.get(`${BASE_URL}/projects/${id}`)
  }

  async updateProject(id: string, data: Record<string, unknown>) {
    return this.request.patch(`${BASE_URL}/projects/${id}`, { data })
  }

  async deleteProject(id: string) {
    return this.request.delete(`${BASE_URL}/projects/${id}`)
  }

  async testConnection(id: string) {
    return this.request.post(`${BASE_URL}/projects/${id}/test-connection`)
  }

  // --- Keywords ---
  async getKeywords(projectId: string, params?: Record<string, string>) {
    const query = new URLSearchParams({ project_id: projectId, ...params })
    return this.request.get(`${BASE_URL}/keywords?${query}`)
  }

  async createKeyword(data: Record<string, unknown>) {
    return this.request.post(`${BASE_URL}/keywords`, { data })
  }

  async updateKeyword(id: string, data: Record<string, unknown>) {
    return this.request.patch(`${BASE_URL}/keywords/${id}`, { data })
  }

  async deleteKeyword(id: string) {
    return this.request.delete(`${BASE_URL}/keywords/${id}`)
  }

  async importKeywords(data: { project_id: string; keywords: unknown[] }) {
    return this.request.post(`${BASE_URL}/keywords/import`, { data })
  }

  async downloadTemplate() {
    return this.request.get(`${BASE_URL}/keywords/template`)
  }

  // --- Articles ---
  async getArticles(projectId: string, params?: Record<string, string>) {
    const query = new URLSearchParams({ project_id: projectId, ...params })
    return this.request.get(`${BASE_URL}/articles?${query}`)
  }

  async getArticle(slug: string) {
    return this.request.get(`${BASE_URL}/articles/${encodeURIComponent(slug)}`)
  }

  async updateArticle(slug: string, data: Record<string, unknown>) {
    return this.request.patch(`${BASE_URL}/articles/${encodeURIComponent(slug)}`, { data })
  }

  // --- Images ---
  async getImages(projectId: string) {
    return this.request.get(`${BASE_URL}/images?project_id=${projectId}`)
  }
}

/** Create an authenticated API client */
export async function createAuthenticatedClient(request: APIRequestContext): Promise<ApiClient> {
  const api = new ApiClient(request)
  await api.login()
  return api
}
