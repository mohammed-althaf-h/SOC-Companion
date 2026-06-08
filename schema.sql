-- Create the clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  short_code text not null,
  color_tag text not null,
  associated_domains text[] default array[]::text[],
  contact_email text,
  soc_email text not null default 'soc@eci.com',
  spoc_name text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create investigations table
CREATE TABLE IF NOT EXISTS public.investigations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  alert_rule_id text,
  case_number text not null,
  alert_name text not null,
  title text,
  status text not null default 'new',
  severity text not null,
  triggered_at timestamp with time zone not null,
  assigned_analyst text,
  field_data jsonb default '{}'::jsonb,
  observations jsonb default '[]'::jsonb,
  next_steps text,
  verdict text,
  draft_email text,
  summary text,
  waiting_on text,
  sla_due_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create iocs table
CREATE TABLE IF NOT EXISTS public.iocs (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations(id) on delete cascade,
  type text not null,
  value_raw text not null,
  value_defanged text,
  source text,
  notes text,
  blocked boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create timeline_events table
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations(id) on delete cascade,
  event_type text not null,
  description text not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iocs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

-- Clients Policies
CREATE POLICY "Users can view their own clients"
ON public.clients FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
ON public.clients FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
ON public.clients FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
ON public.clients FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Investigations Policies
CREATE POLICY "Users can manage their own investigations"
ON public.investigations FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- IOCs Policies
CREATE POLICY "Users can manage IOCs for their investigations"
ON public.iocs FOR ALL TO authenticated
USING (
  investigation_id IN (
    SELECT id FROM public.investigations WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  investigation_id IN (
    SELECT id FROM public.investigations WHERE user_id = auth.uid()
  )
);

-- Timeline Events Policies
CREATE POLICY "Users can manage timeline events for their investigations"
ON public.timeline_events FOR ALL TO authenticated
USING (
  investigation_id IN (
    SELECT id FROM public.investigations WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  investigation_id IN (
    SELECT id FROM public.investigations WHERE user_id = auth.uid()
  )
);

-- Create alert_templates table
CREATE TABLE IF NOT EXISTS public.alert_templates (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  description text not null,
  default_severity text not null,
  mitre_tactics text[] default array[]::text[],
  fields_schema jsonb default '[]'::jsonb,
  observations_checklist jsonb default '[]'::jsonb,
  email_template text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.alert_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own alert templates"
ON public.alert_templates FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create rules_wiki table
CREATE TABLE IF NOT EXISTS public.rules_wiki (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rule_name text not null,
  content text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(user_id, rule_name)
);

ALTER TABLE public.rules_wiki ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own rules wiki"
ON public.rules_wiki FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_name text not null default 'My SOC Team',
  soc_email text not null default 'soc@example.com',
  analyst_display_name text,
  sign_off_template text not null default 'Regards,\n{{analyst_name}}\n{{team_name}}',
  abuseipdb_api_key text,
  ipinfo_api_key text,
  setup_completed boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
ON public.user_settings FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

