import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import type { Project } from '@/types'

// GET /api/projects/[id] — get project detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data as Project)
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id] — update project
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const allowedFields = [
      'name',
      'slug',
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
      'status',
    ] as const

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Validate name if provided
    if (updateData.name !== undefined) {
      if (typeof updateData.name !== 'string' || (updateData.name as string).trim() === '') {
        return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
      }
      updateData.name = (updateData.name as string).trim()
    }

    // Validate slug if provided
    if (updateData.slug !== undefined) {
      if (typeof updateData.slug !== 'string' || (updateData.slug as string).trim() === '') {
        return NextResponse.json({ error: 'slug cannot be empty' }, { status: 400 })
      }
      updateData.slug = (updateData.slug as string).trim()
    }

    const supabase = createServiceClient()

    // Check slug uniqueness if slug is being updated
    if (updateData.slug !== undefined) {
      const { data: existing, error: checkError } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', updateData.slug as string)
        .neq('id', id)
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
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data as Project)
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] — soft delete (archive)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()

    const { error } = await supabase
      .from('projects')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
