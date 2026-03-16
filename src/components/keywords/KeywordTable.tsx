'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Keyword, KeywordStatus } from '@/types'

interface KeywordTableProps {
  keywords: Keyword[]
  onView: (keyword: Keyword) => void
  onDelete?: (keyword: Keyword) => void
}

// Status display config
const statusConfig: Record<KeywordStatus, { label: string; className: string; icon: string }> = {
  published: {
    label: 'เผยแพร่แล้ว',
    className: 'bg-emerald-50 text-emerald-600',
    icon: 'check_circle',
  },
  pending: {
    label: 'รอดำเนินการ',
    className: 'bg-amber-50 text-amber-600',
    icon: 'radio_button_unchecked',
  },
  draft: {
    label: 'ร่าง',
    className: 'bg-muted text-muted-foreground',
    icon: 'edit_note',
  },
  review: {
    label: 'รอตรวจ',
    className: 'bg-blue-50 text-blue-600',
    icon: 'visibility',
  },
  'generating-brief': {
    label: 'กำลังสร้าง',
    className: 'bg-primary/10 text-primary',
    icon: 'hourglass_empty',
  },
  'brief-ready': {
    label: 'Brief พร้อม',
    className: 'bg-violet-50 text-violet-600',
    icon: 'description',
  },
  'generating-article': {
    label: 'กำลังสร้าง',
    className: 'bg-primary/10 text-primary',
    icon: 'hourglass_empty',
  },
}

// Priority display
const priorityConfig: Record<string, { label: string; color: string }> = {
  High: { label: 'สูง', color: 'bg-red-400' },
  Medium: { label: 'กลาง', color: 'bg-amber-400' },
  Low: { label: 'ต่ำ', color: 'bg-emerald-400' },
}

// KD bar color
function getKdColor(kd: number): string {
  if (kd <= 30) return 'bg-emerald-400'
  if (kd <= 60) return 'bg-amber-400'
  return 'bg-red-400'
}

// Action text based on status
function getActionText(status: KeywordStatus): string {
  switch (status) {
    case 'published':
      return 'ดู'
    case 'draft':
    case 'review':
      return 'แก้ไข'
    case 'pending':
    case 'brief-ready':
      return 'เริ่มเขียน'
    case 'generating-brief':
    case 'generating-article':
      return '—'
    default:
      return 'ดู'
  }
}

type SortField = 'title' | 'primary_keyword' | 'cluster' | 'kd' | 'volume' | 'content_type' | 'priority' | 'status'
type SortDir = 'asc' | 'desc'

const priorityOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1 }

export default function KeywordTable({ keywords, onView, onDelete }: KeywordTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleAll = () => {
    if (selected.size === keywords.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(keywords.map((k) => k.id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortedKeywords = [...keywords].sort((a, b) => {
    if (!sortField) return 0
    const dir = sortDir === 'asc' ? 1 : -1

    if (sortField === 'kd') return ((a.kd ?? 0) - (b.kd ?? 0)) * dir
    if (sortField === 'volume') return ((a.volume ?? 0) - (b.volume ?? 0)) * dir
    if (sortField === 'priority') return ((priorityOrder[a.priority] ?? 0) - (priorityOrder[b.priority] ?? 0)) * dir

    const aVal = String(a[sortField] ?? '')
    const bVal = String(b[sortField] ?? '')
    return aVal.localeCompare(bVal) * dir
  })

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="cursor-pointer select-none px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
            {sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}
          </span>
        )}
      </div>
    </th>
  )

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 bg-muted/30">
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer rounded border-border accent-[#6467f2]"
                checked={keywords.length > 0 && selected.size === keywords.length}
                onChange={toggleAll}
              />
            </th>
            <SortableHeader field="title">ชื่อบทความ</SortableHeader>
            <SortableHeader field="primary_keyword">คำหลัก</SortableHeader>
            <SortableHeader field="cluster">หมวดหมู่</SortableHeader>
            <SortableHeader field="content_type">ประเภท</SortableHeader>
            <SortableHeader field="priority">Priority</SortableHeader>
            <SortableHeader field="status">สถานะ</SortableHeader>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedKeywords.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                <span className="material-symbols-outlined mb-2 block text-4xl">search_off</span>
                ไม่พบคำหลัก
              </td>
            </tr>
          ) : (
            sortedKeywords.map((keyword) => {
              const status = statusConfig[keyword.status] || statusConfig.pending
              const priority = priorityConfig[keyword.priority] || priorityConfig.Medium
              const kd = keyword.kd
              const volume = keyword.volume

              return (
                <tr
                  key={keyword.id}
                  className="h-14 border-b border-border/50 transition-colors hover:bg-muted/30"
                >
                  <td className="w-10 px-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer rounded border-border accent-[#6467f2]"
                      checked={selected.has(keyword.id)}
                      onChange={() => toggleOne(keyword.id)}
                    />
                  </td>
                  <td className="px-3 font-medium text-foreground whitespace-nowrap">
                    {keyword.title}
                  </td>
                  <td className="px-3 text-sm text-muted-foreground">
                    {keyword.primary_keyword}
                  </td>
                  <td className="px-3 text-sm text-muted-foreground">
                    {keyword.cluster}
                  </td>
                  <td className="px-3 text-sm text-muted-foreground">
                    {keyword.content_type === 'Pillar Page' ? 'Pillar' : keyword.content_type}
                  </td>
                  <td className="px-3">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('inline-block size-2 rounded-full', priority.color)} />
                      <span className="text-sm text-foreground">{priority.label}</span>
                    </div>
                  </td>
                  <td className="px-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                        status.className
                      )}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                        {status.icon}
                      </span>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-3">
                    <div className="flex items-center gap-2">
                      {getActionText(keyword.status) !== '—' ? (
                        <button
                          onClick={() => onView(keyword)}
                          className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
                        >
                          {getActionText(keyword.status)}
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(keyword)}
                          className="cursor-pointer text-sm text-muted-foreground/50 transition-colors hover:text-red-500"
                          title="ลบ"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
