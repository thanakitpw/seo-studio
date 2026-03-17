import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BASE_SYSTEM_PROMPT = `คุณคือนักเขียนบทความ SEO ภาษาไทย ผู้เชี่ยวชาญด้าน Digital Marketing สำหรับตลาดไทย
เขียนบทความที่อ่านง่าย เป็นธรรมชาติ และมีประโยชน์สำหรับเจ้าของธุรกิจและ SME ไทย

กฎการเขียน (ต้องทำตามทุกข้อ):
1. ห้ามใช้ ":" ในเนื้อหาหรือ heading ใดๆ — ใช้ "—" หรือขึ้นบรรทัดใหม่แทน
2. ห้ามใช้คำว่า "สำหรับ SME" ใน heading ใดๆ
3. ย่อหน้าสั้น ไม่เกิน 3-5 ประโยคต่อย่อหน้า
4. ต้องมี Featured Snippet paragraph ในช่วงต้น (40-60 คำ ตอบคำถามหลักโดยตรง)
5. ต้องมี FAQ section ท้ายบทความ 5 ข้อ พร้อม JSON-LD schema ใน code block
6. ต้องใส่ internal links อย่างน้อย 2 ลิงก์จาก site inventory ที่ให้มา
7. เขียนในรูปแบบ Markdown
8. ห้ามมี # H1 ในเนื้อหา — เริ่มด้วย ## (H2) เป็น heading แรก
9. Anchor text ของ internal link ต้องอธิบายหน้าปลายทางชัดเจน ห้ามใช้ "คลิกที่นี่"

Word limit ตาม content type:
- Pillar Page — 2000-2500 คำ
- Blog — 1000-1500 คำ
- Landing Page — 800-1200 คำ`

const WORD_LIMITS: Record<string, string> = {
  'Pillar Page': '2000-2500',
  'Blog': '1000-1500',
  'Landing Page': '800-1200',
}

export async function POST(req: NextRequest) {
  const { slug, projectId } = await req.json()
  if (!slug) return new Response('slug required', { status: 400 })
  if (!projectId) return new Response('projectId required', { status: 400 })

  const supabase = createServiceClient()

  // Fetch article
  const { data: article, error: artErr } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('project_id', projectId)
    .single()
  if (artErr || !article) return new Response('Article not found', { status: 404 })
  if (!article.brief_md) return new Response('Brief not found', { status: 400 })

  // Fetch project config
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('brand_voice, writing_rules, site_inventory')
    .eq('id', projectId)
    .single()
  if (projErr || !project) return new Response('Project not found', { status: 404 })

  // Update status
  await Promise.all([
    supabase.from('articles').update({ status: 'generating-article' }).eq('slug', slug),
    supabase.from('keywords').update({ status: 'generating-article' }).eq('id', article.keyword_id),
  ])

  // Build system prompt with project config
  let systemPrompt = BASE_SYSTEM_PROMPT

  if (project.writing_rules) {
    systemPrompt += `\n\nกฎการเขียนของโปรเจคนี้:\n${project.writing_rules}`
  }

  if (project.site_inventory) {
    systemPrompt += `\n\nSite Inventory สำหรับ Internal Links:\n${project.site_inventory}`
  }

  if (project.brand_voice) {
    systemPrompt += `\n\nBrand Voice:\n${project.brand_voice}`
  }

  const wordLimit = WORD_LIMITS[article.content_type ?? 'Blog'] ?? '1000-1500'
  const userPrompt = `เขียนบทความตาม Content Brief ด้านล่างนี้

**Content Type:** ${article.content_type}
**Primary Keyword:** ${article.primary_keyword}
**จำนวนคำเป้าหมาย:** ${wordLimit} คำ

---
**Content Brief:**
${article.brief_md}
---

เขียนบทความฉบับเต็มตาม brief ด้านบน ให้ครบตาม word limit และปฏิบัติตามกฎทุกข้อ`

  const encoder = new TextEncoder()
  let fullText = ''

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: [
      { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
    ],
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
        const articleTokens = usage.input_tokens + usage.output_tokens
        const existingUsage = article.token_usage ?? { brief: 0, article: 0, total: 0 }
        const newUsage = {
          brief: existingUsage.brief,
          article: articleTokens,
          total: existingUsage.brief + articleTokens,
        }

        await Promise.all([
          supabase
            .from('articles')
            .update({ content_md: fullText, status: 'draft', token_usage: newUsage })
            .eq('slug', slug),
          supabase.from('keywords').update({ status: 'draft' }).eq('id', article.keyword_id),
        ])

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              done: true,
              slug,
              usage: { input: usage.input_tokens, output: usage.output_tokens, total: newUsage.total },
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
