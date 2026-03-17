'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import ConnectionTab from '@/components/settings/ConnectionTab'
import ContentTab from '@/components/settings/ContentTab'
import CoverTab from '@/components/settings/CoverTab'
import GeneralTab from '@/components/settings/GeneralTab'
import type { Project } from '@/types'

const tabs = [
  { key: 'connection', label: 'การเชื่อมต่อ', icon: 'cable' },
  { key: 'content', label: 'เนื้อหา', icon: 'article' },
  { key: 'cover', label: 'รูปปก', icon: 'image' },
  { key: 'general', label: 'ทั่วไป', icon: 'tune' },
] as const

type TabKey = (typeof tabs)[number]['key']

export default function SettingsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('connection')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลโปรเจคได้')
        const data = await res.json()
        setProject(data)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
        )
      } finally {
        setIsLoading(false)
      }
    }
    fetchProject()
  }, [projectId])

  async function handleSave(data: Partial<Project>) {
    setSaveMessage(null)
    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      setSaveMessage(err.error || 'บันทึกไม่สำเร็จ')
      return
    }

    const updated = await res.json()
    setProject(updated)
    setSaveMessage('บันทึกสำเร็จ')
    setTimeout(() => setSaveMessage(null), 3000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="material-symbols-outlined animate-spin text-xl">
            progress_activity
          </span>
          <span className="text-sm">กำลังโหลด...</span>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-4xl text-red-300">
          error
        </span>
        <p className="mt-3 text-sm text-red-500">{error || 'ไม่พบโปรเจค'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">ตั้งค่าโปรเจค</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          จัดการการเชื่อมต่อ เนื้อหา รูปปก และข้อมูลทั่วไปของโปรเจค
        </p>
      </div>

      {/* Save message toast */}
      {saveMessage && (
        <div
          className={cn(
            'rounded-lg px-4 py-3 text-sm',
            saveMessage === 'บันทึกสำเร็จ'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          )}
        >
          {saveMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-xl bg-white border border-[#E2E8F0]">
        {/* Tab buttons */}
        <div className="flex border-b border-[#E2E8F0]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <span className="material-symbols-outlined text-[18px]">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'connection' && (
            <ConnectionTab project={project} onSave={handleSave} />
          )}
          {activeTab === 'content' && (
            <ContentTab project={project} onSave={handleSave} />
          )}
          {activeTab === 'cover' && (
            <CoverTab project={project} onSave={handleSave} />
          )}
          {activeTab === 'general' && (
            <GeneralTab project={project} onSave={handleSave} />
          )}
        </div>
      </div>
    </div>
  )
}
