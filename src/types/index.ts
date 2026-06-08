// ─── Database row types ───────────────────────────────────────────────────────

export interface Client {
  id: string
  user_id: string
  name: string
  short_code: string
  color_tag: string
  associated_domains: string[]
  contact_email: string | null
  soc_email: string
  spoc_name: string | null
  notes: string | null
  created_at: string
}

export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type InvestigationStatus = 'new' | 'in_progress' | 'pending_response' | 'closed'
export type Verdict =
  | 'true_positive'
  | 'false_positive'
  | 'benign'
  | 'inconclusive'
  | null

export interface Investigation {
  id: string
  user_id: string
  client_id: string
  alert_rule_id: string | null
  case_number: string
  alert_name: string
  title: string | null
  status: InvestigationStatus
  severity: Severity
  triggered_at: string
  assigned_analyst: string | null
  field_data: Record<string, string>
  observations: string[]
  next_steps: string | null
  verdict: Verdict
  draft_email: string | null
  summary: string | null
  // SLA / pending response fields
  waiting_on: string | null
  sla_due_at: string | null
  created_at: string
  updated_at: string
  // joined
  client?: Client
}

export interface IOC {
  id: string
  investigation_id: string
  type: 'IP' | 'Domain' | 'Hash' | 'URL' | 'Email' | 'Filename'
  value_raw: string
  value_defanged: string | null
  source: string | null
  notes: string | null
  blocked: boolean
  created_at: string
}

export interface TimelineEvent {
  id: string
  investigation_id: string
  event_type:
    | 'created'
    | 'status_changed'
    | 'field_saved'
    | 'ioc_added'
    | 'draft_generated'
    | 'email_sent'
    | 'manual'
    | 'verdict_set'
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
}

// ─── Alert rule / template types ─────────────────────────────────────────────

export type AlertCategory = 'UBA_AZURE' | 'SIEM' | 'SENTINELONE' | 'OTHERS'

export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'ip'
  | 'url'
  | 'email'
  | 'boolean'
  | 'datetime'
  | 'number'

export interface FieldDefinition {
  id: string
  label: string
  type: FieldType
  placeholder?: string
  options?: string[]
  required?: boolean
  defang?: boolean          // auto-defang on blur
  monospace?: boolean       // render in JetBrains Mono
  helperText?: string
}

export interface ObservationTemplate {
  id: string
  text: string              // template with {{variable}} placeholders
  variables: string[]       // list of variable names in the template
}

export interface AlertRule {
  id: string
  name: string
  category: AlertCategory
  description: string
  defaultSeverity: Severity
  mitreTactics: string[]
  fieldsSchema: FieldDefinition[]
  observationsChecklist: ObservationTemplate[]
  emailTemplate: string
  verdictOptions?: string[]
}

// ─── UI / form types ─────────────────────────────────────────────────────────

export interface NewInvestigationFormData {
  client_id: string
  case_number: string
  alert_name: string
  severity: Severity
  triggered_at: string
  alert_rule_id: string | null
  field_data: Record<string, string>
  observations: string[]
}

export interface ClientFormData {
  name: string
  short_code: string
  color_tag: string
  associated_domains: string
  contact_email: string
  soc_email: string
  spoc_name: string
  notes: string
}

// ─── Cross-contamination ─────────────────────────────────────────────────────

export interface ContaminationResult {
  detected: boolean
  offendingCode: string | null
  offendingClientName: string | null
  fields: string[]
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AnalystProfile {
  id: string
  email: string
  full_name: string | null
  soc_email: string
}

// ─── Rules Wiki ───────────────────────────────────────────────────────────────

export interface RuleWiki {
  id: string
  user_id: string
  rule_name: string
  content: string
  created_at: string
  updated_at: string
}

// ─── User Settings ────────────────────────────────────────────────────────────

export interface UserSettings {
  id: string
  user_id: string
  team_name: string
  soc_email: string
  analyst_display_name: string | null
  sign_off_template: string
  abuseipdb_api_key: string | null
  ipinfo_api_key: string | null
  openai_api_key: string | null
  anthropic_api_key: string | null
  gemini_api_key: string | null
  preferred_llm: string
  setup_completed: boolean
  created_at: string
  updated_at: string
}

export const DEFAULT_USER_SETTINGS: Partial<UserSettings> = {
  team_name: 'My SOC Team',
  soc_email: 'soc@example.com',
  analyst_display_name: null,
  sign_off_template: 'Regards,\n{{analyst_name}}\n{{team_name}}',
  abuseipdb_api_key: null,
  ipinfo_api_key: null,
  openai_api_key: null,
  anthropic_api_key: null,
  gemini_api_key: null,
  preferred_llm: 'openai',
  setup_completed: false,
}
