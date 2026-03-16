-- Migration 005: Add kd and volume columns to keywords
-- Run this in Supabase SQL Editor

alter table keywords add column if not exists kd smallint default null;
alter table keywords add column if not exists volume integer default null;
