# SEO Studio v2.0 — Redesign Analysis

**วันที่:** 2026-03-15
**สถานะ:** Draft — รอ confirm ก่อน implement
**เปลี่ยนแปลงหลัก:** Single-project → Multi-project, เพิ่ม fal.ai image generation

---

## 1. ปัญหาของ v1.0 (UX/UI Analysis)

### 1.1 Information Architecture Issues

| ปัญหา | ผลกระทบ | ระดับ |
|---|---|---|
| **ไม่มี concept "Project"** — ทุกอย่างอยู่ใน context เดียว | ใช้กับหลายเว็บไม่ได้ | Critical |
| **Sidebar nav ตายตัว** — Dashboard, Clusters, Articles, Analytics | ไม่มีที่สลับระหว่างโปรเจค | Critical |
| **Config hardcoded** — Supabase credentials, site inventory, writing rules อยู่ใน env/code | เปลี่ยนต่อโปรเจคไม่ได้ | Critical |
| **Cover image เป็นแค่ prompt** — ต้อง copy ไปใช้ Gemini/Midjourney ข้างนอก | ตัด workflow ขาด ต้องออกจากระบบ | High |

### 1.2 Workflow Issues

| ปัญหา | ผลกระทบ |
|---|---|
| **Linear workflow บังคับ** — ต้องทำ Brief → Article → Edit → Publish ตามลำดับเสมอ | ไม่ยืดหยุ่น เช่น อยาก import บทความที่เขียนเองแล้ว publish เลย |
| **ไม่มี batch operations** — ต้อง generate ทีละบทความ | เสียเวลาเมื่อมี keyword เยอะ |
| **สลับ context ยาก** — ไม่มี breadcrumb ชัดเจนว่าอยู่ keyword ไหน/โปรเจคไหน | หลงทางในระบบ |
| **Cover image workflow แยก** — ต้องออกไปใช้ tool ข้างนอกแล้วกลับมา upload | เสีย flow |

### 1.3 UI Issues

| ปัญหา | ผลกระทบ |
|---|---|
| **Sidebar กิน space 256px ตลอด** — ไม่ collapse ได้ | จอเล็กใช้ยาก |
| **Status badge ไม่ interactive** — แค่แสดง ไม่มี quick action | ต้องคลิกเข้าไปหลายชั้นถึงจะทำอะไรได้ |
| **ไม่มี empty state ที่ดี** — เวลาโปรเจคว่าง ไม่มี guide ว่าต้องทำอะไร | User ใหม่งง |
| **Filter bar กว้างเกินไป** — ตัวเลือกเยอะแต่ใช้ไม่บ่อย | รกหน้าจอ |

---

## 2. Redesign: Information Architecture

### 2.1 Hierarchy ใหม่

```
SEO Studio (App)
└── Projects (หลายโปรเจค)
    └── Project "Best Solutions"
        ├── Dashboard (overview + stats)
        ├── Keywords (list + import + add)
        ├── Articles (all articles ของโปรเจคนี้)
        ├── Cover Images (gallery + generate)
        └── Settings
            ├── Connection (Supabase URL + Key)
            ├── Site Inventory (internal links)
            ├── Brand Voice (tone, rules, guidelines)
            └── Writing Rules (ข้อห้าม, format)
    └── Project "Client A"
        ├── Dashboard
        ├── Keywords
        ├── ...
```

### 2.2 URL Structure

```
/projects                           → Project list (home)
/projects/new                       → สร้างโปรเจคใหม่
/projects/[projectId]/dashboard     → Dashboard ของโปรเจค
/projects/[projectId]/keywords      → Keyword list
/projects/[projectId]/articles      → Article list
/projects/[projectId]/articles/new  → เริ่ม workflow ใหม่
/projects/[projectId]/articles/[slug]/brief    → Brief review
/projects/[projectId]/articles/[slug]/writing  → AI writing
/projects/[projectId]/articles/[slug]/edit     → Editor
/projects/[projectId]/articles/[slug]/publish  → Publish confirm
/projects/[projectId]/images        → Cover image gallery + generate
/projects/[projectId]/settings      → Project settings
/settings                           → Global settings (API keys, account)
```

---

## 3. Database Schema Changes

### 3.1 Table ใหม่: `projects`

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- ชื่อโปรเจค เช่น "Best Solutions"
  slug text unique not null,             -- URL slug
  domain text,                           -- domain ลูกค้า เช่น "bestsolutions.co.th"

  -- Connection Config
  connection_type text not null default 'supabase',  -- 'supabase' | 'rest_api'

  -- Supabase Connection (ใช้เมื่อ connection_type = 'supabase')
  supabase_url text,
  supabase_anon_key text,
  supabase_service_role_key text,        -- encrypted
  storage_bucket text default 'images',

  -- REST API Connection (ใช้เมื่อ connection_type = 'rest_api')
  api_endpoint text,                     -- e.g. https://clienta.com/api/content
  api_key text,                          -- Bearer token, encrypted
  api_method text default 'POST',        -- POST | PUT

  -- Brand & Content Config
  brand_voice text,                      -- free text อธิบาย tone เช่น "สบายๆ เข้าใจง่าย เหมาะ SME"
  writing_rules text,                    -- markdown rules เช่น "ห้ามใช้ : ในเนื้อหา"
  site_inventory text,                   -- markdown internal links inventory
  cover_image_style text,                -- style สำหรับ fal.ai เช่น "deep navy + neon cyan, corporate"

  -- Meta
  status text default 'active',          -- active | archived
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**Connection Types:**
| Type | ใช้เมื่อ | Fields ที่ต้องกรอก |
|---|---|---|
| `supabase` | เว็บที่ dev เอง (Next.js + Supabase) | supabase_url, supabase_anon_key, supabase_service_role_key |
| `rest_api` | เว็บลูกค้าที่มี API endpoint รับ content | api_endpoint, api_key |

**Publish Flow:**
```
กด Publish → ตรวจ connection_type
├── supabase → POST/PATCH ไป Supabase blog_posts (เหมือน v1.0)
└── rest_api → POST/PUT ไป api_endpoint
               Headers: { Authorization: "Bearer {api_key}" }
               Body: { slug, title, content_html, excerpt, meta_title, meta_description, tags, cover_image, ... }
               Response: { success: true, id: "xxx", url: "https://..." }
```

