'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const segmentLabels: Record<string, string> = {
  projects: 'โปรเจค',
  dashboard: 'ภาพรวม',
  keywords: 'คำหลัก',
  articles: 'บทความ',
  images: 'รูปปก',
  settings: 'ตั้งค่า',
  new: 'สร้างใหม่',
}

export default function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Build breadcrumb items
  const items: { label: string; href: string }[] = []

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const href = '/' + segments.slice(0, i + 1).join('/')

    // Skip [id] segment as standalone — it will be shown as project name
    if (i > 0 && segments[i - 1] === 'projects' && !segmentLabels[segment]) {
      // This is a project ID — show as project name (mock)
      items.push({ label: 'Best Solutions', href })
      continue
    }

    const label = segmentLabels[segment] ?? segment
    items.push({ label, href })
  }

  if (items.length <= 1) return null

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={item.href} className="flex items-center gap-1.5">
            {index > 0 && (
              <span className="material-symbols-outlined text-[16px] text-slate-300">
                chevron_right
              </span>
            )}
            {isLast ? (
              <span className="text-slate-900 font-medium">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
