# CLAUDE.md — SEO Studio v2.0
**โปรเจค:** AI SEO Content Pipeline — Multi-Project Internal Tool
**อัพเดทล่าสุด:** 2026-03-16

---

## คำสั่งสำหรับ Claude (ต้องปฏิบัติทุกครั้ง)

### ภาษา
- **ตอบเป็นภาษาไทยเสมอ** ทุก response ไม่ว่าคำถามจะเป็นภาษาอะไร

### Git & GitHub
- **GitHub repo:** https://github.com/thanakitpw/seo-studio.git
- **ห้าม commit และ push ถ้ายังไม่ได้รับคำสั่ง** ไม่ว่าจะทำงานเสร็จแค่ไหน รอให้ user สั่งก่อนเสมอ

### การใช้ Skills
ใช้เฉพาะ skills ที่จำเป็นกับโปรเจคนี้:

| งาน | Skill |
|---|---|
| Next.js / React | `nextjs-best-practices`, `react-best-practices` |
| TypeScript | `typescript-expert` |
| Styling | `tailwind-patterns`, `shadcn` |
| Database | `postgresql`, `database-design` |
| API | `api-endpoint-builder`, `nextjs-supabase-auth` |
| AI / Streaming | `claude-api`, `vercel-ai-sdk-expert` |
| SEO | `seo-content-writer`, `seo-fundamentals` |
| UI/UX | `ui-ux-pro-max` |
| Debug | `systematic-debugging` |
| Quality | `verification-before-completion` |
| Deploy | `vercel-deployment` |
| Git | `commit`, `pr-writer` |

### การ Dev Frontend (ต้องทำทุกครั้งที่สร้างหน้าใหม่)

เวลา dev frontend ทุกหน้า ให้ทำตามขั้นตอนนี้ **อัตโนมัติ** ไม่ต้องรอ user สั่ง:

1. **ดึง JSX จาก Paper** — ใช้ `get_jsx` จาก artboard ที่ตรงกับหน้าที่กำลัง dev
2. **แปลงเป็น React + Tailwind** — แปลง inline styles เป็น Tailwind classes, ใส่ props, map data
3. **ใส่ data จริง** — เชื่อม API, ใส่ dynamic content แทน static
4. **เทียบ design** — ใช้ `get_screenshot` จาก Paper เทียบกับหน้าจอจริง แก้จุดที่ต่าง

### ขั้นตอน Test หลังทำงานเสร็จ (ต้องทำทุกครั้ง)

1. **TypeScript check** — รัน `npx tsc --noEmit` ต้องผ่านไม่มี error
2. **ตรวจสอบ** — ไม่มี console.log หลงเหลือ, import paths ถูกต้อง
3. **อัพเดท progress** — อัพเดท Development Progress section ในไฟล์นี้

### ขั้นตอน Test หลังทำแต่ละ Phase เสร็จ (บังคับ — ห้ามข้าม)

ทุกครั้งที่ทำ phase เสร็จ **ต้อง** ทำตามลำดับนี้ก่อนไป phase ถัดไป:

1. **รัน E2E tests** — `npm run test:e2e` ต้องผ่านทั้งหมด (30 tests)
2. **รัน UI audit** — `npm run test:ui-audit` เทียบ screenshot กับ baseline
3. **ให้ user ตรวจ browser** — เปิดทุกหน้าที่แก้ไข ส่ง screenshot ให้ user ดู
4. **แก้ bug ที่เจอ** — แก้ให้หมดก่อน commit
5. **อัพเดท baseline screenshots** — ถ้า UI เปลี่ยนตั้งใจ รัน `npm run test:ui-audit:update`
6. **อัพเดท TASKS.md** — ติ๊ก [x] tasks ที่ทำเสร็จ
7. **Commit + Push** — เมื่อ user สั่งเท่านั้น

---

## v2.0 สิ่งที่เปลี่ยนจาก v1.0

