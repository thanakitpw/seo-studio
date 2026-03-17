import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import type { Article } from '@/types'

// GET /api/articles?project_id=xxx&status=&search=&page=1&limit=20
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

    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))

    const supabase = createServiceClient()

    // Build count query
    let countQuery = supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project_id)

    // Build data query
    let dataQuery = supabase
      .from('articles')
      .select('*')
      .eq('project_id', project_id)

    // Apply filters
    if (status) {
      countQuery = countQuery.eq('status', status)
      dataQuery = dataQuery.eq('status', status)
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
      data: data as Article[],
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
