# SEO Studio v2.0 — Agent Team

**วันที่:** 2026-03-15
**วัตถุประสงค์:** แบ่งงานให้ agent team ทำงานแบบ parallel เพื่อเพิ่มความเร็วในการ dev

---

## 1. Agent Overview

```
                    ┌──────────────┐
                    │  Orchestrator │ ← คุณ (user) สั่ง + Claude หลัก coordinate
                    │  (Main Agent) │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │  Designer  │   │ Frontend  │   │  Backend   │
    │   Agent    │   │   Agent   │   │   Agent    │
    └───────────┘   └───────────┘   └───────────┘
                           │
                    ┌──────┴───────┐
                    │              │
              ┌─────▼─────┐ ┌─────▼─────┐
              │ AI Pipeline│ │   Image   │
              │   Agent    │ │   Agent   │
              └───────────┘ └───────────┘
```

---

## 2. Agent Definitions

### 2.1 Orchestrator (Main Agent)

**Role:** Project manager — วางแผน, แบ่งงาน, review ผลลัพธ์
**ใครเป็น:** Claude หลักที่ user คุยด้วย

**Responsibilities:**
- อ่าน REDESIGN.md เข้าใจ scope ทั้งหมด
- แบ่ง task ให้ agent ที่เหมาะสม
- Launch agents แบบ parallel เมื่อ tasks เป็นอิสระ
- Review + merge ผลงานจาก agents
- Run TypeScript check หลังรวมงาน
- Report progress ให้ user

**เมื่อไหร่ที่ orchestrator ทำเอง:**
- แก้ไฟล์เล็กน้อย (1-2 ไฟล์)
- Fix TypeScript errors หลัง merge
- Update REDESIGN.md / CLAUDE.md

---

### 2.2 Designer Agent

**Role:** ออกแบบ UI ใน Paper MCP
**Type:** `general-purpose` (ต้องใช้ MCP tools)

**System Prompt:**
```
คุณเป็น UI Designer สำหรับ SEO Studio v2.0

Design System:
- Primary: #6467f2, BG: #f6f6f8, Dark: #101122
- Font: Noto Sans Thai + Inter (body), JetBrains Mono (code)
- Icons: SVG (Lucide style) — ห้ามใช้ emoji
- Border radius: 4/8/12/9999px
- Shadows: sm/lg/2xl

Rules:
- ใช้ Paper MCP tools เท่านั้น (create_artboard, write_html, get_screenshot)
- เขียน HTML ทีละ visual group (ห้าม batch ทั้งหน้า)
- Screenshot review ทุก 2-3 modifications
- ใช้ inline styles, display: flex, ห้าม grid/margin/emoji
- ภาษาไทยใน UI, ชื่อ layer เป็น English

อ่าน REDESIGN.md section 5 + 7 สำหรับ wireframe และ design specs
```

**Tasks ที่ทำ:**
| # | Artboard | Priority |
|---|---|---|
| 1 | Keyword List (flat table) | P1 |
| 2 | Project Dashboard | P1 |
| 3 | Article Editor | P2 |
| 4 | AI Writing (streaming) | P2 |
| 5 | Cover Image Gallery | P2 |
| 6 | Generate Cover Modal | P2 |
| 7 | Brief Review | P3 |
| 8 | New Project (3-step) | P3 |
| 9 | Add Keyword Modal | P3 |
| 10 | Import CSV Modal | P3 |
| 11 | Publish Confirm Modal | P3 |
| 12 | Project Settings | P3 |

---

### 2.3 Frontend Agent

**Role:** สร้าง React components, pages, layouts
**Type:** `general-purpose` with `isolation: worktree`

**System Prompt:**
```
คุณเป็น Frontend Developer สำหรับ SEO Studio v2.0

Stack: Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui
Auth: Cookie-based (src/proxy.ts)
Design: ดู REDESIGN.md section 7 (Design System)

Rules:
- ใช้ 'use client' เฉพาะ component ที่ต้องการ interactivity
- Server Components เป็น default
- Font: Noto Sans Thai + Inter
- Icons: ใช้ lucide-react
- ห้าม import next/headers ใน client component
- Responsive: sidebar collapse บน mobile
- ภาษาไทยใน UI

URL Structure: /projects/[projectId]/...
อ่าน REDESIGN.md section 2 + 4 + 5 สำหรับ IA และ wireframes
อ่าน src/types/index.ts สำหรับ types ที่มีอยู่
```

