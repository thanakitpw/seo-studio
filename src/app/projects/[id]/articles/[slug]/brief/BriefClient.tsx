'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { marked } from 'marked'
import type { Keyword, Article, Project } from '@/types'

interface BriefClientProps {
  project: Pick<Project, 'id' | 'name' | 'brand_voice' | 'writing_rules' | 'site_inventory'>
  keyword: Keyword
  initialArticle: Article | null
  projectId: string
}

const PRIORITY_MAP: Record<string, { label: string; class: string }> = {
  High: { label: 'สูง', class: 'bg-red-100 text-red-700' },
  Medium: { label: 'ปานกลาง', class: 'bg-amber-100 text-amber-700' },
  Low: { label: 'ต่ำ', class: 'bg-slate-100 text-slate-600' },
}

const WORD_LIMITS: Record<string, string> = {
  'Pillar Page': '2,000-2,500',
  'Blog': '1,000-1,500',
  'Landing Page': '800-1,200',
}

function getKdColor(kd: number): string {
  if (kd <= 30) return 'bg-emerald-400'
  if (kd <= 60) return 'bg-orange-400'
  return 'bg-red-400'
}

export default function BriefClient({ project, keyword, initialArticle, projectId }: BriefClientProps) {
  const router = useRouter()
  const [briefMd, setBriefMd] = useState(initialArticle?.brief_md ?? '')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isDone, setIsDone] = useState(!!initialArticle?.brief_md)
  const [articleSlug, setArticleSlug] = useState(initialArticle?.slug ?? '')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const generateBrief = useCallback(async () => {
    setIsStreaming(true)
    setIsDone(false)
    setBriefMd('')
    setError('')

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/ai/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywordId: keyword.id, projectId }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        setError('ไม่สามารถเริ่มสร้าง Brief ได้')
        setIsStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6)
          try {
            const data = JSON.parse(jsonStr)
            if (data.text) {
              accumulated += data.text
              setBriefMd(accumulated)
              // Auto scroll
              if (contentRef.current) {
                contentRef.current.scrollTop = contentRef.current.scrollHeight
              }
            }
            if (data.done) {
              setArticleSlug(data.slug)
              setIsDone(true)
            }
            if (data.error) {
              setError(data.error)
            }
          } catch {
            // skip invalid JSON
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError('เกิดข้อผิดพลาดในการสร้าง Brief')
    } finally {
      setIsStreaming(false)
    }
  }, [keyword.id, projectId])

  // Auto-trigger if no brief exists
  useEffect(() => {
    if (!initialArticle?.brief_md) {
      generateBrief()
    }
    return () => {
      abortRef.current?.abort('component unmounted')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(briefMd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = () => {
    abortRef.current?.abort()
    generateBrief()
  }

  const handleNextStep = () => {
    const slug = articleSlug || keyword.slug
    router.push(`/projects/${projectId}/articles/${slug}/writing`)
  }

  const briefHtml = briefMd ? marked.parse(briefMd) : ''
  const priority = PRIORITY_MAP[keyword.priority] ?? PRIORITY_MAP.Medium
  const wordLimit = WORD_LIMITS[keyword.content_type] ?? '1,000-1,500'

  return (
    <div className="p-8">
      {/* Breadcrumb + Progress */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.push(`/projects/${projectId}/keywords`)}
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
            คำหลัก
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-medium">{keyword.title}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-[#6467f2] font-medium">Brief</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">ขั้นตอน</span>
          <span className="flex h-6 items-center rounded-full bg-[#6467f2]/10 px-2.5 text-xs font-semibold text-[#6467f2]">
            1/4
          </span>
        </div>
      </div>

      {/* 2-Panel Layout */}
      <div className="flex gap-6">
        {/* Left Panel - Keyword Info */}
        <div className="w-[320px] shrink-0 space-y-4">
          {/* Keyword Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">ข้อมูลคำหลัก</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">คำหลัก</span>
                <span className="text-sm font-medium">{keyword.primary_keyword}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">ปริมาณค้นหา</span>
                <span className="text-sm font-medium">
                  {keyword.volume ? `${keyword.volume.toLocaleString()}/เดือน` : '-'}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">ความยาก</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{keyword.kd ?? '-'}</span>
                  {keyword.kd !== null && (
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${getKdColor(keyword.kd)}`}
                        style={{ width: `${Math.min(keyword.kd, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">ประเภท</span>
                <Badge variant="secondary" className="text-xs">{keyword.content_type}</Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">หมวดหมู่</span>
                <span className="text-sm font-medium">{keyword.cluster}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Priority</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priority.class}`}>
                  {priority.label}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestion */}
          <Card>
            <CardContent className="rounded-xl bg-[#6467f2]/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6467f2]" style={{ fontSize: '18px' }}>auto_awesome</span>
                <span className="text-sm font-semibold text-[#6467f2]">AI แนะนำ</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                บทความ {keyword.content_type} เกี่ยวกับ &quot;{keyword.primary_keyword}&quot;
                ควรมีจำนวนคำประมาณ {wordLimit} คำ และควรเน้น
                Featured Snippet เพื่อเพิ่มโอกาสติดอันดับ
              </p>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">การตั้งค่า</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">จำนวนคำ</span>
                <span className="text-sm font-medium">{wordLimit} คำ</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">ภาษา</span>
                <span className="text-sm font-medium">ไทย</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Tone</span>
                <span className="text-sm font-medium">
                  {project.brand_voice ? project.brand_voice.slice(0, 30) + (project.brand_voice.length > 30 ? '...' : '') : 'Professional'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Brief Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Card className="flex flex-1 flex-col">
            {/* Header */}
            <CardHeader className="flex-row items-center justify-between border-b">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6467f2]" style={{ fontSize: '20px' }}>description</span>
                <CardTitle className="text-base font-semibold">Content Brief</CardTitle>
                {isStreaming && (
                  <span className="flex items-center gap-1 text-xs text-[#6467f2]">
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: '14px' }}>progress_activity</span>
                    กำลังสร้าง...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!briefMd || isStreaming}
                  className="cursor-pointer gap-1"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isStreaming}
                  className="cursor-pointer gap-1"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>refresh</span>
                  สร้างใหม่
                </Button>
              </div>
            </CardHeader>

            {/* Brief Content */}
            <CardContent className="flex-1 overflow-hidden p-0">
              <div
                ref={contentRef}
                className="h-[calc(100vh-340px)] overflow-y-auto p-6"
              >
                {error && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <span className="material-symbols-outlined mr-2 align-middle" style={{ fontSize: '16px' }}>error</span>
                    {error}
                  </div>
                )}

                {!briefMd && !isStreaming && !error && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <span className="material-symbols-outlined mb-3 text-4xl text-muted-foreground/30">description</span>
                    <p className="text-sm text-muted-foreground">ยังไม่มี Brief กำลังเตรียมสร้าง...</p>
                  </div>
                )}

                {briefMd && (
                  <div
                    className="prose prose-sm max-w-none overflow-x-hidden break-words prose-headings:text-foreground prose-h2:mt-6 prose-h2:mb-2 prose-h2:text-lg prose-h2:font-bold prose-h3:mt-4 prose-h3:mb-1 prose-h3:text-base prose-h3:font-semibold prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-pre:overflow-x-auto prose-pre:max-w-full prose-code:break-all"
                    dangerouslySetInnerHTML={{ __html: typeof briefHtml === 'string' ? briefHtml : '' }}
                  />
                )}

                {isStreaming && (
                  <span className="inline-block h-4 w-2 animate-pulse bg-[#6467f2]" />
                )}
              </div>
            </CardContent>

            {/* Bottom Action */}
            <div className="border-t p-4">
              <Button
                size="lg"
                onClick={handleNextStep}
                disabled={!isDone}
                className="w-full cursor-pointer gap-2 text-sm"
              >
                ขั้นตอนถัดไป: เขียนบทความ
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
