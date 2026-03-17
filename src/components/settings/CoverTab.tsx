'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Project } from '@/types'

interface CoverTabProps {
  project: Project
  onSave: (data: Partial<Project>) => Promise<void>
}

export default function CoverTab({ project, onSave }: CoverTabProps) {
  const [coverImageStyle, setCoverImageStyle] = useState(
    project.cover_image_style ?? ''
  )
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    try {
      await onSave({
        cover_image_style: coverImageStyle || null,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Cover Image Style */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">
          Cover Image Style
        </label>
        <p className="text-[11px] text-[#94A3B8] leading-[14px]">
          กำหนดสไตล์ default สำหรับ prompt สร้างรูปปก (ใช้กับ fal.ai)
        </p>
        <textarea
          placeholder="เช่น minimal flat illustration, pastel colors, tech theme, clean background"
          value={coverImageStyle}
          onChange={(e) => setCoverImageStyle(e.target.value)}
          rows={5}
          className="w-full rounded-lg border border-[#E2E8F0] bg-transparent px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
        />
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-10 px-5 cursor-pointer"
        >
          {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </div>
    </div>
  )
}
