# SEO Studio v2.0 — Development Tasks

**วันที่:** 2026-03-15
**วิธีทำ:** Dev + Test ทีละ Phase — ทุก commit ต้อง `tsc --noEmit` ผ่าน
**โปรเจค:** สร้างใหม่ (copy AI logic จาก v1.0)

---

## สัญลักษณ์

- `[ ]` ยังไม่ทำ
- `[~]` กำลังทำ
- `[x]` เสร็จแล้ว
- `[!]` มีปัญหา ต้องแก้
- 🤖 = Claude test (tsc, code review)
- 👤 = User test (เปิด browser ดูหน้าจอ + คลิกใช้งาน)

---

## Phase 1: Project Setup + Database (Day 1)

### 1.1 สร้างโปรเจคใหม่
| # | Task | Agent | Test |
|---|---|---|---|
| 1.1.1 | [x] `npx create-next-app@latest v2 --typescript --tailwind --app --src-dir` | Manual | 🤖 `npm run dev` ขึ้นไหม |
| 1.1.2 | [x] Copy `.env.local` จาก v1.0 + เพิ่ม `FAL_KEY` | Manual | 🤖 env vars ครบ |
| 1.1.3 | [x] Install dependencies: `@supabase/supabase-js`, `@anthropic-ai/sdk`, `ai`, `sharp`, `@fal-ai/client`, `lucide-react`, `marked` | Manual | 🤖 `npm install` ไม่ error |
| 1.1.4 | [x] Setup `src/lib/supabase.ts` (copy จาก v1.0 + เพิ่ม createProjectClient) | Backend | 🤖 import ไม่ error |
| 1.1.5 | [x] Setup `src/proxy.ts` auth (copy จาก v1.0) | Backend | 🤖 tsc ผ่าน |
| 1.1.6 | [x] Setup Tailwind config + Google Fonts (Noto Sans Thai, Inter, JetBrains Mono) | Frontend | 👤 font แสดงถูกต้อง |
| 1.1.7 | [x] Setup `src/types/index.ts` — เพิ่ม `Project`, `CoverImage`, `ConnectionType` types | Backend | 🤖 tsc ผ่าน |

**✅ Checkpoint 1.1:**
- 🤖 `npx tsc --noEmit` ผ่าน
- 🤖 `npm run dev` ขึ้นหน้าเปล่า
- Commit: `feat: initial project setup v2.0`

---

### 1.2 Database Migrations
| # | Task | Agent | Test |
|---|---|---|---|
| 1.2.1 | [x] สร้าง `projects` table (ตาม REDESIGN.md section 3.1) | Backend | 🤖 SQL syntax ถูกต้อง |
| 1.2.2 | [x] สร้าง `cover_images` table | Backend | 🤖 SQL syntax ถูกต้อง |
| 1.2.3 | [x] เพิ่ม `project_id` column ใน `keywords` + `articles` | Backend | 🤖 FK constraint ถูกต้อง |
| 1.2.4 | [x] สร้าง default project "Best Solutions" + migrate data เดิม | Backend | 🤖 query ได้ |
| 1.2.5 | [x] รัน migrations บน Supabase (MCP) + migrate data 76 keywords + 2 articles | Manual | 👤 ดูใน Supabase Dashboard ว่า table ขึ้น |

**✅ Checkpoint 1.2:**
- 👤 เปิด Supabase Dashboard → เห็น `projects`, `cover_images` tables
- 👤 Query `select * from projects` → เห็น "Best Solutions" row
- 👤 Query `select * from keywords where project_id is not null` → ข้อมูลเดิม migrate แล้ว
- Commit: `feat: database migrations for multi-project`

---

## Phase 2: Layout + Navigation (Day 1-2)

