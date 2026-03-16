'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

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
    <div className="flex h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 bg-[#f6f6f8] overflow-auto p-8">
        {children}
      </main>
    </div>
  )
}
