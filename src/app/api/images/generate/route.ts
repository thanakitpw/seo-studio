import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { createServiceClient } from '@/lib/supabase'
import { downloadAndUpload } from '@/lib/image'
import { toUrlSlug } from '@/lib/slug'

fal.config({ credentials: process.env.FAL_KEY })

interface GenerateRequestBody {
  project_id: string
  article_id?: string
  prompt: string
  resolution?: string
  aspect_ratio?: string
}

interface FalImage {
  url: string
  width: number
  height: number
}

interface FalResult {
  images: FalImage[]
  request_id?: string
}

// POST /api/images/generate — generate cover image with fal.ai
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequestBody

    if (!body.project_id || !body.prompt) {
      return NextResponse.json(
        { error: 'project_id and prompt are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Fetch project for storage config
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('supabase_url, supabase_service_role_key, storage_bucket')
      .eq('id', body.project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const projectSupabaseUrl = project.supabase_url as string
    const projectServiceKey = project.supabase_service_role_key as string
    const storageBucket = (project.storage_bucket as string) || 'images'

    if (!projectSupabaseUrl || !projectServiceKey) {
      return NextResponse.json(
        { error: 'Project Supabase connection not configured' },
        { status: 400 }
      )
    }

    // Create cover_images record with status: generating
    const { data: coverImage, error: insertError } = await supabase
      .from('cover_images')
      .insert({
        project_id: body.project_id,
        article_id: body.article_id || null,
        prompt: body.prompt,
        status: 'generating',
        width: 1200,
        height: 630,
      })
      .select()
      .single()

    if (insertError || !coverImage) {
      return NextResponse.json(
        { error: `Failed to create record: ${insertError?.message}` },
        { status: 500 }
      )
    }

    try {
      // Call fal.ai nano-banana-2
      const result = await fal.subscribe('fal-ai/nano-banana-2', {
        input: {
          prompt: body.prompt,
          resolution: body.resolution || '1K',
          aspect_ratio: body.aspect_ratio || 'landscape_16_9',
          output_format: 'webp',
        },
      }) as { data: FalResult; requestId?: string }

      const falData = result.data
      if (!falData?.images?.length) {
        throw new Error('No images returned from fal.ai')
      }

      const generatedUrl = falData.images[0].url
      const slug = `cover-${coverImage.id.slice(0, 8)}-${toUrlSlug(body.prompt.slice(0, 30))}`

      // Download, resize, upload to Supabase Storage
      const publicUrl = await downloadAndUpload(
        generatedUrl,
        slug,
        projectSupabaseUrl,
        projectServiceKey,
        storageBucket
      )

      // Update cover_images record
      const { error: updateError } = await supabase
        .from('cover_images')
        .update({
          status: 'completed',
          image_url: publicUrl,
          fal_request_id: result.requestId || null,
        })
        .eq('id', coverImage.id)

      if (updateError) {
        throw new Error(`Failed to update record: ${updateError.message}`)
      }

      return NextResponse.json({
        id: coverImage.id,
        image_url: publicUrl,
        status: 'completed',
      })
    } catch (falError) {
      // Update status to failed
      await supabase
        .from('cover_images')
        .update({ status: 'failed' })
        .eq('id', coverImage.id)

      return NextResponse.json(
        {
          error: falError instanceof Error ? falError.message : 'Image generation failed',
          id: coverImage.id,
          status: 'failed',
        },
        { status: 500 }
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
