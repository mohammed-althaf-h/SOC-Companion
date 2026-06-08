-- ============================================================
-- SOC Companion: add setup_completed to user_settings
-- Run this in your Supabase SQL Editor
-- ============================================================

alter table public.user_settings 
add column if not exists setup_completed boolean default false;
