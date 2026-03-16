-- Migration 004: Create default project "Best Solutions" and migrate existing data
-- Run this in Supabase SQL Editor

-- Step 1: Insert default project
insert into projects (id, name, slug, domain, connection_type, supabase_url, supabase_anon_key, supabase_service_role_key, brand_voice, writing_rules, cover_image_style)
values (
  'a0000000-0000-0000-0000-000000000001',
  'Best Solutions',
  'best-solutions',
  'bestsolutions.co.th',
  'supabase',
  null,  -- uses app's default Supabase (same instance)
  null,
  null,
  'สบายๆ เข้าใจง่าย เหมาะ SME ไทย',
  'ห้ามใช้ ":" ในเนื้อหา, ห้ามใช้ "สำหรับ SME" ใน heading, ต้องมี Featured Snippet paragraph (40-60 คำ), ต้องมี FAQ 5 ข้อ + JSON-LD schema',
  'Deep navy + neon cyan, corporate tech style'
)
on conflict (slug) do nothing;

-- Step 2: Migrate existing keywords
update keywords set project_id = 'a0000000-0000-0000-0000-000000000001' where project_id is null;

-- Step 3: Migrate existing articles
update articles set project_id = 'a0000000-0000-0000-0000-000000000001' where project_id is null;
