'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Project } from '@/types'

interface SidebarProps {
  projectId?: string
  collapsed?: boolean
  onToggle?: () => void
}

const projectNavItems = [
  { label: 'แดชบอร์ด', icon: 'grid_view', path: 'dashboard' },
  { label: 'คีย์เวิร์ด', icon: 'search', path: 'keywords' },
  { label: 'บทความ', icon: 'description', path: 'articles' },
  { label: 'รูปปก', icon: 'image', path: 'images' },
  { label: 'ตั้งค่า', icon: 'settings', path: 'settings' },
]

const homeNavItems = [
  { label: 'โปรเจคทั้งหมด', icon: 'folder', path: '/projects' },
  { label: 'ภาพรวม', icon: 'grid_view', path: '/projects/overview' },
]

const avatarColors = [
  'bg-[#6467f2]',
  'bg-[#f59e0b]',
  'bg-[#10b981]',
  'bg-[#ef4444]',
  'bg-[#8b5cf6]',
]

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export default function Sidebar({ projectId, collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects')
        if (res.ok) {
          const data: Project[] = await res.json()
          setProjects(data)
        }
      } catch {
        // ignore
      }
    }
    fetchProjects()
  }, [])

  const isProjectNav = !!projectId
  const navItems = isProjectNav ? projectNavItems : homeNavItems

  const isActive = (path: string) => {
    if (isProjectNav) {
      return pathname.includes(`/projects/${projectId}/${path}`)
    }
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
    <TooltipProvider>
      <aside
        className={cn(
          'bg-white border-r border-border flex flex-col shrink-0 h-full transition-all duration-200',
          collapsed ? 'w-[68px]' : 'w-[230px]'
        )}
      >
        {/* Logo + Toggle */}
        <div className={cn('flex items-center pt-5 pb-4', collapsed ? 'px-3 flex-col gap-2' : 'px-4 gap-3')}>
          <div className="size-9 rounded-full bg-gradient-to-br from-[#6467f2] to-[#8b5cf6] flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined text-[20px]">edit_note</span>
          </div>
          {!collapsed && (
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">SEO Studio</div>
              <div className="text-xs text-muted-foreground">v2.0</div>
            </div>
          )}
          <button
            onClick={onToggle}
            className={cn(
              'flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer',
              collapsed ? 'size-9' : 'size-8'
            )}
            title={collapsed ? 'ขยาย sidebar' : 'ย่อ sidebar'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {collapsed ? 'menu_open' : 'menu'}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn('flex flex-col gap-0.5 flex-1', collapsed ? 'px-2' : 'px-3')}>
          {navItems.map((item) => {
            const href = isProjectNav
              ? `/projects/${projectId}/${item.path}`
              : item.path
            const active = isActive(item.path)

            const linkContent = (
              <Link
                key={item.path}
                href={href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 h-10 rounded-lg text-sm transition-colors',
                  collapsed ? 'justify-center px-0' : 'px-3',
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <span
                  className={cn(
                    'material-symbols-outlined text-[20px]',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )

            return linkContent
          })}
        </nav>

        <Separator />

        {/* PROJECTS Section */}
        <div className={cn('py-3', collapsed ? 'px-2' : 'px-3')}>
          {!collapsed && (
            <p className="px-3 mb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              PROJECTS
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {projects.map((project, index) => {
              const active = projectId === project.id
              const color = avatarColors[index % avatarColors.length]

              const projectLink = (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}/dashboard`}
                  title={collapsed ? project.name : undefined}
                  className={cn(
                    'flex items-center gap-3 h-9 rounded-lg text-sm transition-colors',
                    collapsed ? 'justify-center px-0' : 'px-3',
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Avatar size="sm">
                    <AvatarFallback className={cn(color, 'text-white text-[10px] font-semibold')}>
                      {getInitials(project.name)}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && <span className="truncate">{project.name}</span>}
                </Link>
              )

              return projectLink
            })}
          </div>
        </div>

        <Separator />

        {/* User Profile */}
        <div className={cn('py-3', collapsed ? 'px-2' : 'px-3')}>
          <div className={cn('flex items-center gap-3', collapsed ? 'justify-center' : 'px-3')}>
            <Avatar>
              <AvatarFallback className="bg-primary text-white text-xs font-semibold">
                TK
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">Thanakit</div>
                  <div className="text-xs text-muted-foreground">Admin</div>
                </div>
                <Tooltip>
                  <TooltipTrigger
                    onClick={handleLogout}
                    className="inline-flex shrink-0 items-center justify-center size-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                  </TooltipTrigger>
                  <TooltipContent side="right">ออกจากระบบ</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
