-- Migration 003: Add project_id to keywords and articles
-- Run this in Supabase SQL Editor

-- Add project_id to keywords
alter table keywords add column if not exists project_id uuid references projects(id) on delete cascade;

-- Add project_id to articles
alter table articles add column if not exists project_id uuid references projects(id) on delete cascade;
