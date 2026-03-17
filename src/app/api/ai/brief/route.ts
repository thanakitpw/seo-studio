import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase'
import { NextRequest } from 'next/server'
import { toUrlSlug } from '@/lib/slug'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BASE_BRIEF_PROMPT = `คุณคือ SEO Content Strategist ผู้เชี่ยวชาญด้าน Digital Marketing สำหรับตลาดไทย
เชี่ยวชาญในการสร้าง Content Brief ที่ครบถ้วนและใช้งานได้จริงสำหรับนักเขียนบทความ SEO

สร้าง Content Brief ตาม format นี้เท่านั้น:

## H1 (ชื่อบทความ)
[ชื่อบทความที่ดี มี primary keyword อยู่ใน H1 เป็นธรรมชาติ]

## เป้าหมายบทความ
[อธิบาย 2-3 ประโยคว่าบทความนี้จะช่วยผู้อ่านอย่างไร]

## Target Audience
[กลุ่มเป้าหมายหลัก 1-2 บรรทัด]

## Featured Snippet Paragraph (40-60 คำ)
[ย่อหน้าที่ตอบคำถามหลักโดยตรง ใส่ primary keyword ในประโยคแรก ต้องยาว 40-60 คำพอดี]

## โครงสร้างบทความ (Outline)
[H2 แต่ละหัวข้อพร้อม H3 ย่อย และจำนวนคำแนะนำต่อ section เช่น (150-200 คำ)]

## LSI Keywords (8-10 คำ)
[รายการคำที่ควรกล่าวถึงในบทความ]

## Internal Links ที่แนะนำ
[ดึงจาก site inventory ที่ให้มา 2-3 ลิงก์ที่เหมาะสมพร้อม anchor text ที่แนะนำ]

## CTA (Call-to-Action)
[CTA ที่เหมาะสมกับ content type]

กฎสำคัญ (ต้องทำตาม):
- ห้ามใช้ ":" ในชื่อ heading ใดๆ ทั้งสิ้น
- ห้ามใช้คำว่า "สำหรับ SME" ใน heading
- ทุก heading เป็นภาษาไทยที่เป็นธรรมชาติ อ่านง่าย
- เนื้อหาต้องเหมาะกับ SME ไทยและเจ้าของธุรกิจ`

const WORD_LIMITS: Record<string, string> = {
  'Pillar Page': '2000-2500',
  'Blog': '1000-1500',
  'Landing Page': '800-1200',
}

function buildSystemPrompt(brandVoice: string | null, writingRules: string | null): string {
  let prompt = BASE_BRIEF_PROMPT

  if (brandVoice) {
    prompt += `\n\nBrand Voice ของโปรเจคนี้: ${brandVoice}`
  }

  if (writingRules) {
    prompt += `\nกฎการเขียน: ${writingRules}`
  }

  return prompt
}

export async function POST(req: NextRequest) {
  const { keywordId, projectId } = await req.json()
  if (!keywordId || !projectId) {
    return new Response('keywordId and projectId required', { status: 400 })
  }

  const supabase = createServiceClient()

  // Load project config
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id, brand_voice, writing_rules, site_inventory')
    .eq('id', projectId)
    .single()
  if (projErr || !project) {
    return new Response('Project not found', { status: 404 })
  }

  // Load keyword
  const { data: keyword, error: kwErr } = await supabase
    .from('keywords')
    .select('*')
    .eq('id', keywordId)
    .single()
  if (kwErr || !keyword) {
    return new Response('Keyword not found', { status: 404 })
  }

  // Find or create article
  let articleId: string
  let articleSlug: string
  const { data: existing } = await supabase
    .from('articles')
    .select('id, slug')
    .eq('keyword_id', keywordId)
    .single()

  if (existing) {
    articleId = existing.id
    articleSlug = existing.slug
    await supabase.from('articles').update({ status: 'generating-brief' }).eq('id', articleId)
  } else {
    const { data: created, error: createErr } = await supabase
      .from('articles')
      .insert({
        project_id: projectId,
        keyword_id: keywordId,
        slug: keyword.slug,
        title: keyword.title,
        primary_keyword: keyword.primary_keyword,
        cluster: keyword.cluster,
        content_type: keyword.content_type,
        priority: keyword.priority,
        status: 'generating-brief',
      })
      .select('id, slug')
      .single()
    if (createErr || !created) {
      return new Response('Failed to create article', { status: 500 })
    }
    articleId = created.id
    articleSlug = created.slug
  }

  // Update keyword status
  await supabase
    .from('keywords')
    .update({ status: 'generating-brief', article_id: articleId })
    .eq('id', keywordId)

  // Build prompts
  const systemPrompt = buildSystemPrompt(project.brand_voice, project.writing_rules)
  const wordLimit = WORD_LIMITS[keyword.content_type] ?? '1000-1500'

  const siteInventorySection = project.site_inventory
    ? `\n\n**Site Inventory (ใช้สำหรับ Internal Links):**\n${project.site_inventory}`
    : ''

  const userPrompt = `สร้าง Content Brief สำหรับบทความนี้

**Primary Keyword:** ${keyword.primary_keyword}
**ชื่อบทความ:** ${keyword.title}
**Content Type:** ${keyword.content_type}
**Cluster:** ${keyword.cluster}
**จำนวนคำเป้าหมาย:** ${wordLimit} คำ${siteInventorySection}

สร้าง brief ที่ครบถ้วนและพร้อมใช้งานตาม format ที่กำหนดไว้`

  const encoder = new TextEncoder()
  let fullText = ''

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            fullText += event.delta.text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            )
          }
        }

        const finalMsg = await stream.finalMessage()
        const usage = finalMsg.usage
        const briefTokens = usage.input_tokens + usage.output_tokens

        await Promise.all([
          supabase
            .from('articles')
            .update({
              brief_md: fullText,
              status: 'brief-ready',
              token_usage: { brief: briefTokens, article: 0, total: briefTokens },
            })
            .eq('id', articleId),
          supabase
            .from('keywords')
            .update({ status: 'brief-ready' })
            .eq('id', keywordId),
        ])

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              done: true,
              slug: articleSlug,
              usage: { input: usage.input_tokens, output: usage.output_tokens },
            })}\n\n`
          )
        )
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Stream error'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