### 3.2 Table ใหม่: `cover_images`

```sql
create table cover_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  article_id uuid references articles(id),  -- nullable, อาจ generate ไว้ก่อนยังไม่ผูกบทความ

  prompt text not null,                  -- prompt ที่ใช้ generate
  image_url text,                        -- URL หลัง upload ขึ้น Supabase Storage
  fal_request_id text,                   -- fal.ai request ID
  status text default 'pending',         -- pending | generating | completed | failed

  width int default 1200,
  height int default 630,

  created_at timestamptz default now()
);
```

### 3.3 แก้ Table เดิม: เพิ่ม `project_id`

```sql
-- เพิ่ม project_id ใน keywords
alter table keywords add column project_id uuid references projects(id) on delete cascade;

-- เพิ่ม project_id ใน articles
alter table articles add column project_id uuid references projects(id) on delete cascade;
```

---

## 4. Redesign: Navigation & Layout

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header (h-14)                                               │
│ [☰] SEO Studio    [Project: Best Solutions ▾]    [⚙] [👤]  │
├──────────┬──────────────────────────────────────────────────┤
│ Sidebar  │ Content Area                                     │
│ (w-60)   │                                                  │
│          │ Breadcrumb: Projects > Best Solutions > Keywords  │
│ 📊 ภาพรวม│                                                  │
│ 🔑 คำหลัก│ [Page Content Here]                              │
│ 📝 บทความ│                                                  │
│ 🖼 รูปปก │                                                  │
│ ⚙ ตั้งค่า│                                                  │
│          │                                                  │
│ ─────── │                                                  │
│ Projects │                                                  │
│ • Best.. │                                                  │
│ • Client │                                                  │
│ + สร้างใหม่│                                                │
└──────────┴──────────────────────────────────────────────────┘
```

### 4.2 Navigation Design

**Header (Fixed, h-14)**
- ซ้าย: Hamburger menu (collapse sidebar) + Logo "SEO Studio"
- กลาง: Project Switcher dropdown — แสดงชื่อโปรเจคปัจจุบัน กดเปลี่ยนได้เลย
- ขวา: Global settings gear + User avatar + Sign out

**Sidebar (w-60, collapsible)**
- **Section 1 — Project Navigation** (เมนูของโปรเจคที่เลือกอยู่)
  - ภาพรวม (Dashboard)
  - คำหลัก (Keywords)
  - บทความ (Articles)
  - รูปปก (Cover Images) ← ใหม่
  - ตั้งค่าโปรเจค (Project Settings)
- **Section 2 — Project List** (สลับโปรเจค)
  - รายชื่อโปรเจคทั้งหมด (แสดง 5 ล่าสุด)
  - ปุ่ม "+ สร้างโปรเจคใหม่"
- **Sidebar collapse**: กด hamburger → เหลือแค่ icon (w-16)

**Breadcrumb (ทุกหน้า)**
- ตัวอย่าง: `Projects > Best Solutions > Keywords > AI Automation คืออะไร`
- คลิกกลับได้ทุกระดับ

### 4.3 Project Switcher (Header Dropdown)

```
┌─────────────────────────────────┐
│ 🔍 ค้นหาโปรเจค...              │
├─────────────────────────────────┤
│ ● Best Solutions    bestsol..   │
│   Client A          clienta..   │
│   Client B          clientb..   │
├─────────────────────────────────┤
│ + สร้างโปรเจคใหม่               │
└─────────────────────────────────┘
```

- แสดง dot สีเขียวสำหรับโปรเจค active
- แสดง domain ย่อข้างหลัง
- มี search สำหรับเมื่อมีเยอะ

---

## 5. Redesign: Screens ทั้งหมด (12 screens)

### 5.1 Project List (`/projects`)

**หน้าแรกเมื่อ login** — แสดงโปรเจคทั้งหมด

```
┌─────────────────────────────────────────────────────────┐
│ โปรเจคของฉัน                          [+ สร้างโปรเจค]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Best Solutions   │  │ Client A        │              │
│  │ bestsolutions.co │  │ clienta.com     │              │
│  │                  │  │                  │              │
│  │ 📝 45 keywords   │  │ 📝 20 keywords   │              │
│  │ ✅ 12 published  │  │ ✅ 3 published   │              │
│  │ 📊 Last: 2d ago  │  │ 📊 Last: 1w ago  │              │
│  │                  │  │                  │              │
│  │ [เปิดโปรเจค →]   │  │ [เปิดโปรเจค →]   │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─┐                                   │
│  │  + สร้างโปรเจค   │                                   │
│  │    ใหม่           │                                   │
│  └ ─ ─ ─ ─ ─ ─ ─ ─┘                                   │
└─────────────────────────────────────────────────────────┘
```

**Components:**
- Project Card: แสดง name, domain, keyword count, published count, last activity
- Empty state: guide ให้สร้างโปรเจคแรก
- Card layout: grid 3 columns (responsive → 2 → 1)

---

### 5.2 New Project (`/projects/new`)

**สร้างโปรเจคใหม่ — multi-step form (3 steps)**

**Step 1: ข้อมูลทั่วไป**
- ชื่อโปรเจค (required)
- Domain เว็บ (optional, เช่น `bestsolutions.co.th`)
- Slug (auto-generate จากชื่อ)

**Step 2: เชื่อมต่อ**
- เลือกประเภท: (●) Supabase Direct ( ) REST API
- **ถ้า Supabase:**
  - Supabase URL (required)
  - Supabase Anon Key (required)
  - Supabase Service Role Key (required)
  - Storage Bucket Name (default: `images`)
- **ถ้า REST API:**
  - API Endpoint URL (required, เช่น `https://clienta.com/api/content`)
  - API Key (required)
  - Method: POST / PUT
- ปุ่ม "ทดสอบการเชื่อมต่อ" → Supabase: query `blog_posts`, REST API: GET endpoint
- แสดง ✅ เชื่อมต่อสำเร็จ / ❌ ล้มเหลว + error message

