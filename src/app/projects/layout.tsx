import ProjectsLayoutClient from '@/components/layout/ProjectsLayoutClient'

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProjectsLayoutClient>{children}</ProjectsLayoutClient>
}
