# SOC Companion — Changes Log
**Session:** 2026-06-08 · Feature Roadmap Expansion & Feature 11 Implementation
**Status:** Built AI Observation Writer (Feature 17).
**Previous Session:** 2026-06-06 · Conversation fd14ed62 & 1a450401 (P0 Feature 1 & 2 complete · P1 Features 6 & 7 complete · P2 Features 10, 14, 15, 16 complete)

---

## 🤖 Agent Context: Architecture Evolution (Before vs. Now)
*Note for future agents: This section summarizes the major architectural shifts made to make SOC Companion open-source ready and dynamically configurable.*

### 1. Alert Templates (The Single Source of Truth)
- **Before:** Alert rules were hardcoded in `src/data/alertRules.ts`. The UI (`InvestigationDetailPage.tsx`) imported `getAlertRuleById` synchronously. Users had to edit TypeScript code to add or change SIEM rules.
- **Now:** The Supabase table `alert_templates` is the authoritative source. The frontend strictly uses the `useAlertTemplates()` async hook. The old file is renamed to `src/data/alertRulesDefaultSeed.ts` and is **only** used by `scripts/seed-alert-templates.ts` to populate the DB during setup.

### 2. Team Branding & Emails
- **Before:** "ECI-SOC", "soc@eci.com", and analyst names were hardcoded as raw strings across the app (Sidebar, `emailTemplates.ts`).
- **Now:** Managed dynamically via the `user_settings` table. Users configure `team_name`, `soc_email`, and a custom `sign_off_template` in `/settings`. The `useUserSettings()` hook provides this data globally, and the draft generator explicitly replaces `{{team_name}}` and `{{analyst_name}}` on the fly.

### 3. Investigation Workflow
- **Before:** Email drafts were read-only `<pre>` blocks requiring users to copy to notepad first. IOCs were isolated per-case.
- **Now:** Drafts are editable `<textarea>` fields that auto-save to the `draft_email` column. Users can "Copy as Rich Text" (converts markdown to HTML clipboard format for Outlook). A new `/iocs` global page searches all IOCs across all clients and flags recurrences (e.g., `⚠️ 3 cases`).

### 4. Dashboards & Reporting
- **Before:** The dashboard had a "coming soon" placeholder. No way to summarize a shift.
- **Now:** The Dashboard has a live `ActivityFeed` (auto-refreshes every 60s). A `/shift-report` page generates copyable Markdown summaries of cases handled in the last 8h/12h/24h. An `/analytics` page uses `recharts` to show verdicts, severities, and top rules.

---

## ⚠️ Required Manual Step (Supabase)

Before the app works correctly, run this SQL once in your **Supabase SQL Editor**:

```
File: supabase/migrations/20260606_user_settings.sql
```

This creates the `user_settings` table with RLS. Without it, Settings will fail to save.

## ⚠️ Required Manual Step (Seed Templates)

Run the following command to populate your database with the default alert templates:
```bash
npx tsx scripts/seed-alert-templates.ts your-email@eci.com your-password
```

---

## Files Created

### `scripts/seed-alert-templates.ts` *(new)*
**What it does:** Independent Node.js script using `@supabase/supabase-js`.
- Parses the hardcoded templates from `alertRulesDefaultSeed.ts`
- Connects using your CLI credentials (email/password) and `.env.local`
- Upserts all default templates into your `alert_templates` table to prepare the workspace for the UI.

---

### `src/hooks/useUserSettings.ts` *(new)*
**What it does:** Fetches and upserts the `user_settings` row for the current user.  
- `useUserSettings()` — React Query hook, 5-min cache. Auto-creates a default row on first call if none exists.  
- `useUpdateUserSettings()` — mutation that upserts settings using `onConflict: 'user_id'`.  
- `resolveSignOff(settings, analystName)` — replaces `{{analyst_name}}` and `{{team_name}}` in the sign-off template string.

---

### `src/hooks/useActivityFeed.ts` *(new)*
**What it does:** Queries the 12 most recent `timeline_events` joined with `investigations + clients`.  
- Returns typed `ActivityEntry[]` with `clientColor`, `clientShortCode`, `caseNumber`, `investigationId`, `description`, `timestamp`.  
- `refetchInterval: 60_000` — auto-refreshes every 60 seconds on the dashboard.

---

### `src/components/dashboard/ActivityFeed.tsx` *(new)*
**What it does:** Renders the live activity feed in the dashboard.  
- Shows client color dot, short-code badge, case number, event description, and timestamp per row.  
- Each row is a `<Link>` to the investigation.  
- Manual refresh button (spinner while fetching).  
- Graceful empty state when no events exist.

---

