## Finish the Investigation Workspace

Build the two remaining routes that turn the app into a working SOC investigation tool, with hard guardrails against mixing client details.

### 1. `/_authenticated/investigations` — List view
- Table of all investigations: Client badge (color + short code), Alert ref, Playbook, Severity, Status, Opened at.
- Filters: Client (dropdown), Status (New / In Progress / Closed), Severity, free-text search on alert_ref/title.
- **"New Investigation" button** → opens a 2-step modal:
  1. **Pick client** (required, large client cards with color + short code — no typing).
  2. **Pick playbook** (filtered list, shows MITRE TTPs + default severity).
  - On submit: creates row with `client_id`, `playbook_id`, copies `fields_schema` and `steps` into the investigation, navigates to detail page.

### 2. `/_authenticated/investigations/$id` — Detail / workspace
Persistent top banner with the **client badge in full color** (impossible to miss which client you're on). Layout:

- **Header**: Client badge, Alert ref, Title, Severity, Status dropdown, "Close investigation" button.
- **Playbook steps panel** (left): checklist of steps from the playbook, each can be marked done with a timestamp auto-added to timeline.
- **Structured fields panel** (center): renders inputs from `fields_schema` (Source IP, Dest IP, User, Hostname, MITRE TTP, etc.) — no free-form "notes" blob for the main investigation data.
- **Cross-contamination guard**: on every save, scan all text fields for **other clients' short codes** (e.g. typing "ACME-" while working on "BETA"). If detected → block save + show warning "This looks like it belongs to ACME. Switch client or remove the reference."
- **IOCs sub-table**: add rows (type: IP/Domain/Hash/URL/Email, value, source, notes). Stored in `iocs` table scoped to investigation.
- **Timeline panel** (right): auto-timestamped events (created, status changed, step completed, IOC added) + manual entries.
- **Verdict + summary** at bottom: True Positive / False Positive / Benign / Inconclusive + summary text.
- **Export report** button: generates a Markdown report (client header, alert details, fields, IOCs table, timeline, verdict) → copy to clipboard + download `.md`. PDF export deferred.

### 3. Small supporting work
- Add `Investigations` link to sidebar nav in `AppShell`.
- Update dashboard to link each open investigation card to its detail page.
- Add toast feedback (sonner) for save/guard/export actions.

### Out of scope (this round)
- PDF export (Markdown only for now).
- Attachments/file upload.
- Team sharing / multi-user assignment.
- SIEM API ingestion.

### Tech notes
- Both routes under `_authenticated/`, use `useSuspenseQuery` + `ensureQueryData` loader pattern.
- Mutations via `createServerFn` with `requireSupabaseAuth`; invalidate `["investigations"]` and `["investigations", id]` on success.
- Cross-contamination check runs **client-side before mutation** (fast UX) and again **server-side in the createServerFn handler** (authoritative) — fetches user's other clients' short_codes and regex-matches them against the payload.

After this lands you'll have an end-to-end flow: pick client → pick playbook → fill structured fields with anti-mixup guard → export clean per-client report.
