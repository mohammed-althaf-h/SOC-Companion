alter table public.user_settings add column if not exists openai_api_key text;
alter table public.user_settings add column if not exists anthropic_api_key text;
alter table public.user_settings add column if not exists gemini_api_key text;
alter table public.user_settings add column if not exists preferred_llm text default 'openai';
