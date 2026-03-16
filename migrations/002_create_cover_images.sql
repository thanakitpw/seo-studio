-- Migration 002: Create cover_images table
-- Run this in Supabase SQL Editor

create table if not exists cover_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  article_id uuid references articles(id),

  prompt text not null,
  image_url text,
  fal_request_id text,
  status text default 'pending',

  width int default 1200,
  height int default 630,

  created_at timestamptz default now()
);
