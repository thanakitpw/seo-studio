'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface ArticleData {
  id: string
  slug: string
  title: string | null
  primary_keyword: string | null
  content_type: string | null
  brief_md: string | null
  content_md: string | null
  status: string
  token_usage: { brief: number; article: number; total: number } | null
}

interface WritingClientProps {
  article: ArticleData
  projectId: string
  slug: string
}

const COST_PER_TOKEN = 0.00035 // approximate THB per token

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function estimateTargetWords(contentType: string | null): number {
  switch (contentType) {
    case 'Pillar Page': return 2250
    case 'Blog': return 1250
    case 'Landing Page': return 1000
    default: return 1250
  }
}

export default function WritingClient({ article, projectId, slug }: WritingClientProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [tokenCount, setTokenCount] = useState(0)
  const [estimatedCost, setEstimatedCost] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const terminalRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasStartedRef = useRef(false)

  const targetWords = estimateTargetWords(article.content_type)

  const startGeneration = useCallback(async () => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    setIsGenerating(true)
    setError(null)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const res = await fetch('/api/ai/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, projectId }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const text = await res.text()
        setError(text || 'Failed to start generation')
        setIsGenerating(false)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setError('No response stream')
        setIsGenerating(false)
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6)

          try {
            const data = JSON.parse(jsonStr)

            if (data.error) {
              setError(data.error)
              setIsGenerating(false)
              return
            }

            if (data.text) {
              fullContent += data.text
              setContent(fullContent)
              const words = countWords(fullContent)
              setWordCount(words)
              setProgress(Math.min(Math.round((words / targetWords) * 100), 99))
            }

            if (data.done) {
              setTokenCount(data.usage?.total ?? 0)
              setEstimatedCost((data.usage?.total ?? 0) * COST_PER_TOKEN)
              setProgress(100)
              setIsGenerating(false)
              setIsDone(true)
            }
          } catch {
            // skip invalid JSON
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled — save current draft
        setIsGenerating(false)
        setIsDone(true)
        return
      }
      setError(err instanceof Error ? err.message : 'Stream error')
      setIsGenerating(false)
    }
  }, [slug, projectId, targetWords])

  // Auto-trigger generation on mount
  useEffect(() => {
    // ถ้ามี content อยู่แล้ว ไม่ gen ใหม่
    if (article.content_md && (article.status === 'draft' || article.status === 'review' || article.status === 'published')) {
      setContent(article.content_md)
      setWordCount(countWords(article.content_md))
      setTokenCount(article.token_usage?.total ?? 0)
      setEstimatedCost((article.token_usage?.total ?? 0) * COST_PER_TOKEN)
      setProgress(100)
      setIsDone(true)
      return
    }
    startGeneration()
  }, [startGeneration, article.content_md, article.status, article.token_usage])

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [content])

  // Update live stats while generating
  useEffect(() => {
    if (isGenerating && content) {
      const tokens = Math.round(wordCount * 1.5) + (article.token_usage?.brief ?? 0)
      setTokenCount(tokens)
      setEstimatedCost(tokens * COST_PER_TOKEN)
    }
  }, [wordCount, isGenerating, content, article.token_usage?.brief])

  const handleStop = () => {
    abortControllerRef.current?.abort()
    setIsGenerating(false)
    setIsDone(true)
  }

  const handleEdit = () => {
    router.push(`/projects/${projectId}/articles/${slug}/edit`)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#6467f2]">rocket_launch</span>
          <span className="font-semibold text-slate-800">SEO Studio</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#6467f2] flex items-center justify-center">
            <span className="text-white text-sm font-medium">U</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-6 py-10 max-w-4xl mx-auto w-full">
        {/* Title section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {isDone ? 'เขียนบทความเสร็จสิ้น' : 'AI กำลังเขียนบทความ...'}
          </h1>
          <p className="text-slate-500">
            {article.title || article.primary_keyword || slug}
          </p>
        </div>

        {/* Stats chips */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-white border border-slate-200 rounded-full px-4 py-1.5 text-sm font-medium text-slate-700">
            {wordCount.toLocaleString()} คำ
          </div>
          <div className="bg-white border border-slate-200 rounded-full px-4 py-1.5 text-sm font-medium text-slate-700">
            {tokenCount.toLocaleString()} tokens
          </div>
          <div className="bg-white border border-slate-200 rounded-full px-4 py-1.5 text-sm font-medium text-slate-700">
            ≈ ฿{estimatedCost.toFixed(0)}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Terminal area */}
        <div
          ref={terminalRef}
          className="w-full bg-slate-900 rounded-xl p-6 font-mono text-slate-200 text-sm leading-relaxed overflow-y-auto flex-1 min-h-[400px] max-h-[60vh] payload-scrollbar"
        >
          <pre className="whitespace-pre-wrap break-words">
            {content}
            {isGenerating && <span className="markdown-cursor" />}
          </pre>
          {!content && !isGenerating && !error && (
            <div className="text-slate-500 text-center py-10">
              กำลังเริ่มต้น...
            </div>
          )}
        </div>
      </main>

      {/* Bottom bar */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {/* Progress bar */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">ความคืบหน้า</span>
              <span className="text-xs font-medium text-slate-700">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6467f2] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stop button */}
          <button
            onClick={handleStop}
            disabled={!isGenerating}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            หยุดสร้าง
          </button>

          {/* Edit button */}
          <button
            onClick={handleEdit}
            disabled={!isDone}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#6467f2] text-white hover:bg-[#5254d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            เริ่มแก้ไข
          </button>
        </div>
      </div>
    </div>
  )
}
