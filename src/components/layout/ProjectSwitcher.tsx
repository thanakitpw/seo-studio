'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
}

// Mock data — จะเปลี่ยนเป็น fetch จาก /api/projects ภายหลัง
const mockProjects: Project[] = [
  { id: '1', name: 'Best Solutions' },
  { id: '2', name: 'Tech Blog' },
  { id: '3', name: 'E-Commerce Store' },
]

interface ProjectSwitcherProps {
  currentProjectId?: string
}

export default function ProjectSwitcher({ currentProjectId }: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const currentProject = mockProjects.find((p) => p.id === currentProjectId)
  const filtered = mockProjects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-sm cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px] text-slate-500">folder</span>
        <span className="text-slate-700 font-medium max-w-[180px] truncate">
          {currentProject?.name ?? 'เลือกโปรเจค'}
        </span>
        <span className="material-symbols-outlined text-[18px] text-slate-400">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                placeholder="ค้นหาโปรเจค..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                autoFocus
              />
            </div>
          </div>

          {/* Project List */}
          <div className="py-1 max-h-48 overflow-y-auto">
            {filtered.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}/dashboard`}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  project.id === currentProjectId
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">folder</span>
                <span className="truncate">{project.name}</span>
                {project.id === currentProjectId && (
                  <span className="material-symbols-outlined text-[16px] ml-auto">check</span>
                )}
              </Link>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-400">ไม่พบโปรเจค</p>
            )}
          </div>

          {/* Create new */}
          <div className="border-t border-slate-100 p-1">
            <Link
              href="/projects/new"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>สร้างโปรเจคใหม่</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
