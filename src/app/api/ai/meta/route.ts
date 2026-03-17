import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase'
import type { Project } from '@/types'

const anthropic = new Anthropic()

type MetaField = 'meta_title' | 'meta_description' | 'excerpt'

interface MetaRequestBody {
  content: string
  primaryKeyword: string
  projectId: string
  fields: MetaField[]
}

// POST /api/ai/meta — generate meta_title, meta_description, excerpt
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MetaRequestBody

    // Validate required fields
    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }
    if (!body.primaryKeyword || typeof body.primaryKeyword !== 'string') {
      return NextResponse.json({ error: 'primaryKeyword is required' }, { status: 400 })
    }
    if (!body.projectId || typeof body.projectId !== 'string') {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }
    if (!body.fields || !Array.isArray(body.fields) || body.fields.length === 0) {
      return NextResponse.json({ error: 'fields is required (array of meta field names)' }, { status: 400 })
    }

    const validFields: MetaField[] = ['meta_title', 'meta_description', 'excerpt']
    for (const field of body.fields) {
      if (!validFields.includes(field)) {
        return NextResponse.json(
          { error: `Invalid field: ${field}. Valid fields: ${validFields.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Fetch project config for brand_voice
    const supabase = createServiceClient()
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('brand_voice')
      .eq('id', body.projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const typedProject = project as Pick<Project, 'brand_voice'>
    const brandVoice = typedProject.brand_voice || 'เป็นมืออาชีพ เข้าถึงง่าย'

    // Build system prompt
    const systemPrompt = `คุณเป็น SEO Meta Specialist สร้าง meta fields สำหรับบทความ SEO ภาษาไทย

กฎ:
- meta_title: ไม่เกิน 60 ตัวอักษร, มี primary keyword, ดึงดูดให้คลิก
- meta_description: ไม่เกิน 155 ตัวอักษร, สรุปเนื้อหา, มี primary keyword
- excerpt: 2-3 ประโยค, สรุปบทความ, เหมาะสำหรับแสดงใน card

Brand Voice: ${brandVoice}`

    // Build user prompt — truncate content to first 2000 chars
    const truncatedContent = body.content.slice(0, 2000)
    const fieldsStr = body.fields.join(', ')

    const userPrompt = `สร้าง ${fieldsStr} สำหรับบทความนี้

Primary Keyword: ${body.primaryKeyword}
เนื้อหาบทความ (ตัดมาแค่ 500 คำแรก):
${truncatedContent}

ตอบเป็น JSON format เท่านั้น:
{${body.fields.map(f => `"${f}": "..."`).join(', ')}}`

    // Call Anthropic
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    // Extract text from response
    const textBlock = message.content.find(block => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text response from AI' }, { status: 500 })
    }

    // Parse JSON from response — handle markdown code blocks
    let responseText = textBlock.text.trim()
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const result = JSON.parse(responseText) as Record<MetaField, string>

    // Only return requested fields
    const filteredResult: Partial<Record<MetaField, string>> = {}
    for (const field of body.fields) {
      if (result[field]) {
        filteredResult[field] = result[field]
      }
    }

    return NextResponse.json(filteredResult)
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON' },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