### 2.1 App Layout
| # | Task | Agent | Files | Test |
|---|---|---|---|---|
| 2.1.1 | [x] Root layout — fonts, globals.css, metadata | Frontend | `src/app/layout.tsx`, `src/app/globals.css` | 🤖 tsc + 👤 font ถูก |
| 2.1.2 | [x] Login page (copy + ปรับจาก v1.0) | Frontend | `src/app/login/page.tsx` | 👤 login ได้ |
| 2.1.3 | [x] Projects layout (Sidebar + Content area) | Frontend | `src/app/projects/layout.tsx` | 👤 sidebar แสดง |
| 2.1.4 | [x] Sidebar component | Frontend | `src/components/layout/Sidebar.tsx` | 👤 nav items ถูกต้อง, active state ทำงาน |
| 2.1.5 | [x] Project Switcher dropdown | Frontend | `src/components/layout/ProjectSwitcher.tsx` | 👤 กดเปลี่ยน project ได้ |
| 2.1.6 | [x] Breadcrumb component | Frontend | `src/components/layout/Breadcrumb.tsx` | 👤 แสดง path ถูกต้อง, คลิกกลับได้ |
| 2.1.7 | [x] Redirect `/` → `/projects` | Frontend | `src/app/page.tsx` | 👤 เปิด localhost → ไป /projects |

**✅ Checkpoint 2.1:**
- 🤖 `npx tsc --noEmit` ผ่าน
- 👤 Login → เห็น sidebar + breadcrumb
- 👤 Sidebar collapse ทำงาน (ถ้ามี)
- 👤 Navigate ได้ทุกเมนู (ยังไม่มี content ก็ได้ ขอแค่ไม่ 404)
- Commit: `feat: app layout with sidebar, breadcrumb, project switcher`

---

### 2.2 Projects API
| # | Task | Agent | Files | Test |
|---|---|---|---|---|
| 2.2.1 | [x] GET /api/projects — list all | Backend | `src/app/api/projects/route.ts` | 🤖 curl ได้ JSON array |
| 2.2.2 | [x] POST /api/projects — create | Backend | `src/app/api/projects/route.ts` | 🤖 curl POST → row ใน DB |
| 2.2.3 | [x] GET /api/projects/[id] — detail | Backend | `src/app/api/projects/[id]/route.ts` | 🤖 curl → JSON object |
| 2.2.4 | [x] PATCH /api/projects/[id] — update | Backend | `src/app/api/projects/[id]/route.ts` | 🤖 curl PATCH → updated |
| 2.2.5 | [x] DELETE /api/projects/[id] — archive | Backend | `src/app/api/projects/[id]/route.ts` | 🤖 status → archived |
| 2.2.6 | [x] POST /api/projects/[id]/test-connection | Backend | `src/app/api/projects/[id]/test-connection/route.ts` | 🤖 ทดสอบ Supabase connection |

**✅ Checkpoint 2.2:**
- 🤖 ทุก route return JSON ถูกต้อง
- 🤖 Error cases: missing fields, invalid id, duplicate slug
- Commit: `feat: projects CRUD API routes`

---

## Phase 3: Core Pages (Day 2-3)

### 3.1 Project List Page
| # | Task | Agent | Files | Test |
|---|---|---|---|---|
| 3.1.1 | [x] Project List page (server component, fetch projects) | Frontend | `src/app/projects/page.tsx` | 👤 เห็น cards |
| 3.1.2 | [x] ProjectCard component (inline ใน page.tsx) | Frontend | `src/app/projects/page.tsx` | 👤 แสดง name, domain, stats |
| 3.1.3 | [x] Empty state (ยังไม่มีโปรเจค) | Frontend | (ใน page.tsx) | 👤 ลบ project ทั้งหมด → เห็น empty state |
| 3.1.4 | [x] New project card (dashed border, คลิกไป /projects/new) | Frontend | (ใน page.tsx) | 👤 คลิก → ไป /projects/new |

**✅ Checkpoint 3.1:**
- 👤 เห็น project cards ตามใน Paper design
- 👤 คลิก card → ไป /projects/[id]/dashboard
- 👤 Responsive: จอเล็ก cards stack เป็น 1 column
- Commit: `feat: project list page with cards`

---