| เปลี่ยนแปลง | v1.0 | v2.0 |
|---|---|---|
| Project | Single project | Multi-project (project_id FK) |
| Cover Image | แค่ prompt, ต้องใช้ tool ข้างนอก | fal.ai nano-banana-2 ใน app |
| Connection | Hardcoded Supabase credentials | Per-project: Supabase หรือ REST API |
| Config | ENV vars / code | Per-project: brand_voice, writing_rules, site_inventory |
| URL Structure | `/dashboard`, `/articles/[slug]` | `/projects/[id]/dashboard`, `/projects/[id]/articles/[slug]` |
| Sidebar | ตายตัว | Project Switcher + per-project nav |
| Next.js | 16 | 16 |

---

## Design System (จาก Paper design — ต้องทำตามเป๊ะๆ)

### Colors
```js
primary: "#6467f2"          // indigo/purple — ปุ่มหลัก, active state, highlight
background-light: "#f6f6f8" // หน้า light mode
background-dark:  "#101122" // หน้า dark mode
```

### Fonts
- **Noto Sans Thai** + **Inter** — ใช้ควบคู่กัน (`font-family: 'Noto Sans Thai', 'Inter', sans-serif`)
- **JetBrains Mono** — ใช้เฉพาะ Markdown editor

### Border Radius
```js
DEFAULT: "0.25rem"  // rounded
lg:      "0.5rem"   // rounded-lg
xl:      "0.75rem"  // rounded-xl
full:    "9999px"   // rounded-full
```

### Icons
- ใช้ **Material Symbols Outlined** เท่านั้น (Google Fonts CDN)
- Settings: `font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`

### Layout ทั้งระบบ (v2.0)
```
┌─────────────────────────────────────────────────────────┐
│ Header (h-14)                                           │
│ [☰] SEO Studio  [Project Switcher ▾]       [⚙] [👤]   │
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │ Content Area                                 │
│ (w-60)   │                                              │
│          │ Breadcrumb: Projects > Best Solutions > ...   │
│ 📊 ภาพรวม│                                              │
│ 🔑 คำหลัก│ [Page Content]                               │
│ 📝 บทความ│                                              │
│ 🖼 รูปปก │                                              │
│ ⚙ ตั้งค่า│                                              │
│          │                                              │
│ ─────── │                                              │
│ Projects │                                              │
│ • Best.. │                                              │
│ + สร้างใหม่│                                             │
└──────────┴──────────────────────────────────────────────┘
```
- **Sidebar** กว้าง `w-60` — bg-white, border-r border-slate-200
- **Header** สูง `h-14` — sticky top-0 z-10, bg-white, border-b border-slate-200
- **Content area** — bg-background-light, `p-8 space-y-6`

### Status Badge Colors
| Status | Style |
|---|---|
| เผยแพร่แล้ว | bg-emerald-100 text-emerald-700 |
| รอดำเนินการ | bg-amber-100 text-amber-700 |
| ร่าง | bg-slate-100 text-slate-600 |
| กำลังสร้าง | bg-primary/10 text-primary |

### KD Bar Colors
- KD ต่ำ (0-30): `bg-emerald-400`
- KD กลาง (31-60): `bg-orange-400`
- KD สูง (61+): `bg-red-400`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| Database | Supabase (Postgres + Storage) |
| AI | Anthropic SDK (`claude-sonnet-4-6`) |
| Streaming | Vercel AI SDK (`streamText`) |
| Image Gen | fal.ai (`nano-banana-2`) |
| Image Process | sharp (WebP conversion) |
| Styling | Tailwind CSS v4 |
| Icons | Material Symbols Outlined + Lucide React |
| Hosting | Vercel |

---

## Database Tables

### `projects` table (NEW in v2.0)
- `id` (uuid PK), `name`, `slug` (unique), `domain`
- Connection: `connection_type` ('supabase' | 'rest_api'), `supabase_url`, `supabase_anon_key`, `supabase_service_role_key`, `storage_bucket`
- REST API: `api_endpoint`, `api_key`, `api_method`
- Content: `brand_voice`, `writing_rules`, `site_inventory`, `cover_image_style`
- Meta: `status` ('active' | 'archived'), `created_at`, `updated_at`

