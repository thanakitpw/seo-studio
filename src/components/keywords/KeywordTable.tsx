'use client'

import { cn } from '@/lib/utils'
import type { Keyword, KeywordStatus } from '@/types'

interface KeywordTableProps {
  keywords: Keyword[]
  onView: (keyword: Keyword) => void
}

// Status display config
const statusConfig: Record<KeywordStatus, { label: string; className: string; icon: string }> = {
  published: {
    label: 'เผยแพร่แล้ว',
    className: 'bg-emerald-100 text-emerald-700',
    icon: 'check_circle',
  },
  pending: {
    label: 'รอดำเนินการ',
    className: 'bg-amber-100 text-amber-700',
    icon: 'schedule',
  },
  draft: {
    label: 'ร่าง',
    className: 'bg-slate-100 text-slate-600',
    icon: 'edit_note',
  },
  review: {
    label: 'รอตรวจ',
    className: 'bg-blue-100 text-blue-700',
    icon: 'visibility',
  },
  'generating-brief': {
    label: 'กำลังสร้าง',
    className: 'bg-[#6467f2]/10 text-[#6467f2]',
    icon: 'autorenew',
  },
  'brief-ready': {
    label: 'Brief พร้อม',
    className: 'bg-violet-100 text-violet-700',
    icon: 'description',
  },
  'generating-article': {
    label: 'กำลังสร้าง',
    className: 'bg-[#6467f2]/10 text-[#6467f2]',
    icon: 'autorenew',
  },
}

// Priority display
const priorityConfig: Record<string, { label: string; color: string }> = {
  High: { label: 'สูง', color: 'bg-red-500' },
  Medium: { label: 'กลาง', color: 'bg-amber-400' },
  Low: { label: 'ต่ำ', color: 'bg-emerald-400' },
}

// KD bar color
function getKdColor(kd: number): string {
  if (kd <= 30) return 'bg-emerald-400'
  if (kd <= 60) return 'bg-orange-400'
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
      return '--'
    default:
      return 'ดู'
  }
}

export default function KeywordTable({ keywords, onView }: KeywordTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                disabled
              />
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
              ชื่อบทความ
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
              คำหลัก
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
              หมวดหมู่
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
              KD
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
              ปริมาณ
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
              ประเภท
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
              Priority
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
              สถานะ
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {keywords.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                <span className="material-symbols-outlined mb-2 block text-4xl">search_off</span>
                ไม่พบคำหลัก
              </td>
            </tr>
          ) : (
            keywords.map((keyword) => {
              const status = statusConfig[keyword.status] || statusConfig.pending
              const priority = priorityConfig[keyword.priority] || priorityConfig.Medium
              // KD and volume are not in the Keyword type yet, so we use placeholders
              const kd = 0
              const volume = 0

              return (
                <tr
                  key={keyword.id}
                  className="border-b border-slate-50 transition-colors hover:bg-slate-50/50"
                >
                  <td className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-3 font-medium text-slate-800">
                    {keyword.title}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {keyword.primary_keyword}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {keyword.cluster}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700">{kd}</span>
                      <div className="h-1 w-9 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn('h-full rounded-full', getKdColor(kd))}
                          style={{ width: `${Math.min(kd, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {volume > 0 ? volume.toLocaleString() : '-'}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {keyword.content_type === 'Pillar Page' ? 'Pillar' : keyword.content_type}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('inline-block h-1.5 w-1.5 rounded-full', priority.color)} />
                      <span className="text-slate-600">{priority.label}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                        status.className
                      )}
                    >
                      <span className="material-symbols-outlined text-xs" style={{ fontSize: '12px' }}>
                        {status.icon}
                      </span>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {getActionText(keyword.status) !== '--' ? (
                      <button
                        onClick={() => onView(keyword)}
                        className="text-sm font-medium text-[#6467f2] hover:underline"
                      >
                        {getActionText(keyword.status)}
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">--</span>
                    )}
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
