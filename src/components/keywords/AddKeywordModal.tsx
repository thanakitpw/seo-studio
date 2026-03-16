'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { generateSlug } from '@/lib/slug'

interface AddKeywordModalProps {
  projectId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const CLUSTERS = [
  'AI & Automation',
  'Digital Marketing',
  'Web Development',
  'Business Strategy',
]

const CONTENT_TYPES = ['Blog', 'Pillar Page', 'Landing Page']

const PRIORITIES = [
  { value: 'Low', label: 'ต่ำ' },
  { value: 'Medium', label: 'ปานกลาง' },
  { value: 'High', label: 'สูง' },
]

export default function AddKeywordModal({
  projectId,
  open,
  onClose,
  onSuccess,
}: AddKeywordModalProps) {
  const [title, setTitle] = useState('')
  const [keyword, setKeyword] = useState('')
  const [slug, setSlug] = useState('')
  const [cluster, setCluster] = useState('')
  const [contentType, setContentType] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Auto-generate slug from title
  useEffect(() => {
    setSlug(generateSlug(title))
  }, [title])

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setTitle('')
      setKeyword('')
      setSlug('')
      setCluster('')
      setContentType('')
      setPriority('Medium')
      setError('')
    }
  }, [open])

  const handleSubmit = async () => {
    if (!title.trim() || !keyword.trim() || !slug.trim() || !cluster || !contentType) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          title: title.trim(),
          primary_keyword: keyword.trim(),
          slug: slug.trim(),
          cluster,
          content_type: contentType,
          priority,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'เกิดข้อผิดพลาด')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-[560px] rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <span
              className="material-symbols-outlined text-[#6467f2]"
              style={{ fontSize: '22px' }}
            >
              add_circle
            </span>
            <h2 className="text-lg font-semibold text-slate-800">เพิ่มคำหลักใหม่</h2>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 pb-4">
          {/* ชื่อบทความ */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">ชื่อบทความ</label>
            <Input
              placeholder="AI Automation คืออะไร"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* คำหลัก */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">คำหลัก</label>
            <div className="relative">
              <span
                className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                style={{ fontSize: '16px' }}
              >
                key
              </span>
              <Input
                placeholder="ai automation"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Slug</label>
            <div className="flex">
              <span className="flex items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                example.com/
              </span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="rounded-l-none"
              />
            </div>
          </div>

          {/* หมวดหมู่ + ประเภท */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">หมวดหมู่</label>
              <select
                value={cluster}
                onChange={(e) => setCluster(e.target.value)}
                className={cn(
                  'h-8 w-full cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                  !cluster && 'text-muted-foreground'
                )}
              >
                <option value="" disabled>
                  เลือกหมวดหมู่
                </option>
                {CLUSTERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">ประเภท</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className={cn(
                  'h-8 w-full cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                  !contentType && 'text-muted-foreground'
                )}
              >
                <option value="" disabled>
                  เลือกประเภท
                </option>
                {CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Priority</label>
            <div className="flex items-center gap-4">
              {PRIORITIES.map((p) => (
                <label
                  key={p.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="radio"
                    name="priority"
                    value={p.value}
                    checked={priority === p.value}
                    onChange={() => setPriority(p.value)}
                    className="h-4 w-4 cursor-pointer accent-[#6467f2]"
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Footer */}
        <Separator />
        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="cursor-pointer gap-1.5"
          >
            {submitting ? (
              <span
                className="material-symbols-outlined animate-spin"
                style={{ fontSize: '15px' }}
              >
                progress_activity
              </span>
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                save
              </span>
            )}
            บันทึกข้อมูล
          </Button>
        </div>
      </div>
    </div>
  )
}