### `keywords` table (updated)
- เหมือน v1.0 + `project_id` uuid FK → projects(id)
- Status values: `pending | generating-brief | brief-ready | generating-article | draft | review | published`

### `articles` table (updated)
- เหมือน v1.0 + `project_id` uuid FK → projects(id)

### `cover_images` table (NEW in v2.0)
- `id` (uuid PK), `project_id` FK, `article_id` FK (nullable)
- `prompt`, `image_url`, `fal_request_id`, `status` ('pending' | 'generating' | 'completed' | 'failed')
- `width` (1200), `height` (630), `created_at`

### Existing `blog_posts` table (Supabase เดิม — publish target)
- **ห้ามส่ง field `status`** — ไม่มีใน schema
- Publish payload: `slug, title, excerpt, content (HTML), category, tags, author_name, cover_image, seo_title, seo_description, published_at: null`

---

## Auth
- Cookie-based password auth (ไม่ใช่ Supabase Auth)
- Session cookie: `seo-studio-session` (httpOnly, 30 days)
- Auth file: `src/proxy.ts` (Next.js 16 ใช้ `proxy` ไม่ใช่ `middleware`)

## Next.js 16 Gotchas
- ใช้ `src/proxy.ts` + `export function proxy`
- `next/headers` ห้าม import ใน client component

---

## URL Structure (v2.0)

```
/                                              → redirect → /projects
/login                                         → Login page
/projects                                      → Project list (home)
/projects/new                                  → สร้างโปรเจคใหม่ (3-step wizard)
/projects/[id]/dashboard                       → Dashboard ของโปรเจค
/projects/[id]/keywords                        → Keyword list (flat table)
/projects/[id]/articles                        → Article list
/projects/[id]/articles/[slug]/brief           → Brief review
/projects/[id]/articles/[slug]/writing         → AI writing (streaming terminal)
/projects/[id]/articles/[slug]/edit            → Markdown editor (3-column)
/projects/[id]/articles/[slug]/publish         → Publish confirm
/projects/[id]/images                          → Cover image gallery
/projects/[id]/settings                        → Project settings (4 tabs)
```

---

## API Routes (v2.0)

```
# Auth
POST   /api/auth/login
POST   /api/auth/logout

# Projects
GET    /api/projects                           — list all
POST   /api/projects                           — create
GET    /api/projects/[id]                      — detail
PATCH  /api/projects/[id]                      — update
DELETE /api/projects/[id]                      — archive (soft delete)
POST   /api/projects/[id]/test-connection      — test Supabase/REST connection

# Keywords (+ project_id filter)
GET    /api/keywords?project_id=xxx            — list (filter: cluster, status, priority)
POST   /api/keywords                           — add single
POST   /api/keywords/import                    — bulk CSV import
GET    /api/keywords/template                  — download CSV template
PATCH  /api/keywords/[id]                      — update

# AI Pipeline
POST   /api/ai/brief                           — generate brief (streaming, uses project config)
POST   /api/ai/article                         — generate article (streaming, max_tokens=8192)
POST   /api/ai/meta                            — generate meta_title, meta_description, excerpt
POST   /api/ai/cover-prompt                    — generate cover image prompt

# Articles
GET    /api/articles?project_id=xxx            — list
GET    /api/articles/[slug]                    — detail
PATCH  /api/articles/[slug]                    — update draft

# Images (NEW)
GET    /api/images?project_id=xxx              — list cover images
POST   /api/images/generate                    — fal.ai generate
POST   /api/images/[id]/use                    — assign to article

# Publish
POST   /api/publish                            — publish (supports Supabase + REST API)

# Upload
POST   /api/upload/cover                       — upload → WebP → Supabase Storage
```

---

## AI Rules (System Prompts — ดึงจาก project config)