### 3.2 New Project Page
| # | Task | Agent | Files | Test |
|---|---|---|---|---|
| 3.2.1 | [x] New Project page (3-step wizard container) | Frontend | `src/app/projects/new/page.tsx` | 👤 เห็น step indicator |
| 3.2.2 | [x] Step 1: ข้อมูลทั่วไป (name, domain, slug auto-gen) | Frontend | `src/components/projects/NewProjectForm.tsx` | 👤 slug auto-generate จากชื่อ |
| 3.2.3 | [x] Step 2: การเชื่อมต่อ (toggle Supabase/REST API + fields) | Frontend | (ใน NewProjectForm.tsx) | 👤 toggle → fields เปลี่ยน |
| 3.2.4 | [x] Step 2: ปุ่มทดสอบการเชื่อมต่อ | Frontend | (ใน NewProjectForm.tsx) | 👤 กด → แสดง success/fail |
| 3.2.5 | [x] Step 3: ตั้งค่าเนื้อหา (brand voice, rules, inventory, cover style) | Frontend | (ใน NewProjectForm.tsx) | 👤 กรอกได้ |
| 3.2.6 | [x] Submit → POST /api/projects → redirect ไป dashboard | Frontend | (ใน NewProjectForm.tsx) | 👤 สร้าง → เห็นใน list |

**✅ Checkpoint 3.2:**
- 👤 สร้างโปรเจคใหม่ได้ครบ 3 steps
- 👤 ทดสอบ Supabase connection ได้
- 👤 สร้างเสร็จ → redirect ไป dashboard ของ project ใหม่
- 🤖 Validation: ชื่อว่าง → error, slug ซ้ำ → error
- Commit: `feat: new project wizard (3-step)`

---

### 3.3 Project Dashboard
| # | Task | Agent | Files | Test |
|---|---|---|---|---|
| 3.3.1 | [x] Dashboard page (server component, fetch stats) | Frontend | `src/app/projects/[id]/dashboard/page.tsx` | 👤 เห็น stats cards |
| 3.3.2 | [x] Stats cards (4 cards: ทั้งหมด, เผยแพร่, ร่าง, รอ) | Frontend | `src/components/dashboard/StatsCards.tsx` | 👤 ตัวเลขถูกต้อง |
| 3.3.3 | [x] หมวดหมู่ progress section | Frontend | `src/components/dashboard/CategoryProgress.tsx` | 👤 progress bars แสดงถูก |
| 3.3.4 | [x] กิจกรรมล่าสุด section | Frontend | `src/components/dashboard/RecentActivity.tsx` | 👤 แสดง 5 items ล่าสุด |
| 3.3.5 | [x] Token usage card | Frontend | `src/components/dashboard/TokenUsage.tsx` | 👤 แสดง total + avg cost |

**✅ Checkpoint 3.3:**
- 👤 Dashboard แสดงข้อมูลถูกต้องตาม DB
- 👤 เปรียบเทียบกับ Paper design → ใกล้เคียง
- Commit: `feat: project dashboard with stats and activity`

---

### 3.4 Keyword List Page
| # | Task | Agent | Files | Test |
|---|---|---|---|---|
| 3.4.1 | [x] Keywords API — เพิ่ม project_id filter | Backend | `src/app/api/keywords/route.ts` | 🤖 curl ?project_id=xxx → filtered |
| 3.4.2 | [x] Keyword List page (client component) | Frontend | `src/app/projects/[id]/keywords/page.tsx` | 👤 เห็น table |
| 3.4.3 | [x] KeywordTable component (flat data table) | Frontend | `src/components/keywords/KeywordTable.tsx` | 👤 columns ครบ |
| 3.4.4 | [x] Filter bar (หมวดหมู่, สถานะ, priority, ประเภท dropdowns) | Frontend | `src/components/keywords/FilterBar.tsx` | 👤 filter → table update |
| 3.4.5 | [x] Sort columns (คลิก header → sort asc/desc) | Frontend | (ใน KeywordTable) | 👤 คลิก "ปริมาณ" → sort ถูก |
| 3.4.6 | [x] KD bar component (inline ใน KeywordTable) | Frontend | `src/components/keywords/KeywordTable.tsx` | 👤 สีถูก (เขียว/ส้ม/แดง) |
| 3.4.7 | [x] Status badge component (inline ใน KeywordTable) | Frontend | `src/components/keywords/KeywordTable.tsx` | 👤 สีถูกตาม status |
| 3.4.8 | [x] Pagination (20 rows/page) | Frontend | `src/components/keywords/Pagination.tsx` | 👤 เปลี่ยนหน้าได้ |
| 3.4.9 | [x] Checkbox column + bulk actions bar | Frontend | (ใน KeywordTable) | 👤 เลือก 3 rows → แสดง action bar |
| 3.4.10 | [x] Search input (ค้นหาจาก title/keyword) | Frontend | (ใน keywords page) | 👤 พิมพ์ "ai" → filter ถูก |

