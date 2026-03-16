import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { createServiceClient } from '@/lib/supabase'

// ===== Helpers =====

const avatarColors = [
  'bg-[#6467f2]',
  'bg-[#f59e0b]',
  'bg-[#10b981]',
  'bg-[#ef4444]',
  'bg-[#8b5cf6]',
]

function getAvatarColor(index: number) {
  return avatarColors[index % avatarColors.length]
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function formatRelativeTime(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'เมื่อสักครู่'
  if (diffMin < 60) return `${diffMin} นาทีก่อน`
  if (diffHr < 24) return `${diffHr} ชม. ก่อน`
  if (diffDay < 30) return `${diffDay} วันก่อน`
  return date.toLocaleDateString('th-TH')
}

// ===== Data fetching =====

interface ProjectWithStats {
  id: string
  name: string
  domain: string | null
  status: 'active' | 'archived'
  updated_at: string
  keyword_count: number
  published_count: number
  draft_count: number
}

async function getProjects(): Promise<ProjectWithStats[]> {
  const supabase = createServiceClient()

  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, domain, status, updated_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error || !projects) return []

  const projectsWithStats: ProjectWithStats[] = await Promise.all(
    projects.map(async (p) => {
      const { count: keywordCount } = await supabase
        .from('keywords')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', p.id)

      const { count: publishedCount } = await supabase
        .from('keywords')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', p.id)
        .eq('status', 'published')

      const { count: draftCount } = await supabase
        .from('keywords')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', p.id)
        .eq('status', 'draft')

      return {
        id: p.id,
        name: p.name,
        domain: p.domain,
        status: p.status as 'active' | 'archived',
        updated_at: p.updated_at,
        keyword_count: keywordCount ?? 0,
        published_count: publishedCount ?? 0,
        draft_count: draftCount ?? 0,
      }
    })
  )

  return projectsWithStats
}

// ===== Page =====

export default async function ProjectsPage() {
  const projects = await getProjects()
  const projectCount = projects.length

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            โปรเจคของฉัน
          </h1>
          <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-medium">
            {projectCount}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground">
              search
            </span>
            <Input
              type="text"
              placeholder="ค้นหาโปรเจค..."
              className="w-64 pl-10"
            />
          </div>
          <Link
            href="/projects/new"
            className={cn(
              'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium',
              'bg-primary text-primary-foreground transition-colors hover:bg-primary/90'
            )}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            สร้างโปรเจค
          </Link>
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}/dashboard`}
            className="group cursor-pointer"
          >
            <Card className="transition-shadow duration-200 hover:shadow-md group-hover:border-primary/30">
              <CardHeader className="relative pb-3">
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarFallback
                      className={cn(
                        getAvatarColor(index),
                        'text-sm font-semibold text-white'
                      )}
                    >
                      {getInitials(project.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base font-semibold">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="truncate text-xs">
                      {project.domain ?? 'ยังไม่ตั้งโดเมน'}
                    </CardDescription>
                  </div>
                  {project.status === 'active' && (
                    <span className="size-2.5 shrink-0 rounded-full bg-emerald-400" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="pb-3">
                <Separator className="mb-4" />
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/50 px-2 py-2.5">
                    <p className="text-2xl font-bold text-foreground">
                      {project.keyword_count}
                    </p>
                    <p className="text-[11px] text-muted-foreground">คำหลัก</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 px-2 py-2.5">
                    <p className="text-2xl font-bold text-emerald-600">
                      {project.published_count}
                    </p>
                    <p className="text-[11px] text-emerald-600/70">เผยแพร่</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 px-2 py-2.5">
                    <p className="text-2xl font-bold text-amber-500">
                      {project.draft_count}
                    </p>
                    <p className="text-[11px] text-amber-500/70">ร่าง</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  อัพเดท {formatRelativeTime(project.updated_at)}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  เปิดโปรเจค
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </span>
              </CardFooter>
            </Card>
          </Link>
        ))}

        {/* New Project Card */}
        <Link
          href="/projects/new"
          className="group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-muted transition-colors duration-200 group-hover:bg-primary/10">
            <span className="material-symbols-outlined text-2xl text-muted-foreground transition-colors duration-200 group-hover:text-primary">
              add
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">
            สร้างโปรเจคใหม่
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            เชื่อมต่อกับเว็บไซต์ลูกค้า
          </p>
        </Link>
      </div>
    </div>
  )
}
