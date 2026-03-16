import { NextResponse } from 'next/server'
import { createServiceClient, createProjectClient } from '@/lib/supabase'

// POST /api/projects/[id]/test-connection — test project's Supabase or REST API connection
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()

    // Fetch the project
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Test based on connection type
    if (project.connection_type === 'supabase') {
      if (!project.supabase_url || !project.supabase_service_role_key) {
        return NextResponse.json(
          { success: false, error: 'Missing Supabase URL or service role key' },
          { status: 400 }
        )
      }

      try {
        const projectClient = createProjectClient(
          project.supabase_url,
          project.supabase_service_role_key
        )

        const { error: queryError } = await projectClient
          .from('blog_posts')
          .select('id')
          .limit(1)

        if (queryError) {
          return NextResponse.json(
            { success: false, error: `Supabase query failed: ${queryError.message}` },
            { status: 200 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Supabase connection successful',
        })
      } catch {
        return NextResponse.json(
          { success: false, error: 'Failed to connect to Supabase instance' },
          { status: 200 }
        )
      }
    }

    if (project.connection_type === 'rest_api') {
      if (!project.api_endpoint) {
        return NextResponse.json(
          { success: false, error: 'Missing API endpoint' },
          { status: 400 }
        )
      }

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        if (project.api_key) {
          headers['Authorization'] = `Bearer ${project.api_key}`
        }

        const response = await fetch(project.api_endpoint, {
          method: 'GET',
          headers,
        })

        if (!response.ok) {
          return NextResponse.json(
            { success: false, error: `API returned status ${response.status}` },
            { status: 200 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'REST API connection successful',
        })
      } catch {
        return NextResponse.json(
          { success: false, error: 'Failed to connect to REST API endpoint' },
          { status: 200 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: `Unknown connection type: ${project.connection_type}` },
      { status: 400 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