**✅ Checkpoint 3.4:**
- 👤 เห็น keyword table ตาม Paper design
- 👤 Filter ทุกตัวทำงาน
- 👤 Sort ทุก column ทำงาน
- 👤 Pagination ทำงาน (เปลี่ยนหน้า + แสดงจำนวนถูก)
- 👤 Search ทำงาน
- 🤖 `tsc --noEmit` ผ่าน
- Commit: `feat: keyword list with flat table, filters, sort, pagination`

---

### 3.5 Keyword Modals
| # | Task | Agent | Files | Test |
|---|---|---|---|---|
| 3.5.1 | [x] Add Keyword Modal (single keyword form) | Frontend | `src/components/keywords/AddKeywordModal.tsx` | 👤 กรอก → บันทึก → เห็นในตาราง |
| 3.5.2 | [x] Slug auto-generate จาก keyword | Frontend | `src/lib/slug.ts` | 🤖 "ai automation คืออะไร" → "ai-automation-คืออะไร" |
| 3.5.3 | [x] Import CSV Modal — Step 1 (upload + template download) | Frontend | `src/components/keywords/ImportCsvModal.tsx` | 👤 upload .csv ได้, download template ได้ |
| 3.5.4 | [x] Import CSV Modal — Step 2 (preview + duplicate highlight) | Frontend | (ใน ImportCsvModal) | 👤 เห็น preview table, slug ซ้ำ highlight amber |
| 3.5.5 | [x] Import CSV Modal — Step 3 (confirm + import) | Frontend | (ใน ImportCsvModal) | 👤 กด import → เพิ่มใน DB → refresh table |
| 3.5.6 | [x] CSV template download route | Backend | `src/app/api/keywords/template/route.ts` | 🤖 GET → download .csv |
| 3.5.7 | [x] CSV bulk import route | Backend | `src/app/api/keywords/import/route.ts` | 🤖 POST file → rows ใน DB |
| 3.5.8 | [x] Dropdown button "+ เพิ่มคำหลัก" (integrated ใน keywords page) | Frontend | (ใน keywords page) | 👤 กด → เห็น modal |

**✅ Checkpoint 3.5:**
- 👤 เพิ่มคำหลักทีละตัวได้
- 👤 Upload CSV (ใช้ best_solutions_content_calendar.csv) → preview → import 72 rows
- 👤 Download template CSV → เปิดใน Excel/Numbers ได้
- 👤 Slug ซ้ำถูก highlight + ข้ามอัตโนมัติ
- Commit: `feat: add keyword modal + CSV import wizard`

---

## Phase 4: AI Pipeline (Day 3-4)

### 4.1 Brief Generation
| # | Task | Agent | Files | Test |
|---|---|---|---|---|
| 4.1.1 | [x] Refactor brief route — ดึง brand_voice + writing_rules จาก project | AI Pipeline | `src/app/api/ai/brief/route.ts` | 🤖 ส่ง project_id → ใช้ config ของ project |
| 4.1.2 | [x] Brief Review page (2-panel) | Frontend | `src/app/projects/[id]/articles/[slug]/brief/page.tsx` | 👤 เห็น keyword info + brief |
| 4.1.3 | [x] BriefClient component (streaming + approve/regenerate) | Frontend | `src/app/projects/[id]/articles/[slug]/brief/BriefClient.tsx` | 👤 streaming ทำงาน |
| 4.1.4 | [x] Approve → สร้าง article record + redirect to writing | Frontend | (ใน BriefClient) | 👤 กด approve → ไป writing page |

**✅ Checkpoint 4.1:**
- 👤 เลือก keyword → กดเริ่มเขียน → เห็น brief streaming
- 👤 Brief ใช้ brand_voice ของ project (ไม่ใช่ hardcoded)
- 👤 กด regenerate → brief ใหม่
- 👤 กด approve → redirect ไป AI Writing
- Commit: `feat: brief generation with project config`

---

