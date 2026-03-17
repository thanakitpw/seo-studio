'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { AiAssistButton } from '@/components/ui/AiAssistButton'
import { Toolbar } from '@/components/editor/Toolbar'
import { SeoChecklist } from '@/components/editor/SeoChecklist'

// ===== Types =====

interface ArticleData {
  id: string
  slug: string
  title: string | null
  primary_keyword: string | null
  content_type: string | null
  brief_md: string | null
  content_md: string | null
  meta_title: string | null
  meta_description: string | null
  excerpt: string | null
  tags: string[] | null
  status: string
  token_usage: { brief: number; article: number; total: number } | null
  project_id: string | null
}

interface EditorClientProps {
  article: ArticleData
  projectId: string
  slug: string
}

type SidebarTab = 'frontmatter' | 'seo'

// ===== Helpers =====

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

// ===== Component =====

export default function EditorClient({ article, projectId, slug }: EditorClientProps) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Content state
  const [content, setContent] = useState(article.content_md ?? '')
  const [title, setTitle] = useState(article.title ?? '')
  const [metaTitle, setMetaTitle] = useState(article.meta_title ?? '')
  const [metaDescription, setMetaDescription] = useState(article.meta_description ?? '')
  const [excerpt, setExcerpt] = useState(article.excerpt ?? '')
  const [tags, setTags] = useState<string[]>(article.tags ?? [])
  const [tagInput, setTagInput] = useState('')

  // UI state
  const [activeTab, setActiveTab] = useState<SidebarTab>('frontmatter')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({})
  const [wordCount, setWordCount] = useState(countWords(article.content_md ?? ''))

  // Track dirty state for auto-save
  const isDirtyRef = useRef(false)

  // ===== Word count =====
  useEffect(() => {
    setWordCount(countWords(content))
  }, [content])

  // ===== Save function =====
  const saveArticle = useCallback(async () => {
    if (!isDirtyRef.current) return
    setSaveStatus('saving')

    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(article.slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content_md: content,
          meta_title: metaTitle,
          meta_description: metaDescription,
          excerpt,
          tags,
        }),
      })

      if (res.ok) {
        isDirtyRef.current = false
        setSaveStatus('saved')
      } else {
        setSaveStatus('unsaved')
      }
    } catch {
      setSaveStatus('unsaved')
    }
  }, [article.slug, title, content, metaTitle, metaDescription, excerpt, tags])

  // ===== Mark dirty on changes =====
  useEffect(() => {
    isDirtyRef.current = true
    setSaveStatus('unsaved')
  }, [title, content, metaTitle, metaDescription, excerpt, tags])

  // ===== Auto-save every 30s =====
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      if (isDirtyRef.current) {
        saveArticle()
      }
    }, 30000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [saveArticle])

  // ===== Keyboard shortcut Cmd+S =====
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        saveArticle()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [saveArticle])

  // ===== AI Meta Assist =====
  const handleAiMeta = async (fields: ('meta_title' | 'meta_description' | 'excerpt')[]) => {
    const key = fields.join(',')
    setAiLoading(prev => ({ ...prev, [key]: true }))

    try {
      const res = await fetch('/api/ai/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          primaryKeyword: article.primary_keyword ?? '',
          projectId,
          fields,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.meta_title) setMetaTitle(data.meta_title)
        if (data.meta_description) setMetaDescription(data.meta_description)
        if (data.excerpt) setExcerpt(data.excerpt)
      }
    } catch {
      // silently fail
    } finally {
      setAiLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const handleGenerateAll = () => {
    handleAiMeta(['meta_title', 'meta_description', 'excerpt'])
  }

  // ===== Tag management =====
  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  // ===== Publish =====
  const handlePublish = () => {
    saveArticle().then(() => {
      router.push(`/projects/${projectId}/articles/${slug}/publish`)
    })
  }

  // ===== Content change from toolbar =====
  const handleContentChange = (value: string) => {
    setContent(value)
  }

  // ===== Save status display =====
  const saveStatusText = {
    saved: 'บันทึกแล้ว',
    saving: 'กำลังบันทึก...',
    unsaved: 'ยังไม่ได้บันทึก',
  }

  const saveStatusIcon = {
    saved: 'cloud_done',
    saving: 'sync',
    unsaved: 'cloud_off',
  }

  return (
    <div className="flex flex-col h-screen bg-[#f6f6f8]">
      {/* ===== Header ===== */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          {/* Back link */}
          <button
            onClick={() => router.push(`/projects/${projectId}/keywords`)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>คำหลัก</span>
          </button>

          <Separator orientation="vertical" className="h-5" />

          {/* Article title */}
          <h1 className="text-sm font-semibold text-slate-800 truncate max-w-[300px]">
            {title || article.primary_keyword || slug}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Word count */}
          <span className="text-xs text-muted-foreground">
            {wordCount.toLocaleString()} คำ
          </span>

          {/* Save status */}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span
              className={`material-symbols-outlined text-[14px] ${
                saveStatus === 'saving' ? 'animate-spin' : ''
              }`}
            >
              {saveStatusIcon[saveStatus]}
            </span>
            {saveStatusText[saveStatus]}
          </span>

          <Separator orientation="vertical" className="h-5" />

          {/* Save draft button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveArticle()}
            disabled={saveStatus === 'saving'}
            className="cursor-pointer gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">save</span>
            บันทึกร่าง
          </Button>

          {/* Publish button */}
          <Button
            size="sm"
            onClick={handlePublish}
            className="cursor-pointer gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">publish</span>
            เผยแพร่
          </Button>
        </div>
      </header>

      {/* ===== Main: 2-column layout ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ===== Left Sidebar ===== */}
        <aside className="w-[300px] shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          {/* Sidebar tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('frontmatter')}
              className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
                activeTab === 'frontmatter'
                  ? 'text-[#6467f2] border-b-2 border-[#6467f2]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Frontmatter
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
                activeTab === 'seo'
                  ? 'text-[#6467f2] border-b-2 border-[#6467f2]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              SEO Checklist
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'frontmatter' && (
              <FrontmatterTab
                title={title}
                metaTitle={metaTitle}
                metaDescription={metaDescription}
                excerpt={excerpt}
                tags={tags}
                tagInput={tagInput}
                aiLoading={aiLoading}
                onTitleChange={setTitle}
                onMetaTitleChange={setMetaTitle}
                onMetaDescriptionChange={setMetaDescription}
                onExcerptChange={setExcerpt}
                onTagInputChange={setTagInput}
                onAddTag={addTag}
                onRemoveTag={removeTag}
                onTagKeyDown={handleTagKeyDown}
                onAiMeta={handleAiMeta}
                onGenerateAll={handleGenerateAll}
              />
            )}
            {activeTab === 'seo' && (
              <SeoChecklist
                content={content}
                primaryKeyword={article.primary_keyword ?? ''}
                metaTitle={metaTitle}
                metaDescription={metaDescription}
              />
            )}
          </div>
        </aside>

        {/* ===== Center: Editor ===== */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <Toolbar textareaRef={textareaRef} onContentChange={handleContentChange} />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="เริ่มเขียน Markdown ที่นี่..."
            className="flex-1 resize-none bg-white p-6 font-mono text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-300"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            spellCheck={false}
          />
        </main>
      </div>
    </div>
  )
}

// ===== Frontmatter Tab Component =====

interface FrontmatterTabProps {
  title: string
  metaTitle: string
  metaDescription: string
  excerpt: string
  tags: string[]
  tagInput: string
  aiLoading: Record<string, boolean>
  onTitleChange: (v: string) => void
  onMetaTitleChange: (v: string) => void
  onMetaDescriptionChange: (v: string) => void
  onExcerptChange: (v: string) => void
  onTagInputChange: (v: string) => void
  onAddTag: () => void
  onRemoveTag: (tag: string) => void
  onTagKeyDown: (e: React.KeyboardEvent) => void
  onAiMeta: (fields: ('meta_title' | 'meta_description' | 'excerpt')[]) => void
  onGenerateAll: () => void
}

function FrontmatterTab({
  title,
  metaTitle,
  metaDescription,
  excerpt,
  tags,
  tagInput,
  aiLoading,
  onTitleChange,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onExcerptChange,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onTagKeyDown,
  onAiMeta,
  onGenerateAll,
}: FrontmatterTabProps) {
  return (
    <>
      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          ชื่อบทความ
        </label>
        <textarea
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-[#6467f2] focus:ring-2 focus:ring-[#6467f2]/20 resize-none"
          placeholder="ชื่อบทความ"
        />
      </div>

      <Separator />

      {/* Meta Title */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Meta Title
          </label>
          <div className="flex items-center gap-1">
            <span className={`text-xs ${metaTitle.length > 60 ? 'text-red-500' : 'text-slate-400'}`}>
              {metaTitle.length}/60
            </span>
            <AiAssistButton
              onClick={() => onAiMeta(['meta_title'])}
              loading={!!aiLoading['meta_title']}
            />
          </div>
        </div>
        <Input
          value={metaTitle}
          onChange={(e) => onMetaTitleChange(e.target.value)}
          placeholder="Meta title"
        />
      </div>

      {/* Meta Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Meta Description
          </label>
          <div className="flex items-center gap-1">
            <span className={`text-xs ${metaDescription.length > 155 ? 'text-red-500' : 'text-slate-400'}`}>
              {metaDescription.length}/155
            </span>
            <AiAssistButton
              onClick={() => onAiMeta(['meta_description'])}
              loading={!!aiLoading['meta_description']}
            />
          </div>
        </div>
        <textarea
          value={metaDescription}
          onChange={(e) => onMetaDescriptionChange(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-[#6467f2] focus:ring-2 focus:ring-[#6467f2]/20 resize-none"
          placeholder="Meta description"
        />
      </div>

      <Separator />

      {/* Excerpt */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Excerpt
          </label>
          <AiAssistButton
            onClick={() => onAiMeta(['excerpt'])}
            loading={!!aiLoading['excerpt']}
          />
        </div>
        <textarea
          value={excerpt}
          onChange={(e) => onExcerptChange(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-[#6467f2] focus:ring-2 focus:ring-[#6467f2]/20 resize-none"
          placeholder="Excerpt สำหรับแสดงใน card"
        />
      </div>

      <Separator />

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Tags
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="ml-0.5 inline-flex items-center justify-center size-3.5 rounded-full hover:bg-slate-300 transition-colors"
              >
                <span className="material-symbols-outlined text-[10px]">close</span>
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Input
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyDown={onTagKeyDown}
            placeholder="เพิ่ม tag แล้ว Enter"
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onAddTag}
            disabled={!tagInput.trim()}
            className="cursor-pointer shrink-0"
          >
            เพิ่ม
          </Button>
        </div>
      </div>

      <Separator />

      {/* Generate All button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onGenerateAll}
        disabled={!!aiLoading['meta_title,meta_description,excerpt']}
        className="w-full cursor-pointer gap-1.5"
      >
        <span
          className={`material-symbols-outlined text-[16px] text-[#6467f2] ${
            aiLoading['meta_title,meta_description,excerpt'] ? 'animate-spin' : ''
          }`}
        >
          {aiLoading['meta_title,meta_description,excerpt'] ? 'progress_activity' : 'auto_awesome'}
        </span>
        สร้างทั้งหมดด้วย AI
      </Button>
    </>
  )
}