**Step 3: ตั้งค่า Content**
- Brand Voice (textarea) — อธิบาย tone เช่น "สบายๆ เข้าใจง่าย เหมาะ SME ไทย"
- Writing Rules (textarea) — ข้อห้าม เช่น "ห้ามใช้ : ในเนื้อหา"
- Site Inventory (textarea / markdown) — internal links
- Cover Image Style (textarea) — สไตล์รูปปก เช่น "deep navy + neon cyan, corporate minimal"

**Footer:** ย้อนกลับ | ถัดไป / สร้างโปรเจค

---

### 5.3 Project Dashboard (`/projects/[id]/dashboard`)

**Overview ของโปรเจคเดียว**

```
┌─────────────────────────────────────────────────────────┐
│ Breadcrumb: Projects > Best Solutions                   │
│                                                         │
│ Best Solutions                         [⚙ ตั้งค่า]     │
│ bestsolutions.co.th                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ ทั้งหมด   │ │ เผยแพร่   │ │ ร่างอยู่   │ │ รอดำเนินการ│   │
│ │    75     │ │    12    │ │     8    │ │    55    │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│ ┌──────────────────┐  ┌──────────────────────────────┐ │
│ │ หมวดหมู่          │  │ Recent Activity              │ │
│ │                  │  │                              │ │
│ │ AI & Automation  │  │ • AI Automation คืออะไร      │ │
│ │ ████░░░░ 4/12    │  │   published — 2 ชม. ก่อน     │ │
│ │                  │  │ • n8n คืออะไร                │ │
│ │ Digital Market.. │  │   draft — 5 ชม. ก่อน         │ │
│ │ ██░░░░░░ 2/10    │  │                              │ │
│ └──────────────────┘  └──────────────────────────────┘ │
│                                                         │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Token Usage & Cost                                   ││
│ │ Total tokens: 1.2M   Estimated cost: ฿420           ││
│ │ Avg per article: 60K tokens (≈ ฿21)                  ││
│ └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**Components:**
- Stats cards (4 cards) — ทั้งหมด, เผยแพร่, ร่าง, รอดำเนินการ
- หมวดหมู่ progress — mini bar chart แยกตามหมวดหมู่
- Recent activity — timeline ของ 5 actions ล่าสุด
- Token usage card — total tokens, cost, avg per article

---

### 5.4 Keyword List (`/projects/[id]/keywords`)

**เปลี่ยนจาก Cluster Accordion → Flat Data Table** (อ้างอิง UI pattern จาก Clearscope, NeuronWriter, MarketMuse)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ คำหลัก (75)                                   [+ เพิ่มคำหลัก] [↑ Import]│
├──────────────────────────────────────────────────────────────────────────┤
│ [🔍 ค้นหา...]  [หมวดหมู่ ▾]  [สถานะ ▾]  [Priority ▾]  [ประเภท ▾]     │
├──────────────────────────────────────────────────────────────────────────┤
│ ☐ │ ชื่อบทความ          │ คำหลัก      │ หมวดหมู่          │ KD │ Vol.  │
│   │                     │             │                  │    │       │
│───│─────────────────────│─────────────│──────────────────│────│───────│
│ ☐ │ AI Automation คือ.. │ ai automa.. │ AI & Automation  │ ██ │ 1,200 │
│ ☐ │ n8n คืออะไร         │ n8n         │ AI & Automation  │ █░ │   800 │
│ ☐ │ Claude AI คืออะไร   │ claude ai   │ AI & Automation  │ ███│ 2,400 │
│ ☐ │ Digital Marketing.. │ digital m.. │ Digital Marketing│ ██ │ 3,100 │
│ ☐ │ SEO คืออะไร         │ seo         │ Digital Marketing│ ███│ 8,200 │
│───│─────────────────────│─────────────│──────────────────│────│───────│
│   │ (ต่อ)                                                              │
├──────────────────────────────────────────────────────────────────────────┤
│ ☐ │ ประเภท     │ Priority │ สถานะ        │ อัพเดทล่าสุด  │ Action      │
│   │            │          │              │              │             │
│───│────────────│──────────│──────────────│──────────────│─────────────│
│   │ Blog       │ ● สูง    │ ✅ เผยแพร่แล้ว│ 2 ชม. ก่อน   │ [ดู ↗]      │
│   │ Blog       │ ● กลาง  │ 📝 ร่าง       │ 5 ชม. ก่อน   │ [แก้ไข]     │
│   │ Pillar     │ ● สูง    │ ⏳ รอดำเนินการ │ —            │ [เริ่มเขียน] │
│   │ Blog       │ ● กลาง  │ ✅ เผยแพร่แล้ว│ 1 วันก่อน    │ [ดู ↗]      │
│   │ Pillar     │ ● สูง    │ ⏳ รอดำเนินการ │ —            │ [เริ่มเขียน] │
└──────────────────────────────────────────────────────────────────────────┘
 แสดง 1-20 จาก 75                                    [← ก่อนหน้า] [ถัดไป →]
```

**Design Decisions (อ้างอิง research):**
- **Flat table** — sort ได้ทุก column (คลิก header) เหมือน Clearscope, NeuronWriter
- **หมวดหมู่เป็น filter + column** — ไม่ใช่ accordion, เลือก filter ด้านบนหรือดูใน column
- **Checkbox column** — สำหรับ bulk actions (เช่น เริ่มเขียนทีเดียว 5 บทความ)
- **Pagination** — 20 rows per page (ไม่ infinite scroll)
- **Configurable columns** — ซ่อน/แสดง column ได้ (อนาคต)
- **Priority badge** — จุดสี (แดง=สูง, เหลือง=กลาง, เทา=ต่ำ)

**Cluster → หมวดหมู่:**
- "Cluster" เปลี่ยนชื่อเป็น "หมวดหมู่" (Category) ใน UI
- ใช้เป็น filter dropdown + แสดงเป็น column ในตาราง
- Dashboard ยังแสดง progress ตามหมวดหมู่ได้ (bar chart)

---

### 5.5 Add Keyword — 3 วิธี

เปลี่ยนจาก modal เดียว → ให้เลือกวิธีเพิ่มได้ 3 แบบ ผ่าน dropdown บนปุ่ม "+ เพิ่มคำหลัก"