### `src/pages/GlobalIOCsPage.tsx` *(new)*
**What it does:** Cross-investigation IOC search page at `/iocs`.  
- Search box with `ilike` query on `value_raw` across all `iocs` rows.  
- Results table: type, defanged value, client badge, case number link, timestamp.  
- **Auto-flags multi-case IOCs:** if the same `value_raw` appears in more than 1 investigation, a red `⚠️ N cases` badge appears on the value.  
- Results only appear after form submit (min 2 chars).

---

### `src/pages/AnalyticsPage.tsx` *(new)*
**What it does:** Analytics dashboard at `/analytics` using `recharts`.  
- 4 stat cards: Total Cases, True Positives, False Positives, Pending Verdict.  
- 4 charts:
  - **14-day bar chart** — investigations created per day
  - **Verdict donut** — TP / FP / Benign / Inconclusive distribution
  - **Severity bar chart** — Critical / High / Medium / Low breakdown with per-severity colors
  - **Top 8 alert rules** — horizontal progress bars ranked by trigger count
- All data from a single Supabase query; no RPC required.

---

### `src/pages/ShiftReportPage.tsx` *(new)*
**What it does:** Shift Handoff Report at `/shift-report`.  
- Date-range picker with **Last 8h / 12h / 24h** quick presets.  
- Generates a Markdown report containing:
  - Summary table (opened, closed, pending, TP, FP counts)
  - Cases grouped by client with severity, status, verdict
- **Copy Markdown** → clipboard  
- **Download .md** → file download  
- Pure client-side generation (no API call needed).

---

### `supabase/migrations/20260606_user_settings.sql` *(new)*
**What it does:** Creates the `user_settings` table.  
```sql
-- Columns: id, user_id, team_name, soc_email, analyst_display_name,
--          sign_off_template, abuseipdb_api_key, ipinfo_api_key,
--          created_at, updated_at
-- RLS: users can only access their own row
-- Trigger: auto-updates updated_at on every row change
```
⚠️ **Must be run manually in Supabase SQL Editor.**

---

## Files Modified

### `src/hooks/useAlertTemplates.ts`
**What changed:** 
- Completely removed the hardcoded merge logic with `ALERT_RULES`.
- The `useAlertTemplates` hook now strictly fetches and maps templates from the `alert_templates` database table, fully decoupling the app from the hardcoded file.

---

### `src/data/alertRulesDefaultSeed.ts`
**What changed:** 
- **Renamed** from `src/data/alertRules.ts`.
- Removed `getAlertRuleById` and `getAlertRulesByCategory` helper functions. It now acts solely as a static seed dictionary for the database.

---

### `src/types/index.ts`
**What changed:** Added two new exports at the bottom of the file.

```typescript
// New interface
export interface UserSettings {
  id, user_id, team_name, soc_email, analyst_display_name,
  sign_off_template, abuseipdb_api_key, ipinfo_api_key,
  created_at, updated_at
}

// Default values constant (used as fallback before settings load)
export const DEFAULT_USER_SETTINGS = {
  team_name: 'My SOC Team',
  soc_email: 'soc@example.com',
  analyst_display_name: null,
  sign_off_template: 'Regards,\n{{analyst_name}}\n{{team_name}}',
  abuseipdb_api_key: null,
  ipinfo_api_key: null,
}
```

---

### `src/lib/emailTemplates.ts`
**What changed:** Complete rewrite. Zero hardcoded branding remains.

| Before | After |
|---|---|
| `"ECI-SOC"` hardcoded in generic template sign-off | `buildSignOff(settings, analystName)` → renders `sign_off_template` |
| `soc@eci.com` hardcoded in 8 `buildNextSteps` cases | `settings.soc_email` with client override |
| `generateDraftEmail(inv, client, rule, analystName)` | `generateDraftEmail(inv, client, rule, analystName, settings?)` — `settings` is optional; falls back to `DEFAULT_USER_SETTINGS` |
| Rule templates couldn't access team name | Context now includes `team_name`, `soc_email`, `sign_off` tokens |

---

### `src/pages/SettingsPage.tsx`
**What changed:** Full rewrite. Was 52 lines of static display; now 275 lines of interactive form.

**Three sections:**
1. **Team Profile** — Team name, SOC email, analyst display name, sign-off template textarea + live sign-off preview card. Saves via `useUpdateUserSettings`.
2. **API Keys** — AbuseIPDB key + ipinfo.io key with show/hide password toggles and links to get free keys. Saves independently.
3. **Security Guards** — Redesigned display of cross-contamination protection and defanging rules (unchanged logic, new layout).

---

### `src/pages/InvestigationDetailPage.tsx`
**What changed:** Multiple focused patches.

1. **Settings wired into draft generator:**
   ```typescript
   const { data: settings } = useUserSettings()
   // ...
   generateDraftEmail(inv, client, rule, settings?.analyst_display_name || analystName, settings)
   ```

