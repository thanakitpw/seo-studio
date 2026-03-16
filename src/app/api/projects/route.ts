import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import type { Project } from '@/types'

// GET /api/projects — list all active projects
export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data as Project[])
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/projects — create new project
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    if (!body.slug || typeof body.slug !== 'string' || body.slug.trim() === '') {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Check slug uniqueness
    const { data: existing, error: checkError } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', body.slug)
      .maybeSingle()

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json(
        { error: 'slug already exists' },
        { status: 409 }
      )
    }

    // Build insert payload with allowed fields only
    const insertData: Record<string, unknown> = {
      name: body.name.trim(),
      slug: body.slug.trim(),
    }

    const optionalFields = [
      'domain',
      'connection_type',
      'supabase_url',
      'supabase_anon_key',
      'supabase_service_role_key',
      'storage_bucket',
      'api_endpoint',
      'api_key',
      'api_method',
      'brand_voice',
      'writing_rules',
      'site_inventory',
      'cover_image_style',
    ] as const

    for (const field of optionalFields) {
      if (body[field] !== undefined) {
        insertData[field] = body[field]
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data as Project, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
