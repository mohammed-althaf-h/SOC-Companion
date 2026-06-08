create table if not exists public.enrichment_cache (
  ioc_value text primary key,
  ipinfo_data jsonb,
  abuseipdb_data jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.enrichment_cache enable row level security;

-- Global read access for authenticated users
create policy "Enable read access for all authenticated users"
  on public.enrichment_cache for select
  to authenticated
  using (true);

-- Global insert/update access for authenticated users
create policy "Enable insert/update access for all authenticated users"
  on public.enrichment_cache for insert
  to authenticated
  with check (true);

create policy "Enable update access for all authenticated users"
  on public.enrichment_cache for update
  to authenticated
  using (true)
  with check (true);
