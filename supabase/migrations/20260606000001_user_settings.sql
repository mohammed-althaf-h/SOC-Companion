-- ============================================================
-- SOC Companion: user_settings table
-- Run this in your Supabase SQL Editor
-- ============================================================

create table if not exists public.user_settings (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users(id) on delete cascade not null unique,
  team_name            text not null default 'My SOC Team',
  soc_email            text not null default 'soc@example.com',
  analyst_display_name text,
  sign_off_template    text not null default 'Regards,
{{analyst_name}}
{{team_name}}',
  abuseipdb_api_key    text,
  ipinfo_api_key       text,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- RLS: users can only read/write their own row
alter table public.user_settings enable row level security;

create policy "Users manage their own settings"
  on public.user_settings
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at on row changes
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_user_settings_updated_at
  before update on public.user_settings
  for each row execute procedure public.set_updated_at();