```
[+ เพิ่มคำหลัก ▾]
├── เพิ่มทีละตัว        → Add Keyword Modal
├── อัปโหลด CSV       → Import CSV Modal (3-step)
└── ดาวน์โหลด Template → download template.csv
```

#### 5.5a Add Keyword Modal (เพิ่มทีละตัว)

Modal 560x620 — fields: ชื่อบทความ, คำหลัก, slug (auto), หมวดหมู่, ประเภท, priority

#### 5.5b Import CSV Modal (3-step wizard)

**รองรับ format ของ `best_solutions_content_calendar.csv`**

CSV columns ที่รับ:
```
Title, Primary Keyword, Cluster, Content Type, Priority
```

Optional columns (ถ้ามีจะ import ด้วย):
```
Search Intent, Publish Date, บริการที่เกี่ยวข้อง
```

**Step 1: Upload**
```
┌─────────────────────────────────────────────────────────┐
│ อัปโหลดไฟล์ CSV                                    [✕] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐     │
│  │                                               │     │
│  │    ↑ ลากไฟล์มาวางที่นี่ หรือคลิกเลือกไฟล์      │     │
│  │         รองรับ .csv เท่านั้น                    │     │
│  │                                               │     │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘     │
│                                                         │
│  ℹ️ ยังไม่มีไฟล์?                                       │
│  [📥 ดาวน์โหลด Template CSV]                            │
│                                                         │
│                              [ยกเลิก]    [ถัดไป →]      │
└─────────────────────────────────────────────────────────┘
```

**Step 2: Preview + Map columns**
```
┌─────────────────────────────────────────────────────────┐
│ ตรวจสอบข้อมูล (75 แถว)                             [✕] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ พบ 75 คำหลัก · ซ้ำ 3 · จะ import 72                    │
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Title              │ Keyword    │ Cluster │ Type  │   │
│ │────────────────────│────────────│─────────│───────│   │
│ │ AI Automation คือ..│ ai autom.. │ AI & Au.│ Pillar│   │
│ │ n8n คืออะไร        │ n8n คือ..  │ AI & Au.│ Blog  │   │
│ │ ⚠ Claude AI คือ.. │ claude ai  │ AI & Au.│ Blog  │   │ ← slug ซ้ำ (amber highlight)
│ │ ...                │            │         │       │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ ⚠ 3 slug ซ้ำจะถูกข้ามอัตโนมัติ                          │
│                                                         │
│                      [← ย้อนกลับ]    [Import 72 →]     │
└─────────────────────────────────────────────────────────┘
```

**Step 3: Success**
- Toast: "เพิ่ม 72 คำหลักแล้ว" (emerald)
- Auto-close modal + refresh keyword list

#### 5.5c Template CSV Download

`GET /api/keywords/template` → ดาวน์โหลด `keyword-template.csv`

```csv
Title,Primary Keyword,Cluster,Content Type,Priority
ตัวอย่างบทความ,ตัวอย่าง keyword,หมวดหมู่,Blog,High
```

---

### 5.7 Article Workflow — Brief (`/projects/[id]/articles/[slug]/brief`)

**เหมือน v1.0** — left panel (keyword info + AI suggestion) + right panel (brief markdown + approve/regenerate)

**เปลี่ยน:** ใช้ brand voice + writing rules จาก project settings แทน hardcoded

---

### 5.8 Article Workflow — AI Writing (`/projects/[id]/articles/[slug]/writing`)

**เหมือน v1.0** — full-page streaming terminal UI

**เปลี่ยน:** ใช้ writing rules + site inventory จาก project settings

---

### 5.9 Article Editor (`/projects/[id]/articles/[slug]/edit`)

**3-column layout เหมือน v1.0** แต่เพิ่ม Cover Image section

```
┌────────────────┬──────────────────────┬─────────────────┐
│ Left Sidebar   │ Markdown Editor      │ Preview (opt.)  │
│ (w-80)         │ (flex-1)             │                 │
│                │                      │                 │
│ [Frontmatter]  │ # H1...             │                 │
│ [Keywords]     │ ## H2...             │                 │
│ [Meta]         │ content...           │                 │
│ [Cover Image]← │                      │                 │ ← NEW TAB
│                │                      │                 │
│ ── Cover ──── │                      │                 │
│ [รูปปัจจุบัน]   │                      │                 │
│ หรือ            │                      │                 │
│ [🎨 สร้างรูปปก] │                      │                 │
│ [📤 อัปโหลด]   │                      │                 │
│                │                      │                 │
│ ── SEO ────── │                      │                 │
│ ✅ Keyword H1  │                      │                 │
│ ✅ Snippet     │                      │                 │
│ ❌ FAQ missing │                      │                 │
└────────────────┴──────────────────────┴─────────────────┘
```

**Left sidebar tabs:**
1. **Frontmatter** — title, meta_title, meta_description, excerpt, tags — แต่ละ field มีปุ่ม AI assist
2. **Keywords** — primary keyword, LSI keywords
3. **Meta** — SEO checklist, character counts
4. **Cover Image** — ใหม่! preview + generate + upload

**AI Assist สำหรับ Meta Fields:**
แต่ละ field (meta_title, meta_description, excerpt) มีปุ่ม sparkle icon ข้างๆ label
กดแล้ว AI จะ generate ให้จากเนื้อหาบทความ + primary keyword

```
┌─────────────────────────────────────┐
│ Meta Title              [✨ AI]     │  ← ปุ่ม sparkle icon
│ [AI Automation คืออะไร | Best.. ]   │
│                           48/60     │
├─────────────────────────────────────┤
│ Meta Description        [✨ AI]     │
│ [เรียนรู้ AI Automation คืออะไร    ]│
│ [ระบบอัตโนมัติ AI ช่วยธุรกิจ...    ]│
│                          142/155    │
├─────────────────────────────────────┤
│ Excerpt                 [✨ AI]     │
│ [AI Automation คือการนำ AI มา...   ]│
│                                     │
├─────────────────────────────────────┤
│     [✨ สร้างทั้งหมดด้วย AI]        │  ← generate ทุก field พร้อมกัน
└─────────────────────────────────────┘
```

