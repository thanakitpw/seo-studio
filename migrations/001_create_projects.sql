-- Migration 001: Create projects table
-- Run this in Supabase SQL Editor

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  domain text,

  -- Connection Config
  connection_type text not null default 'supabase',

  -- Supabase Connection
  supabase_url text,
  supabase_anon_key text,
  supabase_service_role_key text,
  storage_bucket text default 'images',

  -- REST API Connection
  api_endpoint text,
  api_key text,
  api_method text default 'POST',

  -- Brand & Content Config
  brand_voice text,
  writing_rules text,
  site_inventory text,
  cover_image_style text,

  -- Meta
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
