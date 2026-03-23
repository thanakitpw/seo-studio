'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Pagination from '@/components/keywords/Pagination'
import type { Article } from '@/types'

interface ArticlesResponse {
  data: Article[]
  total: number
  page: number
  totalPages: number
}

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  draft: { label: 'ร่าง', class: 'bg-slate-100 text-slate-600' },
  review: { label: 'รอตรวจ', class: 'bg-amber-100 text-amber-700' },
  published: { label: 'เผยแพร่แล้ว', class: 'bg-emerald-100 text-emerald-700' },
  'generating-brief': { label: 'กำลังสร้าง Brief', class: 'bg-[#6467f2]/10 text-[#6467f2]' },
  'brief-ready': { label: 'Brief พร้อม', class: 'bg-blue-100 text-blue-700' },
  'generating-article': { label: 'กำลังเขียน', class: 'bg-[#6467f2]/10 text-[#6467f2]' },
}

function getStatusBadge(status: string) {
  const s = STATUS_MAP[status] ?? { label: status, class: 'bg-slate-100 text-slate-600' }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.class}`}>{s.label}</span>
}

function wordCount(md: string | null): number {
  if (!md) return 0
  return md.trim().split(/\s+/).filter(Boolean).length
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

export default function ArticlesPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const limit = 20

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        project_id: projectId,
        page: String(page),
        limit: String(limit),
      })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/articles?${params}`)
      if (res.ok) {
        const json: ArticlesResponse = await res.json()
        setArticles(json.data)
        setTotal(json.total)
        setTotalPages(json.totalPages)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [projectId, page, debouncedSearch, statusFilter])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const handleArticleClick = (article: Article) => {
    if (article.content_md) {
      router.push(`/projects/${projectId}/articles/${article.slug}/edit`)
    } else if (article.brief_md) {
      router.push(`/projects/${projectId}/articles/${article.slug}/writing`)
    } else {
      router.push(`/projects/${projectId}/articles/${article.slug}/brief`)
    }
  }

  const statusOptions = [
    { value: '', label: 'ทุกสถานะ' },
    { value: 'draft', label: 'ร่าง' },
    { value: 'review', label: 'รอตรวจ' },
    { value: 'published', label: 'เผยแพร่แล้ว' },
    { value: 'generating-brief', label: 'กำลังสร้าง Brief' },
    { value: 'brief-ready', label: 'Brief พร้อม' },
    { value: 'generating-article', label: 'กำลังเขียน' },
  ]

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">บทความ</h1>
          <p className="mt-1 text-sm text-slate-500">{total} บทความทั้งหมด</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: '18px' }}>search</span>
          <Input
            placeholder="ค้นหาบทความ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#6467f2] focus:ring-1 focus:ring-[#6467f2]"
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Article Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-3xl text-[#6467f2]">progress_activity</span>
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300" style={{ fontSize: '56px' }}>description</span>
          <h2 className="mt-4 text-lg font-semibold text-slate-700">ยังไม่มีบทความ</h2>
          <p className="mt-1 text-sm text-slate-500">
            {debouncedSearch || statusFilter
              ? 'ไม่พบบทความที่ตรงกับตัวกรอง'
              : 'เริ่มสร้างบทความจากหน้าคำหลัก'}
          </p>
          {!debouncedSearch && !statusFilter && (
            <Button
              className="mt-4 cursor-pointer gap-1"
              onClick={() => router.push(`/projects/${projectId}/keywords`)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>search</span>
              ไปหน้าคำหลัก
            </Button>
          )}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50/80">
                  <th className="px-4 py-3 text-left font-medium text-slate-500">บทความ</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 w-28">สถานะ</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500 w-24">จำนวนคำ</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 w-28">หมวดหมู่</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 w-24">วันที่</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-500 w-16">รูปปก</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr
                    key={article.id}
                    onClick={() => handleArticleClick(article)}
                    className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 line-clamp-1">
                          {article.title || article.slug}
                        </span>
                        {article.primary_keyword && (
                          <span className="mt-0.5 text-xs text-slate-400 line-clamp-1">
                            {article.primary_keyword}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(article.status)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                      {article.content_md ? wordCount(article.content_md).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {article.cluster ? (
                        <Badge variant="secondary" className="text-xs">{article.cluster}</Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(article.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {article.cover_image_url ? (
                        <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: '18px' }}>image</span>
                      ) : (
                        <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '18px' }}>hide_image</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '16px' }}>chevron_right</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
