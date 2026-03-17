import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { createServiceClient } from '@/lib/supabase'
import { downloadAndUpload } from '@/lib/image'

fal.config({ credentials: process.env.FAL_KEY })

interface GenerateRequestBody {
  project_id: string
  article_id?: string
  prompt: string
  resolution?: '1K' | '2K' | '4K'
  aspect_ratio?: '16:9' | '21:9' | '3:2' | '4:3' | '5:4' | '1:1' | '4:5' | '3:4' | '2:3' | '9:16'
}

interface FalImage {
  url: string
  width: number
  height: number
}

interface FalResult {
  images: FalImage[]
}

// POST /api/images/generate — generate cover image with fal.ai nano-banana-pro
// สร้าง record เฉพาะเมื่อ generate สำเร็จเท่านั้น
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequestBody

    if (!body.project_id || !body.prompt) {
      return NextResponse.json(
        { error: 'project_id and prompt are required' },
        { status: 400 }
      )
    }

    if (!process.env.FAL_KEY) {
      return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 })
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

    // Step 1: Generate with fal.ai nano-banana-pro
    const result = await fal.subscribe('fal-ai/nano-banana-pro', {
      input: {
        prompt: body.prompt,
        num_images: 1,
        aspect_ratio: body.aspect_ratio || '16:9',
        resolution: body.resolution || '1K',
        output_format: 'webp',
      },
    }) as { data: FalResult; requestId?: string }

    const falData = result.data
    if (!falData?.images?.length) {
      return NextResponse.json({ error: 'ไม่สามารถสร้างรูปได้' }, { status: 500 })
    }

    const generatedUrl = falData.images[0].url

    // Step 2: Upload to Supabase Storage (ถ้ามี config)
    let finalUrl = generatedUrl
    if (projectSupabaseUrl && projectServiceKey) {
      try {
        const slug = `cover-${Date.now()}`
        finalUrl = await downloadAndUpload(
          generatedUrl,
          slug,
          projectSupabaseUrl,
          projectServiceKey,
          storageBucket
        )
      } catch {
        // ใช้ URL จาก fal.ai ตรงๆ ถ้า upload ไม่ได้
        finalUrl = generatedUrl
      }
    }

    // Step 3: สร้าง record เมื่อสำเร็จแล้วเท่านั้น
    const { data: coverImage, error: insertError } = await supabase
      .from('cover_images')
      .insert({
        project_id: body.project_id,
        article_id: body.article_id || null,
        prompt: body.prompt,
        status: 'completed',
        image_url: finalUrl,
        fal_request_id: result.requestId || null,
        width: 1200,
        height: 630,
      })
      .select()
      .single()

    if (insertError || !coverImage) {
      return NextResponse.json(
        { error: `Failed to save: ${insertError?.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: coverImage.id,
      image_url: finalUrl,
      status: 'completed',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Image generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