**Tasks ที่ทำ:**

**Phase A — Layout & Navigation (parallel ได้ทั้งหมด)**
| Task | Files | Dependencies |
|---|---|---|
| A1. Project Layout | `src/app/projects/layout.tsx`, `src/components/layout/ProjectSidebar.tsx` | — |
| A2. Project Switcher | `src/components/layout/ProjectSwitcher.tsx` | — |
| A3. Breadcrumb | `src/components/layout/Breadcrumb.tsx` | — |

**Phase B — Pages (parallel ได้บางส่วน)**
| Task | Files | Dependencies |
|---|---|---|
| B1. Project List page | `src/app/projects/page.tsx`, `src/components/projects/ProjectCard.tsx` | A1 |
| B2. New Project form | `src/app/projects/new/page.tsx`, `src/components/projects/NewProjectForm.tsx` | A1 |
| B3. Project Dashboard | `src/app/projects/[id]/dashboard/page.tsx` | A1 |
| B4. Keyword List (flat table) | `src/app/projects/[id]/keywords/page.tsx`, `src/components/keywords/KeywordTable.tsx` | A1 |
| B5. Cover Image Gallery | `src/app/projects/[id]/images/page.tsx` | A1 |

**Phase C — Workflow Pages (ต้องรอ Backend Agent)**
| Task | Files | Dependencies |
|---|---|---|
| C1. Brief Review | `src/app/projects/[id]/articles/[slug]/brief/page.tsx` | Backend API |
| C2. AI Writing | `src/app/projects/[id]/articles/[slug]/writing/page.tsx` | Backend API |
| C3. Article Editor | `src/app/projects/[id]/articles/[slug]/edit/page.tsx` | Backend API |
| C4. Project Settings | `src/app/projects/[id]/settings/page.tsx` | Backend API |

---

### 2.4 Backend Agent

**Role:** API routes, database, Supabase integration
**Type:** `general-purpose` with `isolation: worktree`

**System Prompt:**
```
คุณเป็น Backend Developer สำหรับ SEO Studio v2.0

Stack: Next.js 16 API Routes, TypeScript, Supabase (Postgres + Storage)
DB: ใช้ createServiceClient() จาก src/lib/supabase.ts
Auth: Cookie-based — ตรวจ session ก่อนทุก route

Rules:
- ทุก route ต้องรับ project_id (ยกเว้น /api/projects)
- ดึง project config (brand_voice, writing_rules, site_inventory) จาก projects table
- Encrypt supabase_service_role_key ด้วย AES-256
- ห้ามส่ง field `status` ไป blog_posts table
- Error response: { error: string, details?: string }

อ่าน REDESIGN.md section 3 (Schema) + 8 (API Routes)
อ่าน src/types/index.ts สำหรับ types
```

**Tasks ที่ทำ:**

**Phase A — Database (sequential)**
| Task | Files | Dependencies |
|---|---|---|
| A1. Create projects table | `supabase/migrations/002_projects.sql` | — |
| A2. Create cover_images table | `supabase/migrations/003_cover_images.sql` | A1 |
| A3. Add project_id to keywords/articles | `supabase/migrations/004_add_project_id.sql` | A1 |
| A4. Seed default project | `supabase/seed_project.sql` | A1-A3 |

**Phase B — API Routes (parallel ได้)**
| Task | Files | Dependencies |
|---|---|---|
| B1. Projects CRUD | `src/app/api/projects/route.ts`, `src/app/api/projects/[id]/route.ts` | A1 |
| B2. Test Connection | `src/app/api/projects/[id]/test-connection/route.ts` | A1 |
| B3. Update Keywords routes | แก้ `src/app/api/keywords/route.ts` เพิ่ม project_id filter | A3 |
| B4. Update AI routes | แก้ `src/app/api/ai/brief/route.ts`, `article/route.ts` ดึง config จาก project | A1 |
| B5. Update Publish route | แก้ `src/app/api/publish/route.ts` ใช้ credentials จาก project | A1 |

**Phase C — Image API (ต้องรอ A1-A2)**
| Task | Files | Dependencies |
|---|---|---|
| C1. Generate image route | `src/app/api/images/generate/route.ts` | A2 |
| C2. List images route | `src/app/api/images/route.ts` | A2 |
| C3. Use image route | `src/app/api/images/[id]/use/route.ts` | A2 |

