import { createServiceClient } from '@/lib/supabase'
import { Settings } from 'lucide-react'
import Link from 'next/link'
import StatsCards from '@/components/dashboard/StatsCards'
import CategoryProgress from '@/components/dashboard/CategoryProgress'
import RecentActivity from '@/components/dashboard/RecentActivity'
import TokenUsage from '@/components/dashboard/TokenUsage'
import type { Project, Keyword, Article, KeywordStatus } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DashboardPage({ params }: PageProps) {
  const { id: projectId } = await params
  const supabase = createServiceClient()

  // Fetch project info
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single<Project>()

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-6xl text-slate-300">error</span>
        <h1 className="mt-4 text-xl font-semibold text-slate-700">ไม่พบโปรเจค</h1>
      </div>
    )
  }

  // Fetch all keywords for this project
  const { data: keywords = [] } = await supabase
    .from('keywords')
    .select('*')
    .eq('project_id', projectId)
    .returns<Keyword[]>()

  // Fetch all articles for this project
  const { data: articles = [] } = await supabase
    .from('articles')
    .select('*')
    .eq('project_id', projectId)
    .returns<Article[]>()

  // Fetch recent articles (latest 5)
  const { data: recentArticles = [] } = await supabase
    .from('keywords')
    .select('title, status, updated_at')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false })
    .limit(5)
    .returns<{ title: string; status: KeywordStatus; updated_at: string }[]>()

  // Calculate stats
  const allKeywords = keywords ?? []
  const allArticles = articles ?? []

  const totalKeywords = allKeywords.length
  const publishedArticles = allKeywords.filter((k) => k.status === 'published').length
  const draftArticles = allKeywords.filter((k) => k.status === 'draft' || k.status === 'review').length
  const pendingKeywords = allKeywords.filter(
    (k) => k.status === 'pending' || k.status === 'generating-brief' || k.status === 'brief-ready'
  ).length

  // Group by cluster for category progress
  const clusterMap = new Map<string, { total: number; published: number }>()
  for (const kw of allKeywords) {
    const cluster = kw.cluster || 'อื่นๆ'
    const existing = clusterMap.get(cluster) ?? { total: 0, published: 0 }
    existing.total += 1
    if (kw.status === 'published') existing.published += 1
    clusterMap.set(cluster, existing)
  }
  const categories = Array.from(clusterMap.entries()).map(([name, data]) => ({
    name,
    published: data.published,
    total: data.total,
  }))

  // Calculate token usage
  const totalTokens = allArticles.reduce((sum, a) => {
    return sum + (a.token_usage?.total ?? 0)
  }, 0)
  const articlesWithTokens = allArticles.filter((a) => a.token_usage?.total)

  return (
    <div className="flex flex-col h-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between h-16 shrink-0 px-8 bg-white border-b border-slate-200">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-bold text-slate-900">
            {project.name}
          </h1>
          {project.domain && (
            <span className="text-xs text-slate-400">
              {project.domain}
            </span>
          )}
        </div>
        <Link
          href={`/projects/${projectId}/settings`}
          className="flex items-center gap-2 rounded-lg py-2 px-3.5 border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <Settings size={16} />
          <span className="text-[13px] font-medium">ตั้งค่า</span>
        </Link>
      </div>

      {/* Main Content — fit viewport, no page scroll */}
      <div className="flex flex-col flex-1 py-6 px-10 overflow-hidden gap-5">
        {/* Stats Cards */}
        <div className="shrink-0">
          <StatsCards
            totalKeywords={totalKeywords}
            publishedArticles={publishedArticles}
            draftArticles={draftArticles}
            pendingKeywords={pendingKeywords}
          />
        </div>

        {totalKeywords === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 min-h-0">
            <span className="material-symbols-outlined text-5xl text-slate-300">key</span>
            <p className="mt-3 text-lg font-medium text-slate-500">เริ่มต้นเพิ่มคำหลัก</p>
            <p className="mt-1 text-sm text-slate-400">เพิ่มคำหลักเพื่อเริ่มสร้างบทความ SEO สำหรับโปรเจคนี้</p>
            <Link
              href={`/projects/${projectId}/keywords`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#6467f2] px-4 py-2 text-sm font-medium text-white hover:bg-[#5355d1] transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>add</span>
              เพิ่มคำหลัก
            </Link>
          </div>
        ) : (
          <>
            {/* Two Columns: Categories + Recent Activity — scroll ภายใน */}
            <div className="grid grid-cols-2 gap-5 flex-1 min-h-0">
              <CategoryProgress categories={categories} />
              <RecentActivity activities={recentArticles ?? []} />
            </div>

            {/* Token Usage — always visible */}
            <div className="shrink-0">
              <TokenUsage
                totalTokens={totalTokens}
                totalArticles={articlesWithTokens.length}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
