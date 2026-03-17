import { createServiceClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import EditorClient from './EditorClient'

interface PageProps {
  params: Promise<{ id: string; slug: string }>
}

export default async function EditPage({ params }: PageProps) {
  const { id: projectId, slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  const supabase = createServiceClient()

  // First try by slug
  let { data: article } = await supabase
    .from('articles')
    .select('id, slug, title, primary_keyword, content_type, brief_md, content_md, meta_title, meta_description, excerpt, tags, status, token_usage, project_id')
    .eq('project_id', projectId)
    .eq('slug', slug)
    .maybeSingle()

  // If not found by slug, try finding via keyword
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
        .select('id, slug, title, primary_keyword, content_type, brief_md, content_md, meta_title, meta_description, excerpt, tags, status, token_usage, project_id')
        .eq('keyword_id', keyword.id)
        .maybeSingle()
      article = artByKw
    }
  }

  if (!article) notFound()

  return (
    <EditorClient
      article={article}
      projectId={projectId}
      slug={slug}
    />
  )
}
