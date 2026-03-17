import { createServiceClient } from '@/lib/supabase'
import BriefClient from './BriefClient'
import type { Keyword, Article, Project } from '@/types'

interface PageProps {
  params: Promise<{ id: string; slug: string }>
}

export default async function BriefPage({ params }: PageProps) {
  const { id: projectId, slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  const supabase = createServiceClient()

  // Fetch project
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, brand_voice, writing_rules, site_inventory')
    .eq('id', projectId)
    .single()

  // Fetch keyword by slug
  const { data: keyword } = await supabase
    .from('keywords')
    .select('*')
    .eq('project_id', projectId)
    .eq('slug', slug)
    .single()

  // Fetch article by keyword_id (article slug may differ from keyword slug)
  const { data: article } = keyword
    ? await supabase
        .from('articles')
        .select('*')
        .eq('keyword_id', keyword.id)
        .maybeSingle()
    : { data: null }

  if (!project || !keyword) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-muted-foreground">ไม่พบข้อมูลคำหลักหรือโปรเจค</p>
      </div>
    )
  }

  return (
    <BriefClient
      project={project as Pick<Project, 'id' | 'name' | 'brand_voice' | 'writing_rules' | 'site_inventory'>}
      keyword={keyword as Keyword}
      initialArticle={article as Article | null}
      projectId={projectId}
    />
  )
}
