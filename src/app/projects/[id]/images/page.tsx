'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import GenerateCoverModal from '@/components/images/GenerateCoverModal'
import type { CoverImage, Article, Project } from '@/types'
import { toast } from 'sonner'

export default function ImagesPage() {
  const params = useParams()
  const projectId = params.id as string

  const [images, setImages] = useState<CoverImage[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  // Build article lookup map
  const articleMap = new Map(articles.map((a) => [a.id, a]))

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch(`/api/images?project_id=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setImages(data)
      }
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    }
  }, [projectId])

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch(`/api/articles?project_id=${projectId}&limit=1000`)
      if (res.ok) {
        const json = await res.json()
        setArticles(json.data || [])
      }
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    }
  }, [projectId])

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setProject(data)
      }
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    }
  }, [projectId])

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      await Promise.all([fetchImages(), fetchArticles(), fetchProject()])
      setLoading(false)
    }
    loadAll()
  }, [fetchImages, fetchArticles, fetchProject])

  const handleSuccess = () => {
    fetchImages()
  }

  const getStatusBadge = (image: CoverImage) => {
    if (image.status === 'generating') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: '12px' }}>
            progress_activity
          </span>
          กำลังสร้าง
        </span>
      )
    }
    if (image.article_id) {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
          ใช้แล้ว
        </span>
      )
    }
    if (image.status === 'failed') {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
          ล้มเหลว
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        ยังไม่ใช้
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="material-symbols-outlined animate-spin text-3xl text-muted-foreground/50">
          progress_activity
        </span>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">รูปปกบทความ</h1>
          <span className="flex h-5 items-center rounded-full bg-[#6467f2]/10 px-2.5 text-xs font-semibold text-[#6467f2]">
            {images.length}
          </span>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="cursor-pointer gap-1.5"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
            add
          </span>
          สร้างรูปใหม่
        </Button>
      </div>

      {/* Grid */}
      {images.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-6xl text-slate-300">image</span>
          <p className="text-sm text-slate-500">ยังไม่มีรูปปก</p>
          <Button
            onClick={() => setModalOpen(true)}
            className="mt-2 cursor-pointer gap-1.5"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              auto_awesome
            </span>
            สร้างรูปแรก
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-4 gap-4">
          {images.map((image) => {
            const linkedArticle = image.article_id
              ? articleMap.get(image.article_id)
              : null

            return (
              <div
                key={image.id}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
              >
                {/* Thumbnail */}
                {image.image_url ? (
                  <div className="relative aspect-[1200/630] overflow-hidden bg-slate-100">
                    <img
                      src={image.image_url}
                      alt={image.prompt}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[1200/630] items-center justify-center bg-slate-100">
                    {image.status === 'generating' ? (
                      <span className="material-symbols-outlined animate-spin text-2xl text-amber-500">
                        progress_activity
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-2xl text-slate-300">
                        broken_image
                      </span>
                    )}
                  </div>
                )}

                {/* Info */}
                <div className="space-y-1.5 p-3">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(image)}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">
                        {new Date(image.created_at).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      {image.image_url && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              const res = await fetch(image.image_url!)
                              const blob = await res.blob()
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `cover-${image.id.slice(0, 8)}.webp`
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                              URL.revokeObjectURL(url)
                            } catch {
                              // fallback: open in new tab
                              window.open(image.image_url!, '_blank')
                            }
                          }}
                          className="cursor-pointer rounded p-0.5 text-muted-foreground/40 transition-colors hover:text-[#6467f2]"
                          title="ดาวน์โหลด"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (!confirm('ลบรูปนี้?')) return
                          await fetch(`/api/images/${image.id}`, { method: 'DELETE' })
                          fetchImages()
                        }}
                        className="cursor-pointer rounded p-0.5 text-muted-foreground/40 transition-colors hover:text-red-500"
                        title="ลบ"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                      </button>
                    </div>
                  </div>
                  {linkedArticle && (
                    <p className="truncate text-sm font-medium text-slate-700">
                      {linkedArticle.title || linkedArticle.slug}
                    </p>
                  )}
                  <p className="line-clamp-2 text-xs text-slate-500">
                    {image.prompt}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Generate Modal */}
      <GenerateCoverModal
        projectId={projectId}
        articles={articles}
        coverImageStyle={project?.cover_image_style}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
