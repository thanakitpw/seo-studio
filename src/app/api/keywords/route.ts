import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import type { Keyword } from '@/types'

// GET /api/keywords?project_id=xxx&cluster=&status=&priority=&content_type=&search=&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const project_id = searchParams.get('project_id')

    if (!project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      )
    }

    const cluster = searchParams.get('cluster')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const content_type = searchParams.get('content_type')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))

    const supabase = createServiceClient()

    // Build count query
    let countQuery = supabase
      .from('keywords')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project_id)

    // Build data query
    let dataQuery = supabase
      .from('keywords')
      .select('*')
      .eq('project_id', project_id)

    // Apply filters
    if (cluster) {
      countQuery = countQuery.eq('cluster', cluster)
      dataQuery = dataQuery.eq('cluster', cluster)
    }
    if (status) {
      countQuery = countQuery.eq('status', status)
      dataQuery = dataQuery.eq('status', status)
    }
    if (priority) {
      countQuery = countQuery.eq('priority', priority)
      dataQuery = dataQuery.eq('priority', priority)
    }
    if (content_type) {
      countQuery = countQuery.eq('content_type', content_type)
      dataQuery = dataQuery.eq('content_type', content_type)
    }
    if (search) {
      const searchFilter = `title.ilike.%${search}%,primary_keyword.ilike.%${search}%`
      countQuery = countQuery.or(searchFilter)
      dataQuery = dataQuery.or(searchFilter)
    }

    // Execute count
    const { count, error: countError } = await countQuery

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    const total = count ?? 0
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit

    // Execute data query with pagination
    const { data, error } = await dataQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data as Keyword[],
      total,
      page,
      totalPages,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/keywords — create new keyword
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['project_id', 'title', 'primary_keyword', 'slug', 'cluster', 'content_type', 'priority'] as const
    for (const field of requiredFields) {
      if (!body[field] || typeof body[field] !== 'string' || body[field].trim() === '') {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    const supabase = createServiceClient()

    const insertData = {
      project_id: body.project_id.trim(),
      title: body.title.trim(),
      primary_keyword: body.primary_keyword.trim(),
      slug: body.slug.trim(),
      cluster: body.cluster.trim(),
      content_type: body.content_type.trim(),
      priority: body.priority.trim(),
      status: 'pending' as const,
    }

    const { data, error } = await supabase
      .from('keywords')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data as Keyword, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
