'use client'

import { cn } from '@/lib/utils'

interface FilterBarProps {
  clusters: string[]
  filters: {
    cluster: string
    status: string
    priority: string
    content_type: string
  }
  onFilterChange: (key: string, value: string) => void
}

const statusOptions = [
  { value: '', label: 'ทุกสถานะ' },
  { value: 'pending', label: 'รอดำเนินการ' },
  { value: 'generating-brief', label: 'กำลังสร้าง Brief' },
  { value: 'brief-ready', label: 'Brief พร้อม' },
  { value: 'generating-article', label: 'กำลังสร้างบทความ' },
  { value: 'draft', label: 'ร่าง' },
  { value: 'review', label: 'รอตรวจ' },
  { value: 'published', label: 'เผยแพร่แล้ว' },
]

const priorityOptions = [
  { value: '', label: 'ทุก Priority' },
  { value: 'High', label: 'สูง' },
  { value: 'Medium', label: 'กลาง' },
  { value: 'Low', label: 'ต่ำ' },
]

const contentTypeOptions = [
  { value: '', label: 'ทุกประเภท' },
  { value: 'Blog', label: 'Blog' },
  { value: 'Pillar Page', label: 'Pillar Page' },
  { value: 'Landing Page', label: 'Landing Page' },
]

function FilterSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-[30px] rounded-full border border-border bg-white px-3 text-sm text-muted-foreground',
        'outline-none focus:border-primary focus:ring-1 focus:ring-primary/30',
        'cursor-pointer appearance-none',
        'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22/%3E%3C/svg%3E")] bg-[length:12px] bg-[right_8px_center] bg-no-repeat pr-7'
      )}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export default function FilterBar({ clusters, filters, onFilterChange }: FilterBarProps) {
  const clusterOptions = [
    { value: '', label: 'ทุกหมวดหมู่' },
    ...clusters.map((c) => ({ value: c, label: c })),
  ]

  return (
    <div className="flex items-center gap-3 py-4">
      <FilterSelect
        value={filters.cluster}
        options={clusterOptions}
        onChange={(v) => onFilterChange('cluster', v)}
      />
      <FilterSelect
        value={filters.status}
        options={statusOptions}
        onChange={(v) => onFilterChange('status', v)}
      />
      <FilterSelect
        value={filters.priority}
        options={priorityOptions}
        onChange={(v) => onFilterChange('priority', v)}
      />
      <FilterSelect
        value={filters.content_type}
        options={contentTypeOptions}
        onChange={(v) => onFilterChange('content_type', v)}
      />
    </div>
  )
}
