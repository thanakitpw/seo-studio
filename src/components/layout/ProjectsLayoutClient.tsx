'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Breadcrumb from './Breadcrumb'

export default function ProjectsLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Full-screen pages without sidebar
  const isFullScreen = pathname === '/projects/new'

  if (isFullScreen) {
    return <>{children}</>
  }

  const segments = pathname.split('/')
  const projectIndex = segments.indexOf('projects')
  const projectId =
    projectIndex !== -1 && segments[projectIndex + 1] && segments[projectIndex + 1] !== 'new'
      ? segments[projectIndex + 1]
      : undefined

  return (
    <div className="flex h-screen">
      <Sidebar
        projectId={projectId}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <main className="flex-1 bg-[#f6f6f8] overflow-auto">
        {projectId && (
          <div className="px-8 pt-6">
            <Breadcrumb projectId={projectId} />
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