---

### 2.5 AI Pipeline Agent

**Role:** Claude API prompts, streaming, prompt caching
**Type:** `general-purpose` with `isolation: worktree`

**System Prompt:**
```
คุณเป็น AI Pipeline Engineer สำหรับ SEO Studio v2.0

Stack: Anthropic SDK (claude-sonnet-4-6), Vercel AI SDK (streamText)
Prompt Caching: ใช้ cache_control: ephemeral

Rules:
- Brief + Article prompts ต้องดึง brand_voice, writing_rules, site_inventory จาก project settings
- System prompt ต้อง cache (cache_control: ephemeral)
- Article route max_tokens = 8192 (ไม่ใช่ 4096)
- Writer rules: ห้าม ":", ห้าม "สำหรับ SME" ใน heading, ต้องมี FAQ + JSON-LD
- Word limit ตาม content_type: Pillar 2000-2500, Blog 1000-1500, Landing 800-1200

อ่าน CLAUDE.md section "AI Rules"
อ่าน src/app/api/ai/ สำหรับ routes ที่มีอยู่
```

**Tasks:**
| Task | Files | Dependencies |
|---|---|---|
| 1. Refactor brief prompt to use project config | `src/app/api/ai/brief/route.ts` | Backend A1 |
| 2. Refactor article prompt to use project config | `src/app/api/ai/article/route.ts` | Backend A1 |
| 3. Fix max_tokens 4096 → 8192 | `src/app/api/ai/article/route.ts` | — |
| 4. Auto-generate cover image prompt | `src/app/api/ai/cover-prompt/route.ts` | Backend A1 |
| 5. AI meta assist (title/desc/excerpt) | `src/app/api/ai/meta/route.ts` | Backend A1 |

---

### 2.6 Image Agent

**Role:** fal.ai nano-banana-2 integration, sharp, Supabase Storage
**Type:** `general-purpose` with `isolation: worktree`

**System Prompt:**
```
คุณเป็น Image Engineer สำหรับ SEO Studio v2.0

Stack: @fal-ai/client, sharp, Supabase Storage
Model: fal-ai/nano-banana-2

API Call:
  fal.subscribe("fal-ai/nano-banana-2", {
    input: {
      prompt: "...",
      resolution: "1K",
      aspect_ratio: "landscape_16_9",
      output_format: "webp",
      num_images: 1,
    }
  })

Flow: generate → download from fal temp URL → resize 1200x630 (sharp) → upload Supabase Storage
Path: blog-covers/[slug].webp
Env: FAL_KEY

อ่าน REDESIGN.md section 9 สำหรับ full integration spec
อ่าน src/app/api/upload/cover/route.ts สำหรับ sharp + Supabase upload ที่มีอยู่
```

**Tasks:**
| Task | Files | Dependencies |
|---|---|---|
| 1. Install @fal-ai/client | package.json | — |
| 2. Generate image route | `src/app/api/images/generate/route.ts` | — |
| 3. Download + resize + upload | `src/lib/image.ts` (shared util) | — |
| 4. List images route | `src/app/api/images/route.ts` | Backend A2 |
| 5. Use image for article | `src/app/api/images/[id]/use/route.ts` | Backend A2 |

---

## 3. Team Workflows

### 3.1 Parallel Kickoff (Day 1)

เริ่มงานพร้อมกัน 4 agents:

```
┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Designer   │  │   Backend    │  │  Frontend    │  │    Image     │
│  Agent      │  │   Agent      │  │  Agent       │  │    Agent     │
├─────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤
│ Design:     │  │ DB:          │  │ Layout:      │  │ Install:     │
│ • Keyword   │  │ • projects   │  │ • Sidebar    │  │ • fal client │
│   List      │  │ • cover_imgs │  │ • Switcher   │  │ • image util │
│ • Dashboard │  │ • migrations │  │ • Breadcrumb │  │ • generate   │
│             │  │              │  │              │  │   route      │
│ (Paper MCP) │  │ (worktree)   │  │ (worktree)   │  │ (worktree)   │
└─────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
      ↓                ↓                 ↓                  ↓
   Designs         SQL files       Components          API routes
   ready           ready           ready                ready
```

### 3.2 Integration Phase (Day 2)

Backend เสร็จ → Frontend ต่อ:

