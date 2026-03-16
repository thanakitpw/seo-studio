'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface SidebarProps {
  projectId?: string
}

const projectNavItems = [
  { label: 'ภาพรวม', icon: 'grid_view', path: 'dashboard' },
  { label: 'คำหลัก', icon: 'search', path: 'keywords' },
  { label: 'บทความ', icon: 'description', path: 'articles' },
  { label: 'รูปปก', icon: 'image', path: 'images' },
  { label: 'ตั้งค่า', icon: 'settings', path: 'settings' },
]

const homeNavItems = [
  { label: 'โปรเจคทั้งหมด', icon: 'folder', path: '/projects' },
  { label: 'ภาพรวม', icon: 'grid_view', path: '/projects/overview' },
]

// Mock data — จะเปลี่ยนเป็น fetch จาก /api/projects ภายหลัง
const mockProjects = [
  { id: '1', name: 'Best Solutions', initials: 'BS', color: 'bg-[#6467f2]' },
  { id: '2', name: 'Client A', initials: 'CA', color: 'bg-[#f59e0b]' },
  { id: '3', name: 'Client B', initials: 'CB', color: 'bg-[#10b981]' },
]

export default function Sidebar({ projectId }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const isProjectNav = !!projectId
  const navItems = isProjectNav ? projectNavItems : homeNavItems

  const isActive = (path: string) => {
    if (isProjectNav) {
      return pathname.includes(`/projects/${projectId}/${path}`)
    }
    // Home nav: exact match or startsWith
    if (path === '/projects') {
      return pathname === '/projects' || pathname === '/projects/'
    }
    return pathname.startsWith(path)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch {
      // ignore
    }
  }

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0 h-full">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 flex items-center gap-3">
        <div className="size-9 rounded-full bg-gradient-to-br from-[#6467f2] to-[#8b5cf6] flex items-center justify-center text-white shrink-0">
          <span className="material-symbols-outlined text-[20px]">edit_note</span>
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">SEO Studio</div>
          <div className="text-xs text-slate-400">v2.0</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-0.5 flex-1">
        {navItems.map((item) => {
          const href = isProjectNav
            ? `/projects/${projectId}/${item.path}`
            : item.path
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              href={href}
              className={`flex items-center gap-3 h-10 px-3 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  active ? 'text-primary' : 'text-slate-400'
                }`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* PROJECTS Section */}
      <div className="px-3 pb-2">
        <p className="px-3 mb-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          PROJECTS
        </p>
        <div className="space-y-0.5">
          {mockProjects.map((project) => {
            const active = projectId === project.id
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}/dashboard`}
                className={`flex items-center gap-3 h-9 px-3 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`size-6 rounded-full ${project.color} flex items-center justify-center text-white text-[10px] font-semibold shrink-0`}
                >
                  {project.initials}
                </div>
                <span className="truncate">{project.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* User Profile */}
      <div className="border-t border-slate-200 px-3 py-3">
        <div className="flex items-center gap-3 px-3">
          <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
            TK
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">Thanakit</div>
            <div className="text-xs text-slate-400">Admin</div>
          </div>
          <button
            onClick={handleLogout}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
            title="ออกจากระบบ"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