2. **Draft tab rewritten** — `<pre>` replaced with editable `<textarea>`:
   - `draftText` state — initialised from `draft_email` DB column or auto-generated
   - `onBlur` → `handleSaveDraft()` → upserts `draft_email` column silently
   - **Regenerate** button resets textarea to fresh auto-generated content
   - **Copy Rich Text** button — uses `ClipboardItem` with `text/html` MIME type; converts `[SECTION]:` headers to `<strong>`, numbered lines to `<li>`, pastes formatted into Outlook/Gmail
   - **Copy Plain** button — previous plain-text clipboard copy

4. **Async Rule Lookup:**
   - Switched from synchronous `getAlertRuleById` to asynchronously loading rules using the `useAlertTemplates()` hook.

3. **Import cleanup** — removed unused `FileSearch`, `Clock`, `ChevronDown`, `Save`, `formatDateTimeLocal`, `useAddIOC`, and hardcoded `getAlertRuleById` imports.

---

### `src/pages/DashboardPage.tsx`
**What changed:** Replaced placeholder with live feed.

```diff
- <div className="text-sm text-muted-foreground flex items-center justify-center h-48 ...">
-   Activity feed coming soon...
- </div>
+ <ActivityFeed />
```

Also updated the Settings quick-action card subtitle from `"App config"` to `"Team profile & API keys"`.

---

### `src/components/layout/Sidebar.tsx`
**What changed:**

1. **Hardcoded "ECI-SOC Platform" removed:**
   ```diff
   - <p className="text-[10px] text-muted-foreground ...">ECI-SOC Platform</p>
   + <p className="text-[10px] text-muted-foreground ... truncate">
   +   {settings?.team_name ?? 'SOC Platform'}
   + </p>
   ```

2. **Three new nav items added:**
   ```typescript
   { to: '/iocs',         icon: Search,    label: 'Global IOCs' },
   { to: '/analytics',    icon: BarChart3, label: 'Analytics' },
   { to: '/shift-report', icon: Clock,     label: 'Shift Report' },
   ```

3. **`useUserSettings` hook** imported and called in `Sidebar`.

---

### `src/App.tsx`
**What changed:** Three new protected routes registered.

```typescript
<Route path="iocs"         element={<GlobalIOCsPage />} />
<Route path="analytics"    element={<AnalyticsPage />} />
<Route path="shift-report" element={<ShiftReportPage />} />
```

---

### `package.json` / `node_modules`
**What changed:** `recharts` installed via `npm install recharts`.  
Used by `AnalyticsPage.tsx` for all charts.

---

## Feature Status

| # | Feature | Priority | Status | Notes |
|---|---|---|---|---|
| 1 | Settings-Driven Branding | P0 | ✅ Done | Needs SQL migration run |
| 2 | Migrate alertRules.ts → DB | P0 | ✅ Done | Seed script added. DB is now SSOT. |
| 3 | Template Builder UI | P0 | ✅ Done | Full tabbed editor added |
| 4 | First-Run Setup Wizard | P0 | ✅ Done | With Individual/Org switch |
| 5 | Template Import/Export | P1 | ✅ Done | Full pack import/export |
| 6 | Editable Draft Email | P1 | ✅ Done | textarea + auto-save |
| 7 | Copy as Rich Text | P1 | ✅ Done | ClipboardItem HTML |
| 8 | Wire Observation Checklists | P1 | ✅ Done | Inline variable substitution |
| 9 | IOC Quick-Add from Fields | P1 | ✅ Done | Regex IP/Domain detection |
| 10 | Dashboard Activity Feed | P1 | ✅ Done | 60s auto-refresh |
| 11 | IP Reputation Lookup | P2 | ✅ Done | Uses Edge function + Global Cache |
| 12 | Investigation Cloning | P2 | ✅ Done | Clones metadata and rule |
| 13 | SLA Timer / Pending Tracker | P2 | ✅ Done | Visual countdown in banner |
| 14 | Shift Handoff Report | P2 | ✅ Done | Client-side MD generation |
| 15 | Cross-Investigation IOC Correlation | P2 | ✅ Done | Multi-case badge |
| 16 | Analytics Dashboard | P2 | ✅ Done | 4 recharts charts |
| 17 | AI Observation Writer | P3 | ✅ Done | Supports OpenAI, Anthropic, Gemini |
| 18 | SIEM API Ingestion | P3 | 🔒 Later | — |
| 19 | Multi-User / Team Support | P3 | 🔒 Later | — |
| 20 | File Attachments | P3 | 🔒 Later | — |
| 21 | SIEM Query Pivot Generator | P4 | 🔒 Later | Auto-generate KQL/SPL |
| 22 | Webhook SOAR Actions | P4 | 🔒 Later | Isolate hosts, block IPs |
| 23 | MITRE ATT&CK Heatmap | P4 | 🔒 Later | Map alerts to tactics |
| 24 | Phishing Header Analyzer | P4 | 🔒 Later | Extract EML headers |
| 25 | FP Tuning Feedback Loop | P4 | 🔒 Later | Send tuning feedback |