```
Backend Agent (done) ──→ Frontend Agent
                         • Project List page
                         • Keyword Table page
                         • Dashboard page
                         • Cover Image Gallery

Image Agent (done) ───→ Frontend Agent
                         • Generate Cover Modal
                         • Cover Image tab in Editor
```

### 3.3 Workflow Pages (Day 3)

ต้องรอ Backend + AI Pipeline:

```
AI Pipeline Agent ──→ Frontend Agent
                       • Brief Review page
                       • AI Writing page
                       • Article Editor

Backend Agent ──────→ Frontend Agent
                       • Project Settings
                       • Publish flow
```

### 3.4 Polish (Day 4)

Orchestrator ทำเอง:
```
• TypeScript check (npx tsc --noEmit)
• Empty states ทุกหน้า
• Error handling review
• Responsive check
• Final build test
```

---

## 4. How to Invoke Agents

### คำสั่งสำหรับ user:

**เริ่มงาน parallel (สั่ง orchestrator):**
```
ช่วย launch agent team ตาม AGENTS.md
เริ่ม Phase A — Designer + Backend + Frontend + Image พร้อมกัน
```

**สั่ง agent เฉพาะตัว:**
```
ช่วยให้ Designer Agent ออกแบบหน้า Keyword List ใน Paper
ช่วยให้ Backend Agent สร้าง projects table + API routes
ช่วยให้ Frontend Agent สร้าง layout + sidebar + project switcher
ช่วยให้ Image Agent สร้าง fal.ai integration
```

**สั่ง integration:**
```
merge งาน Backend + Frontend เข้าด้วยกัน
run TypeScript check แล้วแก้ errors
```

### Orchestrator จะ launch agents แบบนี้:

```
// Parallel launch — 4 agents พร้อมกัน
Agent(Designer, "ออกแบบ Keyword List + Dashboard ใน Paper ตาม REDESIGN.md")
Agent(Backend, "สร้าง DB migrations + Projects API ตาม REDESIGN.md section 3+8", isolation: worktree)
Agent(Frontend, "สร้าง Layout + Sidebar + Breadcrumb + ProjectSwitcher ตาม REDESIGN.md section 4", isolation: worktree)
Agent(Image, "สร้าง fal.ai integration + generate route ตาม REDESIGN.md section 9", isolation: worktree)
```

---

## 5. File Ownership (ป้องกัน conflict)

| Agent | Owns These Files | Read-only |
|---|---|---|
| **Designer** | Paper MCP artboards | REDESIGN.md |
| **Frontend** | `src/app/projects/`, `src/components/` | `src/types/`, `src/lib/` |
| **Backend** | `src/app/api/`, `supabase/`, `src/types/` | — |
| **AI Pipeline** | `src/app/api/ai/` | `src/lib/supabase.ts` |
| **Image** | `src/app/api/images/`, `src/lib/image.ts` | `src/lib/supabase.ts` |

**Conflict zones (ต้อง coordinate):**
- `src/types/index.ts` — Backend เป็นเจ้าของ, อื่นใช้ read-only
- `src/lib/supabase.ts` — shared, แก้เฉพาะเมื่อจำเป็น
- `package.json` — Image Agent เพิ่ม @fal-ai/client, Orchestrator merge

---

## 6. Types ที่ต้องเพิ่ม (Backend Agent)

```typescript
// เพิ่มใน src/types/index.ts

export type ConnectionType = 'supabase' | 'rest_api'

export interface Project {
  id: string
  name: string
  slug: string
  domain: string | null
  connection_type: ConnectionType
  // Supabase connection
  supabase_url: string | null
  supabase_anon_key: string | null
  supabase_service_role_key: string | null
  storage_bucket: string
  // REST API connection
  api_endpoint: string | null
  api_key: string | null
  api_method: 'POST' | 'PUT'
  brand_voice: string | null
  writing_rules: string | null
  site_inventory: string | null
  cover_image_style: string | null
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
}

export interface CoverImage {
  id: string
  project_id: string
  article_id: string | null
  prompt: string
  image_url: string | null
  fal_request_id: string | null
  status: 'pending' | 'generating' | 'completed' | 'failed'
  width: number
  height: number
  created_at: string
}

// แก้ Keyword — เพิ่ม project_id
export interface Keyword {
  // ... existing fields ...
  project_id: string  // NEW
}

// แก้ Article — เพิ่ม project_id
export interface Article {
  // ... existing fields ...
  project_id: string  // NEW
}
```
