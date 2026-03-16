'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

export default function ProjectsLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

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
        {children}
      </main>
    </div>
  )
}
