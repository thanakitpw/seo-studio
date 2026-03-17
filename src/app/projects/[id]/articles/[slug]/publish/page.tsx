import { createServiceClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import PublishClient from './PublishClient'

interface PageProps {
  params: Promise<{ id: string; slug: string }>
}

export default async function PublishPage({ params }: PageProps) {
  const { id: projectId, slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  const supabase = createServiceClient()

  // Fetch article (try by slug, fallback by keyword_id)
  let { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('project_id', projectId)
    .eq('slug', slug)
    .maybeSingle()

  if (!article) {
    const { data: keyword } = await supabase
      .from('keywords')
      .select('id')
      .eq('project_id', projectId)
      .eq('slug', slug)
      .maybeSingle()

    if (keyword) {
      const { data: artByKw } = await supabase
        .from('articles')
        .select('*')
        .eq('keyword_id', keyword.id)
        .maybeSingle()
      article = artByKw
    }
  }

  if (!article) notFound()

  // Fetch project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (!project) notFound()

  return (
    <PublishClient
      article={article}
      project={project}
    />
  )
}
