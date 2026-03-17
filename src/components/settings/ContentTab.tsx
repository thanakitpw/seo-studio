'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Project } from '@/types'

interface ContentTabProps {
  project: Project
  onSave: (data: Partial<Project>) => Promise<void>
}

export default function ContentTab({ project, onSave }: ContentTabProps) {
  const [brandVoice, setBrandVoice] = useState(project.brand_voice ?? '')
  const [writingRules, setWritingRules] = useState(project.writing_rules ?? '')
  const [siteInventory, setSiteInventory] = useState(
    project.site_inventory ?? ''
  )
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    try {
      await onSave({
        brand_voice: brandVoice || null,
        writing_rules: writingRules || null,
        site_inventory: siteInventory || null,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Brand Voice */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">
          Brand Voice
        </label>
        <p className="text-[11px] text-[#94A3B8] leading-[14px]">
          กำหนดโทนเสียงของแบรนด์สำหรับ AI Writer
        </p>
        <textarea
          placeholder="เช่น เป็นกันเอง ใช้ภาษาเข้าใจง่าย เน้นความน่าเชื่อถือ"
          value={brandVoice}
          onChange={(e) => setBrandVoice(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-[#E2E8F0] bg-transparent px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
        />
      </div>

      {/* Writing Rules */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">
          Writing Rules
        </label>
        <p className="text-[11px] text-[#94A3B8] leading-[14px]">
          กฎการเขียนที่ AI ต้องปฏิบัติตาม
        </p>
        <textarea
          placeholder='เช่น ห้ามใช้ ":" ในเนื้อหา, ห้ามใช้ "สำหรับ SME" ใน heading'
          value={writingRules}
          onChange={(e) => setWritingRules(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-[#E2E8F0] bg-transparent px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
        />
      </div>

      {/* Site Inventory */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">
          Site Inventory
        </label>
        <p className="text-[11px] text-[#94A3B8] leading-[14px]">
          รายการหน้าในเว็บไซต์สำหรับ internal linking
        </p>
        <textarea
          placeholder="รายการหน้าในเว็บไซต์ เช่น /services - บริการ, /about - เกี่ยวกับเรา"
          value={siteInventory}
          onChange={(e) => setSiteInventory(e.target.value)}
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