- กด icon ข้างๆ field → generate เฉพาะ field นั้น
- กด "สร้างทั้งหมดด้วย AI" → generate meta_title + meta_description + excerpt พร้อมกัน
- AI ใช้เนื้อหาบทความ (content_md) + primary keyword + brand voice ของ project
- User แก้ไขได้หลัง generate

---

### 5.10 Cover Image Page (`/projects/[id]/images`) ← NEW

**Gallery + Generate รูปปกบทความ**

```
┌─────────────────────────────────────────────────────────┐
│ รูปปกบทความ (12)                    [🎨 สร้างรูปใหม่]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│ │ [image] │ │ [image] │ │ [image] │ │ [image] │       │
│ │         │ │         │ │         │ │ 🔄 กำลัง │       │
│ │AI Auto..│ │n8n คือ..│ │Claude.. │ │  สร้าง.. │       │
│ │ ✅ ใช้แล้ว│ │ ✅ ใช้แล้ว│ │ ยังไม่ใช้│ │         │       │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Generate Cover Image Modal:**

```
┌─────────────────────────────────────────────────────────┐
│ 🎨 สร้างรูปปกบทความ                              [✕]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ บทความ                                                  │
│ [Select: เลือกบทความ... ▾]                               │
│                                                         │
│ Prompt                                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Professional blog cover image, deep navy background │ │
│ │ with neon cyan accents, topic: AI Automation...     │ │
│ └─────────────────────────────────────────────────────┘ │
│ [🤖 Auto-generate prompt]   สไตล์โปรเจค: deep navy...  │
│                                                         │
│ Resolution                                              │
│ ( ) 0.5K (~฿2.10)  (●) 1K (~฿2.80)  ( ) 2K (~฿4.20)   │
│                                                         │
│ Aspect Ratio                                            │
│ (●) 16:9 (Blog cover)  ( ) 4:3  ( ) 1:1                │
│                                                         │
│ ┌─ Preview ─────────────────────────────────────────┐   │
│ │                                                   │   │
│ │              [Generated image here]               │   │
│ │              หรือ skeleton loading                  │   │
│ │                                                   │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ [ยกเลิก]          [🔄 สร้างใหม่]    [✅ ใช้รูปนี้]       │
└─────────────────────────────────────────────────────────┘
```

**fal.ai Integration Flow:**
1. User กรอก prompt (หรือกด auto-generate จาก article title + project style)
2. เลือก resolution (default 1K) + aspect ratio (default 16:9)
3. กด "สร้างรูป" → เรียก fal.ai nano-banana-2 API (output: webp)
4. แสดง loading skeleton ระหว่างรอ
5. แสดง preview → User กด "ใช้รูปนี้" หรือ "สร้างใหม่"
6. ระบบ download จาก fal.ai → resize 1200x630 (sharp) → upload Supabase Storage
7. บันทึก URL ลง `cover_images` + อัพเดท `articles.cover_image_url`

---

### 5.11 Publish Confirmation (`/projects/[id]/articles/[slug]/publish`)

**เหมือน v1.0** แต่เพิ่ม:
- แสดง cover image preview
- แสดง target + connection type: "จะ publish ไป: Best Solutions via Supabase" หรือ "via REST API → https://clienta.com/api/content"
- ใช้ credentials ของโปรเจคนั้น (Supabase หรือ REST API ตาม connection_type)

---

### 5.12 Project Settings (`/projects/[id]/settings`)

**Tab-based settings page**

```
┌─────────────────────────────────────────────────────────┐
│ ตั้งค่าโปรเจค: Best Solutions                            │
├─────────────────────────────────────────────────────────┤
│ [การเชื่อมต่อ] [เนื้อหา] [รูปปก] [ทั่วไป]                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Tab: การเชื่อมต่อ                                        │
│                                                         │
│ ประเภทการเชื่อมต่อ                                       │
│ (●) Supabase Direct    ( ) REST API                     │
│                                                         │
│ ── เมื่อเลือก Supabase ──────────────────────────────── │
│                                                         │
│ Supabase URL                                            │
│ [https://xxx.supabase.co                          ]     │
│                                                         │
│ Supabase Anon Key                                       │
│ [eyJhbG...                                        ]     │
│                                                         │
│ Service Role Key                                        │
│ [eyJhbG... ●●●●●●                                ]     │
│                                                         │
│ Storage Bucket                                          │
│ [images                                           ]     │
│                                                         │
│ ── เมื่อเลือก REST API ─────────────────────────────── │
│                                                         │
│ API Endpoint                                            │
│ [https://clienta.com/api/content                  ]     │
│                                                         │
│ API Key                                                 │
│ [sk-xxxxxxxx ●●●●●●                              ]     │
│                                                         │
│ Method                                                  │
│ (●) POST    ( ) PUT                                     │
│                                                         │
│ ──────────────────────────────────────────────────────── │
│                                                         │
│ [🔌 ทดสอบการเชื่อมต่อ]    ✅ เชื่อมต่อสำเร็จ             │
│                                                         │
│                                          [บันทึก]       │
└─────────────────────────────────────────────────────────┘
```

**Tabs:**
1. **การเชื่อมต่อ** — Supabase URL, Keys, Storage bucket, ปุ่มทดสอบ
2. **เนื้อหา** — Brand voice (textarea), Writing rules (textarea), Site inventory (markdown editor)
3. **รูปปก** — Default cover image style, fal.ai model preference
4. **ทั่วไป** — ชื่อโปรเจค, domain, archive/delete project

---

## 6. Workflow ใหม่ (v2.0)

### 6.1 Main Workflow (ไม่เปลี่ยน concept — เพิ่ม context)

```
[เลือก Project] → [เลือก Keyword]
        |
        v
   1. Brief Generation  ← ใช้ brand voice + writing rules ของ project
        |
        v
   2. AI Writing         ← ใช้ site inventory + rules ของ project
        |
        v
   3. Cover Image        ← ใหม่! fal.ai generate ในระบบ
        |
        v
   4. Editor + Review    ← เหมือนเดิม + cover image tab
        |
        v
   5. Publish            ← push ไป Supabase ของ project นั้น
```

### 6.2 Cover Image Workflow (ใหม่)

```
[ใน Editor หรือ หน้า Cover Images]
        |
        v
   1. เลือกบทความ (หรืออยู่ในบทความอยู่แล้ว)
        |
        v
   2. Auto-generate prompt จาก title + project style
      หรือ เขียน prompt เอง
        |
        v
   3. เรียก fal.ai API → รอ ~5-15 วินาที
        |
        v
   4. Preview → กด "ใช้รูปนี้" หรือ "สร้างใหม่"
        |
        v
   5. Download → WebP convert → Supabase Storage upload
        |
        v
   6. อัพเดท article.cover_image_url
```

### 6.3 Alternative Flows

**Import บทความที่เขียนเอง:**
```
Keywords → คลิก keyword → Skip brief → วาง markdown ใน editor → Publish
```

**Export สำหรับ WordPress (อนาคต):**
```
Articles → เลือกบทความ → Export as HTML/Markdown/Word
```

---

## 7. Design System v2.0

### 7.1 Colors (คงเดิม + เพิ่มเติม)

```
Primary:          #6467f2    (indigo/purple)
Primary Hover:    #5254d4
Primary Light:    #6467f2/10 (bg ของ active state, badge)
Primary Foreground: #ffffff

Background Light: #f6f6f8
Background Dark:  #101122
Background Card:  #ffffff

Border:           #e2e8f0    (slate-200)
Border Focus:     #6467f2

Text Primary:     #0f172a    (slate-900)
Text Secondary:   #475569    (slate-600)
Text Muted:       #94a3b8    (slate-400)

Success:          #10b981    (emerald-500)
Warning:          #f59e0b    (amber-500)
Error:            #ef4444    (red-500)
Info:             #3b82f6    (blue-500)
```

### 7.2 Typography (คงเดิม)

```css
font-family: 'Noto Sans Thai', 'Inter', sans-serif;

/* Markdown editor only */
.markdown-editor { font-family: 'JetBrains Mono', monospace; }
```

| Element | Size | Weight | Line Height |
|---|---|---|---|
| Page Title | 24px (text-2xl) | 700 (bold) | 1.3 |
| Section Title | 18px (text-lg) | 600 (semibold) | 1.4 |
| Body | 14px (text-sm) | 400 (normal) | 1.6 |
| Small / Label | 12px (text-xs) | 500 (medium) | 1.5 |
| Caption | 11px | 400 | 1.4 |

### 7.3 Spacing & Radius (คงเดิม)

```
Content padding:  p-6 หรือ p-8
Card padding:     p-4 หรือ p-5
Gap:              gap-4 หรือ gap-6
Border radius:    rounded (4px), rounded-lg (8px), rounded-xl (12px)
```

### 7.4 Shadows

```
Card:     shadow-sm (0 1px 2px rgba(0,0,0,0.05))
Dropdown: shadow-lg (0 10px 15px rgba(0,0,0,0.1))
Modal:    shadow-2xl (0 25px 50px rgba(0,0,0,0.15))
```

### 7.5 Component Patterns

**Card**
```
bg-white rounded-xl border border-slate-200 p-5
hover: shadow-sm transition-shadow duration-200 cursor-pointer
```

**Button Primary**
```
bg-[#6467f2] text-white rounded-lg px-4 py-2 text-sm font-medium
hover: bg-[#5254d4] transition-colors duration-150
disabled: opacity-50 cursor-not-allowed
loading: opacity-75 + spinner icon
```

**Button Secondary**
```
bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium
hover: bg-slate-50 transition-colors duration-150
```

**Status Badges (คงเดิม)**
| Status | Style |
|---|---|
| เผยแพร่แล้ว | bg-emerald-100 text-emerald-700 |
| รอดำเนินการ | bg-amber-100 text-amber-700 |
| ร่าง | bg-slate-100 text-slate-600 |
| กำลังสร้าง | bg-[#6467f2]/10 text-[#6467f2] |

**Input**
```
border border-slate-200 rounded-lg px-3 py-2 text-sm
focus: ring-2 ring-[#6467f2]/20 border-[#6467f2] outline-none
placeholder: text-slate-400
```

**Modal**
```
bg-white rounded-xl shadow-2xl max-w-[560px] w-full
overlay: bg-black/50 backdrop-blur-sm
animation: scale-95 → scale-100, opacity-0 → opacity-100 (duration-200)
```

### 7.6 Icons

ใช้ **Material Symbols Outlined** เหมือนเดิม

| Feature | Icon |
|---|---|
| Dashboard | `dashboard` |
| Keywords | `key` |
| Articles | `description` |
| Cover Images | `image` |
| Settings | `settings` |
| Projects | `folder` |
| Add | `add_circle` |
| Import | `upload_file` |
| Generate | `auto_awesome` |
| Publish | `send` |
| AI Writing | `edit_note` |
| fal.ai generate | `brush` |
| AI assist | `sparkles` |

---

## 8. API Routes ใหม่

### 8.1 เพิ่มใหม่

```
-- Projects
GET    /api/projects                    — list all projects
POST   /api/projects                    — create project
GET    /api/projects/[id]               — get project detail
PATCH  /api/projects/[id]               — update project settings
DELETE /api/projects/[id]               — archive/delete project
POST   /api/projects/[id]/test-connection — ทดสอบ Supabase connection

-- Cover Images (fal.ai)
POST   /api/images/generate             — generate via fal.ai
GET    /api/images?project_id=xxx       — list images of project
POST   /api/images/[id]/use             — ใช้รูปนี้กับบทความ (download + WebP + upload)

-- AI Assist (meta fields)
POST   /api/ai/meta                     — generate meta_title, meta_description, excerpt จาก content
```

### 8.2 แก้ไข Routes เดิม (เพิ่ม project context)

```
-- Keywords (เพิ่ม project_id filter)
GET    /api/keywords?project_id=xxx
POST   /api/keywords                    — body ต้องมี project_id

-- AI Pipeline (ดึง config จาก project)
POST   /api/ai/brief                    — body ต้องมี project_id → ใช้ brand_voice, writing_rules
POST   /api/ai/article                  — body ต้องมี project_id → ใช้ site_inventory, writing_rules

-- Publish (ใช้ Supabase credentials ของ project)
POST   /api/publish                     — body ต้องมี project_id → ดึง supabase_url, keys จาก project
```

---

## 9. fal.ai Integration Detail

### 9.1 API Route: `/api/images/generate`

```typescript
// POST /api/images/generate
// Request
{
  project_id: string
  article_id?: string       // optional ถ้ายังไม่ผูกบทความ
  prompt: string
  resolution: "0.5K" | "1K" | "2K"  // default "1K"
  aspect_ratio: string      // default "landscape_16_9" (สำหรับ blog cover)
  model: string             // default "fal-ai/nano-banana-2"
}

// Response (streaming status)
{
  id: string                // cover_images.id
  status: "generating"
  fal_request_id: string
}

// Polling or webhook → status: "completed"
{
  id: string
  status: "completed"
  image_url: string         // Supabase Storage URL (WebP)
}
```

### 9.2 Nano Banana 2 API

```typescript
// เรียก fal.ai nano-banana-2
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/nano-banana-2", {
  input: {
    prompt: "Professional blog cover image, deep navy background...",
    resolution: "1K",                    // 0.5K | 1K | 2K | 4K
    aspect_ratio: "landscape_16_9",      // สำหรับ blog cover 16:9
    output_format: "webp",               // ได้ webp เลย ไม่ต้อง convert
    num_images: 1,
    safety_tolerance: "4",
  },
  logs: true,
});

// result.data.images[0].url → temporary URL
// download → upload Supabase Storage
```

**Parameters สำคัญ:**
| Parameter | ค่าที่ใช้ | หมายเหตุ |
|---|---|---|
| `resolution` | `1K` (default) | 1K เพียงพอสำหรับ blog cover, 2K ถ้าต้องการชัดขึ้น |
| `aspect_ratio` | `landscape_16_9` | ได้สัดส่วน blog cover (ใกล้ 1200x630) |
| `output_format` | `webp` | ได้ WebP เลย ลด step convert |
| `enable_web_search` | `false` | ไม่จำเป็นสำหรับ cover image |
| `thinking_level` | `minimal` | ไม่ต้อง think เยอะ ประหยัด cost |

### 9.3 Flow ภายใน

```
1. รับ request → สร้าง record ใน cover_images (status: generating)
2. เรียก fal.ai API:
   fal.subscribe("fal-ai/nano-banana-2", {
     input: { prompt, resolution, aspect_ratio, output_format: "webp" }
   })
3. รอ response → ได้ image URL จาก fal.ai (temporary)
4. Download image จาก fal.ai URL (webp แล้ว)
5. Resize เป็น 1200x630 ด้วย sharp (ถ้าขนาดไม่ตรง)
6. Upload ไป Supabase Storage ของ project นั้น
   path: blog-covers/[article-slug].webp
7. อัพเดท cover_images record (status: completed, image_url)
8. อัพเดท articles.cover_image_url (ถ้ามี article_id)
```

### 9.4 Environment Variable เพิ่ม

```
FAL_KEY=                    # fal.ai API key
```

### 9.5 Cost Estimate

| Model | Resolution | Cost/image | Cost (THB) |
|---|---|---|---|
| nano-banana-2 | 0.5K | $0.06 | ~฿2.10 |
| nano-banana-2 | 1K | $0.08 | ~฿2.80 |
| nano-banana-2 | 2K | $0.12 | ~฿4.20 |

**เลือก 1K เป็น default** — คุณภาพดีพอสำหรับ blog cover, ราคา ~฿2.80/รูป

---

## 10. Migration Plan (v1.0 → v2.0)

### Phase 1: Database + Project System
1. สร้าง `projects` table
2. สร้าง `cover_images` table
3. เพิ่ม `project_id` column ใน `keywords` และ `articles`
4. สร้าง default project จากข้อมูล v1.0 (Best Solutions)
5. Migrate keywords + articles ที่มีอยู่ให้ชี้ไป default project

### Phase 2: Navigation + Layout
6. สร้าง Project List page (`/projects`)
7. สร้าง New Project form (`/projects/new`)
8. แก้ Layout → เพิ่ม Project Switcher, แก้ Sidebar, เพิ่ม Breadcrumb
9. แก้ URL structure ทั้งหมด (เพิ่ม `/projects/[id]/` prefix)

### Phase 3: Project Settings
10. สร้าง Project Settings page (4 tabs)
11. แก้ AI routes ให้ดึง config จาก project
12. แก้ Publish route ให้ใช้ Supabase credentials จาก project

### Phase 4: Cover Image (fal.ai)
13. เพิ่ม `FAL_KEY` env variable
14. สร้าง `/api/images/generate` route
15. สร้าง Cover Image gallery page
16. สร้าง Generate Cover Image modal
17. เพิ่ม Cover Image tab ใน Editor sidebar

### Phase 5: Polish
18. Empty states ทุกหน้า
19. Error handling ครบ
20. Responsive sidebar collapse
21. Deploy + ตั้ง env vars ใหม่

---

## 11. Decision Log

| # | Decision | Alternatives | Why |
|---|---|---|---|
| D1 | ใช้ `project_id` FK ใน keywords/articles | แยก database ต่อ project | ง่ายกว่า query ง่าย ไม่ต้อง manage หลาย DB |
| D2 | เก็บ Supabase credentials ใน `projects` table | ใช้ env vars ต่อ project | Flexible เพิ่ม/ลบ project ได้โดยไม่ redeploy |
| D3 | fal.ai nano-banana-2 เป็น default model | flux/schnell, flux-pro, DALL-E | output webp ได้เลย, รองรับ aspect ratio หลากหลาย, ~฿2.80/รูป (1K) |
| D4 | Project Switcher อยู่ที่ header | อยู่ใน sidebar, แยกหน้าต่างหาก | เข้าถึงง่ายจากทุกหน้า pattern เดียวกับ Vercel/Linear |
| D5 | Cover Image เป็นหน้าแยก + tab ใน editor | อยู่ใน editor อย่างเดียว | มี gallery view ดูรูปทั้งหมดได้, generate ล่วงหน้าได้ |
| D6 | Brand voice / writing rules เป็น free text | structured form (dropdown, checkbox) | Flexible กว่า user กำหนดเองได้ตามต้องการ |
| D7 | WordPress export ทำทีหลัง | ทำ connector ตั้งแต่แรก | YAGNI — ยังไม่มีลูกค้า WordPress ตอนนี้ |
| D8 | Keyword list เป็น flat data table | Cluster accordion (v1.0) | อ้างอิง Clearscope/NeuronWriter — table sort/filter ดีกว่า accordion สำหรับข้อมูลเยอะ |
| D9 | Cluster เปลี่ยนเป็น "หมวดหมู่" (Category) | ใช้ชื่อ Cluster เดิม | UX ชัดกว่าสำหรับ Thai UI, ใช้เป็น filter + column ไม่ใช่ grouping |
| D10 | สร้างโปรเจคใหม่แยก (ไม่ refactor v1.0) | ปรับ codebase เดิม | v2.0 เปลี่ยน 60%+ (URL, layout, types, features) — copy AI logic จากเดิมมาใช้ได้ |
| D11 | รองรับ 2 connection types (Supabase + REST API) | Supabase only | REST API ทำให้เชื่อมต่อเว็บลูกค้าที่ไม่ได้ใช้ Supabase ได้, รองรับ WordPress ในอนาคต |

---

## 12. Security Considerations

| Risk | Mitigation |
|---|---|
| Supabase credentials เก็บใน DB | Encrypt service_role_key ด้วย AES-256 (ใช้ AUTH_SECRET เป็น key) |
| fal.ai API key | เก็บใน env var เท่านั้น ไม่เก็บใน DB |
| Cross-project access | ทุก query ต้อง filter ด้วย project_id, validate ownership |
| Cover image temp URL | Download จาก fal.ai ทันที ไม่เก็บ temp URL |

---

## 13. Paper Design — Artboard List

หน้าที่ต้องออกแบบใน Paper ทั้งหมด **12 artboards** (Desktop 1440x900, ยกเว้นที่ระบุ)

| # | Artboard Name | Route | ขนาด | สถานะ | หมายเหตุ |
|---|---|---|---|---|---|
| 0 | Design System | — | 1440x1800 | ✅ เสร็จ | Colors, Typography, Components |
| 1 | Project List | `/projects` | 1440x900 | ✅ เสร็จ | Card grid + sidebar + new project |
| 2 | New Project | `/projects/new` | 1440x900 | ⬜ | 3-step wizard (info → Supabase → content config) |
| 3 | Project Dashboard | `/projects/[id]/dashboard` | 1440x900 | ✅ เสร็จ | Stats cards, หมวดหมู่ progress, activity, cost |
| 4 | Keyword List | `/projects/[id]/keywords` | 1440x900 | ✅ เสร็จ | Flat data table + filter bar + sort + pagination |
| 5 | Add Keyword Modal | — (modal) | 560x620 | ✅ เสร็จ | Form modal overlay on keyword list |
| 6 | Import CSV Modal | — (modal) | 640x600 | ✅ เสร็จ | 3-step wizard, Step 2 preview + duplicate highlight |
| 7 | Brief Review | `/projects/[id]/articles/[slug]/brief` | 1440x900 | ✅ เสร็จ | 2-panel: keyword info + brief markdown |
| 8 | AI Writing | `/projects/[id]/articles/[slug]/writing` | 1440x900 | ✅ เสร็จ | Full-page streaming terminal + stats |
| 9 | Article Editor | `/projects/[id]/articles/[slug]/edit` | 1440x900 | ✅ เสร็จ | 3-column: sidebar + editor + preview |
| 10 | Cover Image Gallery | `/projects/[id]/images` | 1440x900 | ✅ เสร็จ | Image grid + generate modal |
| 11 | Generate Cover Modal | — (modal) | 640x720 | ✅ เสร็จ | Prompt input + resolution/aspect ratio + preview |
| 12 | Publish Confirm | — (modal) | 720x660 | ✅ เสร็จ | Checklist + JSON preview + target info |
| 13 | Project Settings | `/projects/[id]/settings` | 1440x900 | ✅ เสร็จ | 4 tabs: connection (Supabase/REST API), content, cover, general |
| 14 | New Project | `/projects/new` | 1440x900 | ✅ เสร็จ | 3-step wizard centered form |

### ออกแบบเรียงตามลำดับ priority:
1. **Keyword List** (หน้าที่ใช้บ่อยสุด — เปลี่ยนเป็น flat table)
2. **Project Dashboard** (overview)
3. **Article Editor** (core workflow)
4. **AI Writing** (streaming page)
5. **Cover Image Gallery + Generate Modal** (feature ใหม่)
6. **Brief Review** (workflow step)
7. **New Project** (ใช้ครั้งเดียวต่อโปรเจค)
8. **Modals** (Add Keyword, Import CSV, Publish Confirm)
9. **Project Settings** (ตั้งค่าครั้งเดียว)

---

## 14. UI Research Notes

### Keyword List — อ้างอิง pattern จากเครื่องมือ SEO ชั้นนำ

| Tool | Pattern | สิ่งที่น่าใช้ |
|---|---|---|
| **Clearscope** | Full data table + Content Views (saved filters) | Configurable columns, saved filter presets |
| **NeuronWriter** | Table with project sidebar + configurable columns | Word count, assignment, delivery date ใน column เดียว |
| **MarketMuse** | Table with Pages/Topics tabs + Saved Views | Dual view (URL vs Topic), content score buckets |
| **Jasper Grid** | Spreadsheet/grid + AI pipeline | Bulk AI operations ใน grid |
| **WriterZen** | Project → Cluster → Article table | Mindmap discovery → table execution |

**สรุป pattern ที่เลือกใช้:**
- Flat sortable table (ไม่ใช่ accordion)
- Category (หมวดหมู่) เป็น filter dropdown + column ในตาราง
- Checkbox สำหรับ bulk actions
- Configurable columns (ซ่อน/แสดง) — อนาคต
- Pagination 20 rows/page
