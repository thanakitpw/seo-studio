'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import GenerateCoverModal from '@/components/images/GenerateCoverModal'
import type { Article } from '@/types'

interface CoverImageTabProps {
  projectId: string
  article: Article
  articles: Article[]
  coverImageStyle?: string | null
  onCoverUpdated: (url: string) => void
}

export default function CoverImageTab({
  projectId,
  article,
  articles,
  coverImageStyle,
  onCoverUpdated,
}: CoverImageTabProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const handleSuccess = () => {
    // Refetch article to get updated cover_image_url
    fetch(`/api/articles/${article.slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.cover_image_url) {
          onCoverUpdated(data.cover_image_url)
        }
      })
      .catch(() => {
        // ignore
      })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">รูปปกบทความ</h3>

      {/* Current cover preview */}
      {article.cover_image_url ? (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <img
            src={article.cover_image_url}
            alt="Cover image"
            className="h-[180px] w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-[180px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50">
          <span className="material-symbols-outlined text-4xl text-slate-300">
            image
          </span>
          <p className="text-sm text-slate-400">ยังไม่มีรูปปก</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => setModalOpen(true)}
          className="cursor-pointer gap-1.5"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
            auto_awesome
          </span>
          สร้างรูปปก
        </Button>
        <Button
          variant="outline"
          disabled
          className="cursor-pointer gap-1.5 opacity-50"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
            upload
          </span>
          อัปโหลดรูป
        </Button>
      </div>

      {/* Generate Modal */}
      <GenerateCoverModal
        projectId={projectId}
        articles={articles}
        coverImageStyle={coverImageStyle}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
        preSelectedArticleId={article.id}
      />
    </div>
  )
}
