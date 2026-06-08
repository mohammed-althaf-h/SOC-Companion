-- ============================================================
-- SOC Companion: Auto-Resetting Demo Account
-- Uses pg_cron to wipe cases and settings for test@test.com
-- ============================================================

-- 1. Enable pg_cron extension
create extension if not exists pg_cron with schema extensions;

-- 2. Create the stored procedure that securely bypasses RLS
create or replace function public.reset_demo_account(demo_email text)
returns void
language plpgsql
security definer -- Required to access auth.users and bypass RLS constraints
as $$
declare
  demo_user_id uuid;
begin
  -- Find the user ID for the provided email
  select id into demo_user_id from auth.users where email = demo_email;
  
  if demo_user_id is not null then
    -- Delete all investigations (cascades to IOCs and Timeline Events)
    delete from public.investigations where user_id = demo_user_id;
    
    -- Delete all clients
    delete from public.clients where user_id = demo_user_id;
    
    -- Reset user settings back to generic defaults and wipe API keys
    update public.user_settings 
    set team_name = 'Demo SOC Team',
        soc_email = 'demo@soccompanion.com',
        analyst_display_name = 'Demo Analyst',
        sign_off_template = 'Regards,\n{{analyst_name}}\n{{team_name}}',
        abuseipdb_api_key = null,
        ipinfo_api_key = null,
        openai_api_key = null,
        anthropic_api_key = null,
        gemini_api_key = null
    where user_id = demo_user_id;
    
    -- Note: We do NOT delete alert_templates so the demo account 
    -- remains fully functional without forcing the user through the Setup Wizard again.
  end if;
end;
$$;

-- 3. Schedule the cron job to run every day at midnight UTC
select cron.schedule(
  'reset-demo-account-daily', 
  '0 0 * * *', 
  $$select public.reset_demo_account('test@test.com')$$
);
