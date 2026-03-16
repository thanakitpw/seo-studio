'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  projectId?: string
}

const navItems = [
  { label: 'ภาพรวม', icon: 'dashboard', path: 'dashboard' },
  { label: 'คำหลัก', icon: 'key', path: 'keywords' },
  { label: 'บทความ', icon: 'description', path: 'articles' },
  { label: 'รูปปก', icon: 'image', path: 'images' },
  { label: 'ตั้งค่า', icon: 'settings', path: 'settings' },
]

const mockProjects = [
  { id: '1', name: 'Best Solutions' },
  { id: '2', name: 'Tech Blog' },
]

export default function Sidebar({ projectId }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (!projectId) return false
    return pathname.includes(`/projects/${projectId}/${path}`)
  }

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-60'
      } bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-200`}
    >
      {/* Hamburger toggle */}
      <div className="h-14 flex items-center px-3 border-b border-slate-200">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] text-slate-600">
            {collapsed ? 'menu_open' : 'menu'}
          </span>
        </button>
        {!collapsed && (
          <span className="ml-2 text-sm font-semibold text-slate-900">SEO Studio</span>
        )}
      </div>

      {/* Project Navigation */}
      {projectId && (
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                href={`/projects/${projectId}/${item.path}`}
                className={`flex items-center gap-3 h-9 px-3 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${active ? 'text-primary' : ''}`}>
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      )}

      {!projectId && <div className="flex-1" />}

      {/* Project List */}
      <div className="border-t border-slate-200 px-2 py-3">
        {!collapsed && (
          <p className="px-3 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
            โปรเจค
          </p>
        )}
        <div className="space-y-0.5">
          {mockProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}/dashboard`}
              className={`flex items-center gap-3 h-8 px-3 rounded-lg text-sm transition-colors ${
                projectId === project.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">folder</span>
              {!collapsed && (
                <span className="truncate">{project.name}</span>
              )}
            </Link>
          ))}
          <Link
            href="/projects/new"
            className="flex items-center gap-3 h-8 px-3 rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {!collapsed && <span>สร้างใหม่</span>}
          </Link>
        </div>
      </div>
    </aside>
  )
}
