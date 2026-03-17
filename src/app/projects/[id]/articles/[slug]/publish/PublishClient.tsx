'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Article, Project } from '@/types'

interface PublishClientProps {
  article: Article
  project: Project
}

function countWords(text: string | null): number {
  if (!text) return 0
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*_~`>\-|]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function buildChecklist(article: Article) {
  const wordCount = countWords(article.content_md)
  const seoItems = [
    article.meta_title,
    article.meta_description,
    article.excerpt,
    article.tags && article.tags.length > 0,
    article.content_md && wordCount >= 500,
    article.cover_image_url,
    article.cluster,
  ]
  const seoScore = seoItems.filter(Boolean).length

  return [
    {
      label: 'Title ครบถ้วน',
      ok: !!article.meta_title || !!article.title,
    },
    {
      label: 'Meta description ครบถ้วน',
      ok: !!article.meta_description,
    },
    {
      label: `เนื้อหา ${wordCount.toLocaleString()} คำ`,
      ok: wordCount >= 300,
    },
    {
      label: 'รูปปกอัปโหลดแล้ว',
      ok: !!article.cover_image_url,
    },
    {
      label: `SEO Score ${seoScore}/7`,
      ok: seoScore >= 4,
    },
  ]
}

function buildPayload(article: Article) {
  return {
    slug: article.slug,
    title: article.meta_title || article.title,
    excerpt: article.excerpt || '',
    content: '<html>...',
    category: article.cluster || '',
    tags: article.tags || [],
    author_name: 'Best Solutions',
    cover_image: article.cover_image_url || '',
    seo_title: article.meta_title || article.title,
    seo_description: article.meta_description || '',
    published_at: null,
  }
}

export default function PublishClient({ article, project }: PublishClientProps) {
  const router = useRouter()
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const checklist = buildChecklist(article)
  const payload = buildPayload(article)

  const connectionLabel =
    project.connection_type === 'supabase'
      ? 'via Supabase Direct'
      : 'via REST API'

  async function handlePublish() {
    setPublishing(true)
    setError(null)

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: article.slug,
          projectId: project.id,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาดในการเผยแพร่')
        setPublishing(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/projects/${project.id}/articles`)
      }, 2000)
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      setPublishing(false)
    }
  }

  function handleClose() {
    router.back()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-primary">
              send
            </span>
            <h2 className="text-lg font-semibold text-slate-900">
              เผยแพร่บทความ
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Target Info Card */}
          <div className="rounded-xl bg-primary/5 p-4">
            <p className="text-sm text-slate-500">จะเผยแพร่ไปที่</p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {project.name}
            </p>
            <p className="text-sm text-slate-500">
              {project.domain || 'ไม่ระบุโดเมน'}{' '}
              <span className="ml-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {connectionLabel}
              </span>
            </p>
          </div>

          {/* Checklist */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              ตรวจสอบก่อนเผยแพร่
            </h3>
            <div className="space-y-2 rounded-xl bg-slate-50 p-4">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  {item.ok ? (
                    <span className="material-symbols-outlined text-lg text-emerald-500">
                      check_circle
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-lg text-red-400">
                      cancel
                    </span>
                  )}
                  <span
                    className={`text-sm ${
                      item.ok ? 'text-slate-700' : 'text-red-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payload Preview */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              Payload Preview
            </h3>
            <div className="max-h-[160px] overflow-auto rounded-xl bg-slate-900 p-4">
              <pre className="font-mono text-sm text-blue-300">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <span className="material-symbols-outlined text-lg">
                check_circle
              </span>
              เผยแพร่สำเร็จ! กำลังกลับไปหน้ารายการ...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={handleClose}
            disabled={publishing}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing || success}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">send</span>
            {publishing ? 'กำลังเผยแพร่...' : 'เผยแพร่ทันที'}
          </button>
        </div>
      </div>
    </div>
  )
}
