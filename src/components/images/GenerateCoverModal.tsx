'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { Article } from '@/types'

interface GenerateCoverModalProps {
  projectId: string
  articles: Article[]
  coverImageStyle?: string | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
  /** Pre-select an article when opening from article context */
  preSelectedArticleId?: string
}

const RESOLUTIONS = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
]

const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9' },
  { value: '4:3', label: '4:3' },
  { value: '1:1', label: '1:1' },
]

export default function GenerateCoverModal({
  projectId,
  articles,
  coverImageStyle,
  open,
  onClose,
  onSuccess,
  preSelectedArticleId,
}: GenerateCoverModalProps) {
  const [articleId, setArticleId] = useState('')
  const [prompt, setPrompt] = useState('')
  const [resolution, setResolution] = useState('1K')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [generating, setGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<{ id: string; image_url: string } | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState('')
  const [autoPromptLoading, setAutoPromptLoading] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setArticleId(preSelectedArticleId || '')
      setPrompt('')
      setResolution('1K')
      setAspectRatio('landscape_16_9')
      setGenerating(false)
      setGeneratedImage(null)
      setAssigning(false)
      setError('')
    }
  }, [open, preSelectedArticleId])

  const selectedArticle = articles.find((a) => a.id === articleId)

  const handleAutoPrompt = async () => {
    if (!selectedArticle) {
      setError('กรุณาเลือกบทความก่อน')
      return
    }

    setAutoPromptLoading(true)
    try {
      const style = coverImageStyle || 'modern, clean, professional'
      const autoPrompt = `${style}, blog cover image for article titled "${selectedArticle.title}", ${selectedArticle.primary_keyword || ''}, high quality digital illustration, minimal text`
      setPrompt(autoPrompt)
    } finally {
      setAutoPromptLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('กรุณาใส่ prompt')
      return
    }

    setGenerating(true)
    setError('')
    setGeneratedImage(null)

    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          article_id: articleId || undefined,
          prompt: prompt.trim(),
          resolution,
          aspect_ratio: aspectRatio,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'เกิดข้อผิดพลาด')
      }

      setGeneratedImage({ id: json.id, image_url: json.image_url })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setGenerating(false)
    }
  }

  const handleUseImage = async () => {
    if (!generatedImage || !articleId) {
      // If no article selected, just close and refresh
      onSuccess()
      onClose()
      return
    }

    setAssigning(true)
    setError('')

    try {
      const res = await fetch(`/api/images/${generatedImage.id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
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
      setAssigning(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !generating) onClose()
      }}
    >
      <div className="w-full max-w-[640px] rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <span
              className="material-symbols-outlined text-[#6467f2]"
              style={{ fontSize: '22px' }}
            >
              auto_awesome
            </span>
            <h2 className="text-lg font-semibold text-slate-800">สร้างรูปปก</h2>
          </div>
          <button
            onClick={onClose}
            disabled={generating}
            className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 pb-4">
          {/* Article select */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">บทความ (ไม่บังคับ)</label>
            <select
              value={articleId}
              onChange={(e) => setArticleId(e.target.value)}
              disabled={generating}
              className={cn(
                'h-8 w-full cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                !articleId && 'text-muted-foreground'
              )}
            >
              <option value="">ไม่เลือกบทความ</option>
              {articles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title || a.slug}
                </option>
              ))}
            </select>
          </div>

          {/* Prompt */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Prompt</label>
              <button
                onClick={handleAutoPrompt}
                disabled={generating || autoPromptLoading}
                className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-[#6467f2] transition-colors hover:bg-[#6467f2]/10 disabled:opacity-50"
              >
                {autoPromptLoading ? (
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '12px' }}>
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                    auto_awesome
                  </span>
                )}
                Auto-generate prompt
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={generating}
              placeholder="อธิบายรูปปกที่ต้องการ เช่น modern minimalist blog cover about AI automation..."
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            />
          </div>

          {/* Resolution + Aspect Ratio */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Resolution</label>
              <div className="flex items-center gap-3">
                {RESOLUTIONS.map((r) => (
                  <label
                    key={r.value}
                    className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-700"
                  >
                    <input
                      type="radio"
                      name="resolution"
                      value={r.value}
                      checked={resolution === r.value}
                      onChange={() => setResolution(r.value)}
                      disabled={generating}
                      className="h-4 w-4 cursor-pointer accent-[#6467f2]"
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Aspect Ratio</label>
              <div className="flex items-center gap-3">
                {ASPECT_RATIOS.map((a) => (
                  <label
                    key={a.value}
                    className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-700"
                  >
                    <input
                      type="radio"
                      name="aspect_ratio"
                      value={a.value}
                      checked={aspectRatio === a.value}
                      onChange={() => setAspectRatio(a.value)}
                      disabled={generating}
                      className="h-4 w-4 cursor-pointer accent-[#6467f2]"
                    />
                    {a.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Preview area */}
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {generating ? (
              <div className="flex h-[200px] flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined animate-spin text-3xl text-[#6467f2]">
                  progress_activity
                </span>
                <p className="text-sm text-slate-500">กำลังสร้างรูปปก...</p>
              </div>
            ) : generatedImage ? (
              <img
                src={generatedImage.image_url}
                alt="Generated cover"
                className="h-[200px] w-full object-cover"
              />
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-4xl text-slate-300">
                  image
                </span>
                <p className="text-sm text-slate-400">ตัวอย่างรูปจะแสดงที่นี่</p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <Separator />
        <div className="flex items-center justify-between px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={generating || assigning}
            className="cursor-pointer"
          >
            ยกเลิก
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant={generatedImage ? 'outline' : 'default'}
              onClick={handleGenerate}
              disabled={generating || assigning || !prompt.trim()}
              className="cursor-pointer gap-1.5"
            >
              {generating ? (
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: '15px' }}>
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  auto_awesome
                </span>
              )}
              {generatedImage ? 'สร้างใหม่' : 'สร้างรูป'}
            </Button>
            {generatedImage && (
              <Button
                onClick={handleUseImage}
                disabled={assigning}
                className="cursor-pointer gap-1.5"
              >
                {assigning ? (
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '15px' }}>
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                    check_circle
                  </span>
                )}
                ใช้รูปนี้
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
