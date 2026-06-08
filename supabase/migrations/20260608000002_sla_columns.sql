-- Add SLA / pending response tracking columns to investigations
ALTER TABLE public.investigations
  ADD COLUMN IF NOT EXISTS waiting_on text,
  ADD COLUMN IF NOT EXISTS sla_due_at timestamp with time zone;
