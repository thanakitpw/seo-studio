import { createServiceClient, createProjectClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { marked } from 'marked'

function markdownToHtml(md: string): string {
  // Remove H1 (first # heading)
  const withoutH1 = md.replace(/^#\s+.+\n?/m, '')

  // Remove JSON-LD code blocks
  const withoutJsonLd = withoutH1.replace(/```json[\s\S]*?@context[\s\S]*?```/g, '')

  return marked.parse(withoutJsonLd) as string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, projectId } = body

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 })
    }
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

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

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    if (!article.content_md) {
      return NextResponse.json({ error: 'No content to publish' }, { status: 400 })
    }

    // Fetch project
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projErr || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Convert markdown to HTML
    let contentHtml: string
    try {
      contentHtml = markdownToHtml(article.content_md)
    } catch {
      return NextResponse.json({ error: 'Failed to convert markdown' }, { status: 500 })
    }

    // Build publish payload (no "status" field)
    const payload = {
      slug: article.slug,
      title: article.meta_title || article.title,
      excerpt: article.excerpt || '',
      content: contentHtml,
      category: article.cluster || '',
      tags: article.tags || [],
      author_name: 'Best Solutions',
      cover_image: article.cover_image_url || '',
      seo_title: article.meta_title || article.title,
      seo_description: article.meta_description || '',
      published_at: null,
    }

    let postId: string | null = null

    if (project.connection_type === 'supabase') {
      // Supabase Direct — upsert to blog_posts
      if (!project.supabase_url || !project.supabase_service_role_key) {
        return NextResponse.json(
          { error: 'Project Supabase credentials not configured' },
          { status: 400 }
        )
      }

      const projectClient = createProjectClient(
        project.supabase_url,
        project.supabase_service_role_key
      )

      // Check if already published
      const { data: existing } = await projectClient
        .from('blog_posts')
        .select('id')
        .eq('slug', article.slug)
        .maybeSingle()

      if (existing?.id) {
        const { error } = await projectClient
          .from('blog_posts')
          .update(payload)
          .eq('slug', article.slug)
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        postId = existing.id
      } else {
        const { data: created, error } = await projectClient
          .from('blog_posts')
          .insert(payload)
          .select('id')
          .single()
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        postId = created?.id ?? null
      }
    } else if (project.connection_type === 'rest_api') {
      // REST API — POST with Bearer token
      if (!project.api_endpoint || !project.api_key) {
        return NextResponse.json(
          { error: 'Project REST API credentials not configured' },
          { status: 400 }
        )
      }

      const res = await fetch(project.api_endpoint, {
        method: project.api_method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${project.api_key}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errText = await res.text()
        return NextResponse.json(
          { error: `REST API error: ${res.status} ${errText}` },
          { status: 502 }
        )
      }

      const result = await res.json()
      postId = result.id || result.post_id || null
    } else {
      return NextResponse.json(
        { error: `Unsupported connection type: ${project.connection_type}` },
        { status: 400 }
      )
    }

    // Update article status + supabase_post_id, and keyword status
    await Promise.all([
      supabase
        .from('articles')
        .update({
          content_html: contentHtml,
          status: 'published',
          supabase_post_id: postId,
        })
        .eq('id', article.id),
      ...(article.keyword_id
        ? [
            supabase
              .from('keywords')
              .update({ status: 'published' })
              .eq('id', article.keyword_id),
          ]
        : []),
    ])

    return NextResponse.json({ success: true, post_id: postId })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
