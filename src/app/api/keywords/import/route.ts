import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

interface ImportKeyword {
  title: string
  primary_keyword: string
  slug: string
  cluster: string
  content_type: string
  priority: string
}

// POST /api/keywords/import — bulk import keywords
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { project_id, keywords } = body as {
      project_id: string
      keywords: ImportKeyword[]
    }

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: 'keywords array is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Prepare rows for insert
    const rows = keywords.map((kw) => ({
      project_id,
      title: kw.title.trim(),
      primary_keyword: kw.primary_keyword.trim(),
      slug: kw.slug.trim(),
      cluster: kw.cluster.trim(),
      content_type: kw.content_type.trim(),
      priority: kw.priority.trim(),
      status: 'pending' as const,
    }))

    // Insert with ON CONFLICT slug DO NOTHING
    const { data, error } = await supabase
      .from('keywords')
      .upsert(rows, {
        onConflict: 'slug',
        ignoreDuplicates: true,
      })
      .select('id')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const imported = data?.length ?? 0
    const skipped = rows.length - imported

    return NextResponse.json({ imported, skipped })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