### 4.2 Article Generation
| # | Task | Agent | Files | Test |
|---|---|---|---|---|
| 4.2.1 | [x] Refactor article route — ดึง site_inventory + rules จาก project + **max_tokens = 8192** | AI Pipeline | `src/app/api/ai/article/route.ts` | 🤖 max_tokens ถูก |
| 4.2.2 | [x] AI Writing page (full-page streaming terminal) | Frontend | `src/app/projects/[id]/articles/[slug]/writing/page.tsx` | 👤 เห็น terminal + streaming |
| 4.2.3 | [x] Stats chips (word count, tokens, cost) — live update | Frontend | (ใน writing page) | 👤 ตัวเลขเพิ่มขึ้นตาม streaming |
| 4.2.4 | [x] Progress bar + หยุดสร้าง button | Frontend | (ใน writing page) | 👤 กดหยุด → streaming หยุด |
| 4.2.5 | [x] เสร็จแล้ว → redirect ไป editor | Frontend | (ใน writing page) | 👤 เขียนเสร็จ → ไป editor auto |

**✅ Checkpoint 4.2:**
- 👤 ดู streaming ใน terminal — text ไหลมาเรื่อยๆ
- 👤 Word count / token count update live
- 👤 กดหยุด → หยุดจริง + บันทึก draft
- 👤 บทความไม่ถูกตัดกลางคัน (max_tokens = 8192)
- Commit: `feat: AI article generation with streaming terminal`

---

### 4.3 AI Meta Assist
| # | Task | Agent | Files | Test |
|---|---|---|---|---|
| 4.3.1 | [x] POST /api/ai/meta — generate meta_title, meta_description, excerpt | AI Pipeline | `src/app/api/ai/meta/route.ts` | 🤖 ส่ง content → ได้ meta fields |
| 4.3.2 | [x] Sparkle button component (ปุ่ม AI ข้าง label) | Frontend | `src/components/ui/AiAssistButton.tsx` | 👤 กด → loading → fill field |
| 4.3.3 | [x] "สร้างทั้งหมดด้วย AI" button | Frontend | (ใน Editor sidebar) | 👤 กด → fill 3 fields พร้อมกัน |

**✅ Checkpoint 4.3:**
- 👤 กด sparkle ข้าง Meta Title → AI generate → แสดงใน input
- 👤 กด "สร้างทั้งหมดด้วย AI" → 3 fields fill พร้อมกัน
- 👤 แก้ไขได้หลัง AI generate
- 🤖 meta_title <= 60 chars, meta_description <= 155 chars
- Commit: `feat: AI assist for meta fields`

---

## Phase 5: Editor + Cover Image (Day 4-5)

### 5.1 Article Editor
| # | Task | Agent | Files | Test |
|---|---|---|---|---|
| 5.1.1 | [x] Editor page (3-column layout) | Frontend | `src/app/projects/[id]/articles/[slug]/edit/page.tsx` | 👤 เห็น 3 columns |
| 5.1.2 | [x] EditorClient component (markdown textarea + toolbar) | Frontend | `src/app/projects/[id]/articles/[slug]/edit/EditorClient.tsx` | 👤 พิมพ์ markdown ได้ |
| 5.1.3 | [x] Left sidebar — Frontmatter tab (title, meta, excerpt, tags) | Frontend | (ใน EditorClient) | 👤 กรอก fields ได้ |
| 5.1.4 | [x] Left sidebar — SEO Checklist (7 items, real-time check) | Frontend | `src/components/editor/SeoChecklist.tsx` | 👤 แก้ content → checklist update |
| 5.1.5 | [x] Left sidebar — Cover Image tab | Frontend | `src/components/editor/CoverImageTab.tsx` | 👤 เห็น preview / generate / upload |
| 5.1.6 | [x] Toolbar (bold, italic, link, list, image, code) | Frontend | `src/components/editor/Toolbar.tsx` | 👤 กด bold → insert ** |
| 5.1.7 | [x] Word count + auto-save indicator | Frontend | (ใน EditorClient) | 👤 word count ถูก, "บันทึกแล้ว" แสดง |
| 5.1.8 | [x] Auto-save draft ทุก 30 วินาที | Frontend | (ใน EditorClient) | 👤 แก้ → รอ 30s → "บันทึกแล้ว" |
| 5.1.9 | [x] Save draft button (manual) | Frontend | (ใน EditorClient) | 👤 กด → PATCH /api/articles/[slug] |
| 5.1.10 | [x] Publish button → redirect ไป publish page | Frontend | (ใน EditorClient) | 👤 กด → ไป publish confirm |

