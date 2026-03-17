import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

interface UseRequestBody {
  article_id: string
}

// POST /api/images/[id]/use — assign cover image to an article
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as UseRequestBody

    if (!body.article_id) {
      return NextResponse.json(
        { error: 'article_id is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get cover image
    const { data: coverImage, error: fetchError } = await supabase
      .from('cover_images')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !coverImage) {
      return NextResponse.json({ error: 'Cover image not found' }, { status: 404 })
    }

    if (!coverImage.image_url) {
      return NextResponse.json(
        { error: 'Cover image has no URL (not completed yet)' },
        { status: 400 }
      )
    }

    // Update cover_images.article_id
    const { error: updateCoverError } = await supabase
      .from('cover_images')
      .update({ article_id: body.article_id })
      .eq('id', id)

    if (updateCoverError) {
      return NextResponse.json(
        { error: `Failed to update cover image: ${updateCoverError.message}` },
        { status: 500 }
      )
    }

    // Update articles.cover_image_url
    const { error: updateArticleError } = await supabase
      .from('articles')
      .update({ cover_image_url: coverImage.image_url })
      .eq('id', body.article_id)

    if (updateArticleError) {
      return NextResponse.json(
        { error: `Failed to update article: ${updateArticleError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
