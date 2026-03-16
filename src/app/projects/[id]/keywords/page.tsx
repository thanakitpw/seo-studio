'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import KeywordTable from '@/components/keywords/KeywordTable'
import FilterBar from '@/components/keywords/FilterBar'
import Pagination from '@/components/keywords/Pagination'
import AddKeywordModal from '@/components/keywords/AddKeywordModal'
import ImportCsvModal from '@/components/keywords/ImportCsvModal'
import type { Keyword } from '@/types'

interface KeywordsResponse {
  data: Keyword[]
  total: number
  page: number
  totalPages: number
}

export default function KeywordsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    cluster: '',
    status: '',
    priority: '',
    content_type: '',
  })

  const limit = 20

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch keywords
  const fetchKeywords = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        project_id: projectId,
        page: String(page),
        limit: String(limit),
      })

      if (filters.cluster) params.set('cluster', filters.cluster)
      if (filters.status) params.set('status', filters.status)
      if (filters.priority) params.set('priority', filters.priority)
      if (filters.content_type) params.set('content_type', filters.content_type)
      if (debouncedSearch) params.set('search', debouncedSearch)

      const res = await fetch(`/api/keywords?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch keywords')

      const json: KeywordsResponse = await res.json()
      setKeywords(json.data)
      setTotal(json.total)
      setTotalPages(json.totalPages)
    } catch {
      setKeywords([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [projectId, page, limit, filters, debouncedSearch])

  useEffect(() => {
    fetchKeywords()
  }, [fetchKeywords])

  // Fetch all clusters for filter dropdown
  const [clusters, setClusters] = useState<string[]>([])

  useEffect(() => {
    async function fetchClusters() {
      try {
        const res = await fetch(`/api/keywords?project_id=${projectId}&limit=1000`)
        if (res.ok) {
          const json = await res.json()
          const data = json.data || json || []
          const set = new Set<string>(data.map((k: Keyword) => k.cluster).filter(Boolean))
          setClusters(Array.from(set).sort())
        }
      } catch {
        // ignore
      }
    }
    fetchClusters()
  }, [projectId])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleView = (keyword: Keyword) => {
    if (keyword.status === 'published' || keyword.status === 'draft' || keyword.status === 'review') {
      window.location.href = `/projects/${projectId}/articles/${keyword.slug}/edit`
    } else if (keyword.status === 'pending' || keyword.status === 'brief-ready') {
      window.location.href = `/projects/${projectId}/articles/${keyword.slug}/brief`
    }
  }

  const handleDelete = async (keyword: Keyword) => {
    if (!confirm(`ลบ "${keyword.title}" หรือไม่?`)) return
    try {
      const res = await fetch(`/api/keywords/${keyword.id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchKeywords()
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="p-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">คำหลัก</h1>
          <span className="flex h-5 items-center rounded-full bg-[#6467f2]/10 px-2.5 text-xs font-semibold text-[#6467f2]">
            {total}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ fontSize: '16px' }}>
              search
            </span>
            <Input
              placeholder="ค้นหาคำหลัก..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-[34px] w-[220px] pl-8 text-sm"
            />
          </div>
          <Button
            size="default"
            className="cursor-pointer gap-1.5"
            onClick={() => setAddModalOpen(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>add</span>
            เพิ่มคำหลัก
          </Button>
          <Button
            variant="outline"
            size="default"
            className="cursor-pointer gap-1.5"
            onClick={() => setImportModalOpen(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>download</span>
            Import
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        clusters={clusters}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-3xl text-muted-foreground/50">progress_activity</span>
        </div>
      ) : (
        <KeywordTable keywords={keywords} onView={handleView} onDelete={handleDelete} />
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
        />
      )}

      {/* Modals */}
      <AddKeywordModal
        projectId={projectId}
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={fetchKeywords}
      />
      <ImportCsvModal
        projectId={projectId}
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={fetchKeywords}
      />
    </div>
  )
}
