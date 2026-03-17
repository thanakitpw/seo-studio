'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useRouter } from 'next/navigation'
import type { Project } from '@/types'

interface GeneralTabProps {
  project: Project
  onSave: (data: Partial<Project>) => Promise<void>
}

export default function GeneralTab({ project, onSave }: GeneralTabProps) {
  const router = useRouter()
  const [name, setName] = useState(project.name)
  const [domain, setDomain] = useState(project.domain ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [archiveConfirm, setArchiveConfirm] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    try {
      await onSave({
        name: name.trim(),
        domain: domain.trim() || null,
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleArchive() {
    if (!archiveConfirm) {
      setArchiveConfirm(true)
      return
    }

    setIsArchiving(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push('/projects')
      }
    } finally {
      setIsArchiving(false)
      setArchiveConfirm(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ชื่อโปรเจค */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">
          ชื่อโปรเจค
        </label>
        <Input
          type="text"
          placeholder="เช่น Best Solutions"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-[42px] rounded-lg px-3.5 text-sm border-[#E2E8F0]"
        />
      </div>

      {/* Domain */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Domain</label>
        <Input
          type="text"
          placeholder="example.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="h-[42px] rounded-lg px-3.5 text-sm border-[#E2E8F0]"
        />
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="h-10 px-5 cursor-pointer"
        >
          {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </div>

      <Separator className="my-2" />

      {/* Danger Zone */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-red-600">Danger Zone</h3>
        <p className="text-[13px] text-slate-500">
          Archive โปรเจคจะทำให้โปรเจคไม่แสดงในรายการ
          แต่ข้อมูลทั้งหมดจะยังคงอยู่
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleArchive}
            disabled={isArchiving}
            className="h-10 px-4 cursor-pointer border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <span className="material-symbols-outlined text-[16px]">
              archive
            </span>
            {isArchiving
              ? 'กำลังดำเนินการ...'
              : archiveConfirm
                ? 'คลิกอีกครั้งเพื่อยืนยัน'
                : 'Archive โปรเจค'}
          </Button>
          {archiveConfirm && !isArchiving && (
            <Button
              variant="ghost"
              onClick={() => setArchiveConfirm(false)}
              className="h-10 px-3 cursor-pointer text-slate-500"
            >
              ยกเลิก
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
