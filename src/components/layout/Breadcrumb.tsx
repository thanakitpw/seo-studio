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

  useEffect(() => {
    if (!projectId) return
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        if (res.ok) {
          const data = await res.json()
          setProjectName(data.name)
        }
      } catch {
        // ignore
      }
    }
    fetchProject()
  }, [projectId])

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
        const label = pageLabels[segment] ?? segment
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
