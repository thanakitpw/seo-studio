'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const pageLabels: Record<string, string> = {
  dashboard: 'แดชบอร์ด',
  keywords: 'คีย์เวิร์ด',
  articles: 'บทความ',
  images: 'รูปปก',
  settings: 'ตั้งค่า',
  new: 'สร้างใหม่',
  brief: 'Brief',
  writing: 'AI Writing',
  edit: 'แก้ไข',
  publish: 'เผยแพร่',
}

interface BreadcrumbProps {
  projectId?: string
}

export default function Breadcrumb({ projectId }: BreadcrumbProps) {
  const pathname = usePathname()
  const [projectName, setProjectName] = useState<string>('')
  const [articleTitle, setArticleTitle] = useState<string>('')

  useEffect(() => {
    if (!projectId) return
    async function fetchData() {
      try {
        // Fetch project name
        const projRes = await fetch(`/api/projects/${projectId}`)
        if (projRes.ok) {
          const data = await projRes.json()
          setProjectName(data.name)
        }

        // Fetch article title if in articles path
        const segments = pathname.split('/').filter(Boolean)
        const articlesIdx = segments.indexOf('articles')
        if (articlesIdx !== -1 && segments[articlesIdx + 1]) {
          const articleSlug = decodeURIComponent(segments[articlesIdx + 1])
          const artRes = await fetch(`/api/articles/${encodeURIComponent(articleSlug)}`)
          if (artRes.ok) {
            const artData = await artRes.json()
            if (artData.title) setArticleTitle(artData.title)
          }
        }
      } catch {
        // ignore
      }
    }
    fetchData()
  }, [projectId, pathname])

  if (!projectId) return null

  // Parse current page from pathname
  const segments = pathname.split('/').filter(Boolean)
  const projectIndex = segments.indexOf('projects')
  const pageSegments = segments.slice(projectIndex + 2) // after /projects/[id]/

  return (
    <nav className="flex items-center gap-1.5 text-sm mb-6">
      <Link
        href="/projects"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        โปรเจค
      </Link>

      <span className="material-symbols-outlined text-[14px] text-muted-foreground/50">
        chevron_right
      </span>

      {pageSegments.length > 0 ? (
        <Link
          href={`/projects/${projectId}/dashboard`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {projectName || '...'}
        </Link>
      ) : (
        <span className="text-foreground font-medium">
          {projectName || '...'}
        </span>
      )}

      {pageSegments.map((segment, i) => {
        const isLast = i === pageSegments.length - 1
        const decoded = decodeURIComponent(segment)
        // ถ้า segment เป็น article slug → แสดงชื่อบทความแทน
        const isArticleSlug = i > 0 && pageSegments[i - 1] === 'articles'
        const label = pageLabels[segment] ?? (isArticleSlug && articleTitle ? articleTitle : decoded.replace(/-/g, ' '))
        const href = `/projects/${projectId}/${pageSegments.slice(0, i + 1).join('/')}`

        return (
          <span key={segment + i} className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-muted-foreground/50">
              chevron_right
            </span>
            {isLast ? (
              <span className={cn('font-medium text-foreground')}>{label}</span>
            ) : (
              <Link
                href={href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