**✅ Checkpoint 5.1:**
- 👤 Editor ตรงกับ Paper design (3-column)
- 👤 พิมพ์ markdown → word count update
- 👤 SEO checklist update real-time
- 👤 Auto-save ทำงาน
- 👤 Tags เพิ่ม/ลบได้
- 👤 Meta char count แสดงถูก (48/60, 142/155)
- Commit: `feat: article editor with SEO checklist and auto-save`

---

### 5.2 Cover Image (fal.ai)
| # | Task | Agent | Files | Test |
|---|---|---|---|---|
| 5.2.1 | [x] Install `@fal-ai/client` | Image | `package.json` | 🤖 already installed |
| 5.2.2 | [x] Image util (download + resize + upload) | Image | `src/lib/image.ts` | 🤖 function ready |
| 5.2.3 | [x] POST /api/images/generate — fal.ai nano-banana-2 | Image | `src/app/api/images/generate/route.ts` | 🤖 API ready |
| 5.2.4 | [x] GET /api/images?project_id=xxx | Image | `src/app/api/images/route.ts` | 🤖 API ready |
| 5.2.5 | [x] POST /api/images/[id]/use — assign to article | Image | `src/app/api/images/[id]/use/route.ts` | 🤖 API ready |
| 5.2.6 | [x] Cover Image Gallery page | Frontend | `src/app/projects/[id]/images/page.tsx` | 👤 เห็น image grid |
| 5.2.7 | [x] Generate Cover Modal (prompt + resolution + preview) | Frontend | `src/components/images/GenerateCoverModal.tsx` | 👤 กด generate → เห็น preview |
| 5.2.8 | [x] Auto-generate prompt จาก title + project style | Frontend | (ใน GenerateCoverModal) | 👤 กด → prompt fill อัตโนมัติ |
| 5.2.9 | [x] "ใช้รูปนี้" → download + resize + upload Supabase Storage | Image | (ใน generate route) | 👤 กด → image ขึ้น Supabase Storage |
| 5.2.10 | [x] Cover Image tab ใน Editor sidebar | Frontend | `src/components/editor/CoverImageTab.tsx` | 👤 เห็น preview + generate button |

**✅ Checkpoint 5.2:**
- 👤 Gallery แสดงรูปทั้งหมดของ project
- 👤 Generate → เห็นรูป preview (~3-5 วินาที)
- 👤 "ใช้รูปนี้" → รูปขึ้น Supabase Storage + update article
- 👤 ใน Editor → Cover tab เห็น preview + generate ได้
- 🤖 รูปเป็น WebP, ขนาด 1200x630
- Commit: `feat: cover image generation with fal.ai nano-banana-2`

---

## Phase 6: Publish + Settings (Day 5-6)

### 6.1 Publish Flow
| # | Task | Agent | Files | Test |
|---|---|---|---|---|
| 6.1.1 | [x] Refactor publish route — ตรวจ connection_type + ใช้ credentials ของ project | Backend | `src/app/api/publish/route.ts` | 🤖 Supabase: POST blog_posts, REST: POST endpoint |
| 6.1.2 | [x] Publish page (checklist + JSON preview + confirm) | Frontend | `src/app/projects/[id]/articles/[slug]/publish/page.tsx` | 👤 เห็น checklist + payload |
| 6.1.3 | [x] แสดง target (project name + connection type) | Frontend | (ใน publish page) | 👤 เห็น "via Supabase" หรือ "via REST API" |
| 6.1.4 | [x] กดเผยแพร่ → POST /api/publish → success toast | Frontend | (ใน publish page) | 👤 กด → toast "เผยแพร่แล้ว" |
| 6.1.5 | [x] Update keyword status → "published" | Backend | (ใน publish route) | 🤖 keyword.status = "published" |

**✅ Checkpoint 6.1:**
- 👤 เห็น publish preview ตรงกับ Paper design
- 👤 Checklist items ถูกต้อง (green checks)
- 👤 JSON payload preview แสดงถูก
- 👤 กดเผยแพร่ → ข้อมูลขึ้นใน Supabase blog_posts
- 👤 ทดสอบ REST API mode (ถ้ามี test endpoint)
- 🤖 ห้ามส่ง field `status` ไป blog_posts
- Commit: `feat: publish flow with dual connection support`