### Writer Agent
- ห้ามใช้ ":" ในเนื้อหา
- ห้ามใช้ "สำหรับ SME" ใน heading
- ต้องมี Featured Snippet paragraph (40-60 คำ)
- ต้องมี FAQ 5 ข้อ + JSON-LD schema
- ต้องมี internal links อย่างน้อย 2 ลิงก์ (ดึงจาก project.site_inventory)
- Word limit ตาม content type:
  - Pillar Page: 2000-2500 คำ
  - Blog: 1000-1500 คำ
  - Landing Page: 800-1200 คำ

### Cover Image
- Style ดึงจาก `project.cover_image_style`
- Default model: fal.ai `nano-banana-2` (~฿2.80/รูป)
- Output: WebP, 1200x630

---

## Prompt Caching

ใช้ `cache_control: ephemeral` สำหรับ:
- System prompt ของ brief agent
- System prompt ของ writer agent
- Project site_inventory (internal links)
- Project writing_rules/guidelines

---

## Cover Image (v2.0)

- **Generate**: fal.ai nano-banana-2 → download → sharp resize → upload Supabase Storage
- Upload path: `blog-covers/[ascii-slug].webp`
- WebP quality=85 via `sharp`
- Supabase Storage bucket: project.storage_bucket (default: `images`)

---

## Important Files

| File | Description |
|---|---|
| `src/proxy.ts` | Auth proxy (cookie-based) |
| `src/lib/supabase.ts` | Supabase clients (default + per-project) |
| `src/types/index.ts` | TypeScript types (Project, Keyword, Article, CoverImage) |
| [REDESIGN.md](./REDESIGN.md) | v2.0 Redesign spec (multi-project, fal.ai, 14 screens) |
| [AGENTS.md](./AGENTS.md) | Agent team definitions, workflows, file ownership |
| [TASKS.md](./TASKS.md) | Development tasks (106 tasks, 7 phases) + test checklist |

---

## Development Progress (อัพเดทเมื่อทำ task เสร็จ)

**Phase 1 (Setup + DB):** 12/12 tasks ✅ COMPLETE
- 1.1 สร้างโปรเจค: ✅ (Next.js 16, deps, env, supabase, proxy, types, tailwind)
- 1.2 Database Migrations: ✅ (SQL files สร้างแล้ว — รอ user รันบน Supabase)

**Phase 2 (Layout + Navigation):** 6/13 tasks
- 2.2 Projects API (CRUD + test-connection): ✅
**Phase 3 (Core Pages):** 5/28 tasks
- 3.1 Project Dashboard: ✅ (StatsCards, CategoryProgress, RecentActivity, TokenUsage — real Supabase data)
- 3.2 Keywords API: ✅ (GET with pagination/filter/search, POST, PATCH)
- 3.3 Keyword List Page: ✅ (KeywordTable, FilterBar, Pagination — ตาม Paper design)
- 3.4 Add Keyword Modal: ✅ (AddKeywordModal — form + auto slug + POST /api/keywords)
- 3.5 Import CSV Modal: ✅ (ImportCsvModal 3-step wizard + CSV template API + bulk import API)
**Phase 4 (AI Pipeline):** 4/10 tasks
- 4.1 Article Generation API (POST /api/ai/article): ✅ (SSE stream, project config, max_tokens=8192)
- 4.2 AI Writing Page: ✅ (WritingClient SSE streaming, live stats, terminal UI, progress bar)
- 4.3 Brief Generation API (POST /api/ai/brief): ✅ (SSE stream, project config, brand_voice, writing_rules, site_inventory)
- 4.4 Brief Review Page: ✅ (BriefClient SSE streaming, 2-panel layout, keyword info, auto-generate, regenerate)
**Phase 5 (Editor + Cover):** 0/20 tasks
**Phase 6 (Publish + Settings):** 0/11 tasks
**Phase 7 (Polish + Build):** 0/12 tasks
**Overall:** 27/106 tasks (25%)

_อัพเดท section นี้ทุกครั้งที่ task เสร็จ_
