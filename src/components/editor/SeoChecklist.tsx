'use client'

import { useMemo } from 'react'

interface SeoChecklistProps {
  content: string
  primaryKeyword: string
  metaTitle: string
  metaDescription: string
}

interface CheckItem {
  label: string
  passed: boolean
}

export function SeoChecklist({
  content,
  primaryKeyword,
  metaTitle,
  metaDescription,
}: SeoChecklistProps) {
  const checks = useMemo<CheckItem[]>(() => {
    const lowerContent = content.toLowerCase()
    const lowerKeyword = primaryKeyword.toLowerCase()

    // 1. Primary keyword in H1 (first # heading)
    const h1Match = content.match(/^#\s+(.+)$/m)
    const keywordInH1 = h1Match
      ? h1Match[1].toLowerCase().includes(lowerKeyword)
      : false

    // 2. Keyword in first 100 words
    const first100Words = content.split(/\s+/).slice(0, 100).join(' ').toLowerCase()
    const keywordInFirst100 = first100Words.includes(lowerKeyword)

    // 3. Featured Snippet (paragraph 40-60 words after first heading)
    const paragraphs = content.split(/\n\n+/).filter(p => !p.startsWith('#') && p.trim().length > 0)
    const hasFeaturedSnippet = paragraphs.some(p => {
      const wordCount = p.split(/\s+/).filter(Boolean).length
      return wordCount >= 40 && wordCount <= 60
    })

    // 4. FAQ section
    const hasFaq = lowerContent.includes('## faq') ||
      lowerContent.includes('## คำถามที่พบบ่อย') ||
      lowerContent.includes('คำถามที่พบบ่อย') ||
      (content.match(/\*\*Q[:]/gi) || []).length >= 2

    // 5. Internal links >= 2
    const linkMatches = content.match(/\[.+?\]\(https?:\/\/.+?\)/g) || []
    const hasEnoughLinks = linkMatches.length >= 2

    // 6. Meta title <= 60 chars
    const metaTitleOk = metaTitle.length > 0 && metaTitle.length <= 60

    // 7. Meta desc <= 155 chars
    const metaDescOk = metaDescription.length > 0 && metaDescription.length <= 155

    return [
      { label: 'Primary keyword ใน H1', passed: keywordInH1 },
      { label: 'Keyword ใน 100 คำแรก', passed: keywordInFirst100 },
      { label: 'Featured Snippet (40-60 คำ)', passed: hasFeaturedSnippet },
      { label: 'FAQ section', passed: hasFaq },
      { label: 'Internal links >= 2', passed: hasEnoughLinks },
      { label: 'Meta title <= 60 chars', passed: metaTitleOk },
      { label: 'Meta desc <= 155 chars', passed: metaDescOk },
    ]
  }, [content, primaryKeyword, metaTitle, metaDescription])

  const passedCount = checks.filter(c => c.passed).length
  const total = checks.length
  const progressPct = Math.round((passedCount / total) * 100)

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-700">SEO Score</span>
          <span className="text-xs font-semibold text-[#6467f2]">{passedCount}/{total}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#6467f2] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <ul className="space-y-2">
        {checks.map((check) => (
          <li key={check.label} className="flex items-start gap-2 text-sm">
            <span
              className={`material-symbols-outlined shrink-0 mt-0.5 text-[16px] ${
                check.passed ? 'text-emerald-500' : 'text-slate-300'
              }`}
            >
              {check.passed ? 'check_circle' : 'cancel'}
            </span>
            <span className={check.passed ? 'text-slate-700' : 'text-slate-400'}>
              {check.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