---

## Remaining P0 Work (All Done!)

### Feature 2 — Migrate `alertRules.ts` → DB (✅ Done)
- Written `scripts/seed-alert-templates.ts` to upsert all ~30 rules into `alert_templates`
- Updated `useAlertTemplates.ts` to remove hardcoded merge with ALERT_RULES
- Updated `InvestigationDetailPage.tsx` to use async hook instead of sync import
- Renamed `alertRules.ts` → `alertRulesDefaultSeed.ts`

### Feature 3 — Template Builder UI (✅ Done)
- `TemplateEditorPage.tsx` — tabbed editor (Basic Info / Fields / Observations / Email)
- `FieldSchemaBuilder.tsx` — drag-and-drop with `@dnd-kit/core`
- `ObservationBuilder.tsx` — observation template editor with `{{variable}}` highlighting
- `EmailTemplateEditor.tsx` — textarea with variable insertion toolbar + preview pane
- Added routes `/templates/new` and `/templates/:id/edit` to `App.tsx`

### Feature 4 — First-Run Setup Wizard (✅ Done)
- `SetupWizard.tsx` — 5-step full-screen modal
- "Workspace Type" option added to switch between Individual Analyst vs SOC Organization
- Triggered automatically in `App.tsx` when `user_settings.setup_completed` is false

---

## Open-Source Readiness Checklist

- [x] Zero hardcoded company names in UI/email templates
- [x] All templates in DB (TypeScript file renamed to seed only)
- [x] Setup wizard for new users
- [x] Template Import/Export
- [ ] README.md with setup instructions
- [ ] LICENSE file
- [ ] .env.example documented
- [ ] Demo mode

---

## Recent Implementations (2026-06-08)

### 🧠 Feature 11: IP Reputation Lookup
Added an inline IP lookup capability directly within investigations. 

**Database Changes:**
- Added `enrichment_cache` table via `supabase/migrations/20260608_enrichment_cache.sql`. 
- Global caching enabled for all users.

**Backend Changes:**
- Built `supabase/functions/enrich-ip/index.ts` edge function.
- Automatically handles fetching from `ipinfo.io` and `api.abuseipdb.com`.
- **15-Day Cache logic**: Returns globally cached data instantly if it is less than 15 days old. If not, it pulls fresh data and updates the `enrichment_cache`.

**Frontend Changes:**
- Added `src/hooks/useEnrichment.ts` containing the `useEnrichIP` React Query hook.
- Added a `🔍 Lookup` button next to any IP address in `InvestigationDetailPage.tsx`.
- Displays an interactive popup modal with ISP, Geo, VPN/Proxy usage, Abuse Confidence Score, and an "Auto-fill Geo/ISP" action to auto-populate the investigation fields.

> [!WARNING]
> Since we added a new Supabase Edge function and database migration, you must run `supabase db push` and `supabase functions deploy enrich-ip` on your backend.

### ✨ Feature 17: AI-Assisted Observation Writer
Added the ability to instantly draft a structured, professional list of observations using AI.

**Database Changes:**
- Added `20260608_user_settings_llms.sql` to add `openai_api_key`, `anthropic_api_key`, `gemini_api_key`, and `preferred_llm` columns to the `user_settings` table.

**Backend Changes:**
- Built `supabase/functions/generate-observations/index.ts` edge function.
- Dynamically routes requests to OpenAI (`gpt-4o-mini`), Anthropic (`claude-3.5-sonnet`), or Google Gemini (`gemini-1.5-flash`) based on user preference.

**Frontend Changes:**
- Added an "AI Providers" section to the **Settings** page so analysts can securely input their own keys.
- Added a `✨ Draft with AI` button to the Observations panel in `InvestigationDetailPage.tsx`.
- Automatically feeds the parsed `fieldData` and `template` context into the prompt to generate 3-5 concise, numbered observations.

> [!WARNING]
> You must run `supabase db push` (or execute the new SQL migration) and run `supabase functions deploy generate-observations` to use the new AI writing feature!

### 🧹 Auto-Resetting Demo Account
Added the ability to securely host a public demo without polluting the database.

**Database Changes:**
- Added `20260608000004_demo_account_reset.sql` to enable `pg_cron` and create a `SECURITY DEFINER` stored procedure.
- Created a scheduled job that runs daily at midnight UTC to find the `test@test.com` user and wipe all of their cases and clients.
- It also resets their `user_settings` (wiping API keys and resetting the team name) but deliberately leaves `alert_templates` intact so the demo stays functional without triggering the Setup Wizard.

**Frontend Changes:**
- None! This is handled entirely at the database layer via PostgreSQL scheduling.