---

### 6.2 Project Settings
| # | Task | Agent | Files | Test |
|---|---|---|---|---|
| 6.2.1 | [x] Settings page (4 tabs layout) | Frontend | `src/app/projects/[id]/settings/page.tsx` | 👤 เห็น 4 tabs |
| 6.2.2 | [x] Tab: การเชื่อมต่อ (Supabase/REST API toggle + fields + test) | Frontend | `src/components/settings/ConnectionTab.tsx` | 👤 toggle → fields เปลี่ยน |
| 6.2.3 | [x] Tab: เนื้อหา (brand voice, writing rules, site inventory textareas) | Frontend | `src/components/settings/ContentTab.tsx` | 👤 แก้ → save → reload ยังอยู่ |
| 6.2.4 | [x] Tab: รูปปก (default style, fal.ai model) | Frontend | `src/components/settings/CoverTab.tsx` | 👤 ตั้งค่า → ใช้ใน generate |
| 6.2.5 | [x] Tab: ทั่วไป (ชื่อ, domain, archive/delete) | Frontend | `src/components/settings/GeneralTab.tsx` | 👤 แก้ชื่อ → save → sidebar update |
| 6.2.6 | [x] Test connection button ทำงานจริง | Frontend + Backend | (ใน ConnectionTab) | 👤 กด → success/fail ถูกต้อง |

**✅ Checkpoint 6.2:**
- 👤 ทุก tab save + reload ข้อมูลถูก
- 👤 เปลี่ยน connection type → fields เปลี่ยน + save ได้
- 👤 ทดสอบ connection → success/fail แสดงถูก
- 👤 Archive project → ไม่แสดงใน list
- Commit: `feat: project settings with 4 tabs`

---

## Phase 7: Polish + Build (Day 6-7)

### 7.1 Polish
| # | Task | Agent | Test |
|---|---|---|---|
| 7.1.1 | [x] Empty states ทุกหน้า (keyword list ว่าง, dashboard ว่าง) | Frontend | 👤 เห็น empty state + CTA |
| 7.1.2 | [x] Loading states (spinner ทุกหน้า) | Frontend | 👤 refresh → เห็น spinner |
| 7.1.3 | [x] Error toasts (API errors แสดง toast message) | Frontend | 👤 ปิด Supabase → เห็น error toast |
| 7.1.4 | [x] Responsive: sidebar collapse บน tablet | Frontend | 👤 ย่อจอ → sidebar collapse |
| 7.1.5 | [x] Cover image prompt — ใช้ project `cover_image_style` | AI Pipeline | 🤖 prompt รวม style ของ project |
| 7.1.6 | [x] ลบ console.log / debug code ทั้งหมด | 🤖 Orchestrator | 🤖 grep console.log → 0 results |

### 7.2 Final Test
| # | Task | Test |
|---|---|---|
| 7.2.1 | [x] `npx tsc --noEmit` | 🤖 0 errors ✅ |
| 7.2.2 | [x] `npm run build` | 🤖 build สำเร็จ ✅ |
| 7.2.3 | [x] Full E2E flow | 👤 ทำได้ครบ |
| 7.2.4 | [x] Import CSV flow | 👤 import สำเร็จ |
| 7.2.5 | [x] AI meta assist | 👤 ทำงานทุก field |
| 7.2.6 | [x] Multi-project | 👤 ไม่มี data leak ข้าม project |

**✅ Final Checkpoint:**
- 🤖 Build ผ่าน 0 errors
- 👤 E2E flow ครบทุก step
- 👤 ทุกหน้าตรงกับ Paper design
- Commit: `feat: SEO Studio v2.0 complete`

---

## Summary

| Phase | Tasks | วัน |
|---|---|---|
| 1. Setup + DB | 12 tasks | Day 1 |
| 2. Layout + API | 13 tasks | Day 1-2 |
| 3. Core Pages | 28 tasks | Day 2-3 |
| 4. AI Pipeline | 10 tasks | Day 3-4 |
| 5. Editor + Cover | 20 tasks | Day 4-5 |
| 6. Publish + Settings | 11 tasks | Day 5-6 |
| 7. Polish + Build | 12 tasks | Day 6-7 |
| **Total** | **106 tasks** | **~7 วัน** |
