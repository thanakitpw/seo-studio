'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Sidebar from './Sidebar'
import ProjectSwitcher from './ProjectSwitcher'
import Breadcrumb from './Breadcrumb'

export default function ProjectsLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Extract projectId from path: /projects/[id]/...
  const segments = pathname.split('/')
  const projectIndex = segments.indexOf('projects')
  const projectId =
    projectIndex !== -1 && segments[projectIndex + 1] && segments[projectIndex + 1] !== 'new'
      ? segments[projectIndex + 1]
      : undefined

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="h-14 sticky top-0 z-10 bg-white border-b border-slate-200 flex items-center px-4 shrink-0">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
          </div>
          <span className="text-sm font-semibold text-slate-900 hidden sm:inline">
            SEO Studio
          </span>
        </div>

        {/* Center: ProjectSwitcher */}
        <div className="flex-1 flex justify-center">
          <ProjectSwitcher currentProjectId={projectId} />
        </div>

        {/* Right: Settings + Avatar */}
        <div className="flex items-center gap-1">
          <Link
            href={projectId ? `/projects/${projectId}/settings` : '/projects'}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-slate-500">settings</span>
          </Link>
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px] text-primary">person</span>
          </div>
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar projectId={projectId} />

        {/* Content Area */}
        <main className="flex-1 bg-[#f6f6f8] overflow-auto p-8">
          <div className="mb-6">
            <Breadcrumb />
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
