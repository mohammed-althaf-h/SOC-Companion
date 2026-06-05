# Lovable AI Prompt: SOC Investigation & Incident Response Tool
## Project Brief for Lovable

---

## 1. PROJECT OVERVIEW

Build a **SOC Analyst Investigation Tool** for a Managed Security Service Provider (MSSP) team.

The analyst handles multiple clients simultaneously and currently drafts all investigation notes in a single OneNote page. This causes **CIA (Confidentiality, Integrity, Availability) breaches** when client-specific details get mixed across cases. The tool must enforce strict per-client isolation and streamline the drafting of investigation emails sent to client contacts after alert triage.

**Core value proposition:** Replace a single shared OneNote page with a structured, client-isolated investigation workspace that auto-generates professional draft emails per alert type.

---

## 2. TECH STACK

- **Frontend:** React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend/Database:** Supabase (auth + Postgres)
- **Routing:** React Router
- **State:** Zustand or React Context
- **Rich text (optional):** TipTap or simple textarea with markdown support

---

## 3. DATABASE SCHEMA (Supabase)

```sql
-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_code TEXT NOT NULL UNIQUE,  -- e.g. "ECI", "READYCAP"
  contact_email TEXT,
  soc_email TEXT DEFAULT 'soc@eci.com',
  spoc_name TEXT,                   -- Single Point of Contact
  color_tag TEXT,                   -- hex color for UI badge
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert Rules catalog
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,        -- e.g. "Azure AD High Risk Sign-in"
  category TEXT NOT NULL,           -- "Identity", "Endpoint", "Email", "Network"
  description TEXT,
  draft_template TEXT,              -- Handlebars-style template
  fields JSONB                      -- dynamic field definitions
);

-- Investigations
CREATE TABLE investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  alert_rule_id UUID REFERENCES alert_rules(id),
  case_number TEXT,                 -- e.g. CS2080106
  title TEXT,
  status TEXT DEFAULT 'open',       -- open | pending_response | closed
  severity TEXT DEFAULT 'medium',   -- low | medium | high | critical
  triggered_at TIMESTAMPTZ,
  assigned_analyst TEXT,
  field_data JSONB,                 -- dynamic fields per alert type
  observations TEXT[],              -- array of observation bullet points
  next_steps TEXT,
  verdict TEXT,                     -- benign | suspicious | malicious | false_positive
  draft_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
```

---

## 4. PAGES & ROUTES

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Overview stats, recent cases, quick-open |
| `/clients` | Client List | All clients with case counts |
| `/clients/:id` | Client Workspace | All investigations for ONE client only |
| `/investigations/new` | New Investigation | Create investigation, must select client first |
| `/investigations/:id` | Investigation Detail | Full form + draft email generator |
| `/rules` | Alert Rules Library | Browse/edit templates |
| `/settings` | Settings | Analyst profile, SOC email |

**Critical UX rule:** When inside a Client Workspace (`/clients/:id`), ALL data shown must be filtered to that client. No cross-client data must ever appear in the same view.

---

## 5. KEY FEATURES

### 5.1 Client Isolation (Most Important)
- Each client has a **color-coded badge** (e.g. red, blue, green) always visible in the header when working inside that client's workspace.
- A persistent **"You are working on: [CLIENT NAME]"** banner is shown at the top of every investigation form in a distinct color matching the client badge.
- The new investigation form **requires client selection as Step 1** before any fields appear.
- Search and filter views always show the client badge next to each case row.

### 5.2 Alert Rule Templates
Pre-populate the tool with templates for these alert types (derived from real investigation data):

**Identity & Access (IAM)**
- Azure Active Directory High Risk Sign-in / Heuristic
- Impossible Travel Alert
- Potential Brute Force Attack Detected
- Potential Duo MFA Brute Force Attack
- Potential Microsoft 365 MFA Brute Force Attack (Agent)
- Password Spray Involving One User
- Account Added to Privileged or Sensitive Security Group
- Suspicious Account Changes (Password Never Expires)

**Endpoint**
- Regsvr32.exe Suspicious Command Execution
- PowerShell Policy Bypass Execution Detection
- Possible PowerShell Session Creation and Use
- Anomalous PowerShell Usage from Temp Location
- Unusual Network Activity from a Windows System Binary
- Detection of Windows Netsh WLAN Profile Enumeration
- Disable Windows Firewall Rules via Netsh
- Detection of Persistence via New Scheduled Task
- Possible Lateral Movement via Scheduled Tasks (schtasks.exe)
- Lateral Movement via Startup Folder
- Suspicious Browser Extension Load Activity
- Possible Infostealer Malware Detected
- Malware Detected (Defender / SentinelOne)

**Email & Cloud (M365)**
- Unusual Activity Detected by Microsoft 365 Defender
- Potentially Malicious URL Click Detected
- Exfiltration Incident Involving One User (DLP)
- Unusual Network Activity

Each template has dynamic fields the analyst fills in, and the system generates the draft email.

### 5.3 Dynamic Investigation Form
When an alert rule is selected, the form renders the relevant fields. Example fields per type:

**Azure AD High Risk Sign-in fields:**
- Affected User (name + email)
- Source IP (defanged format auto-applied, e.g. `117.248.154[.]109`)
- Country / Location
- Device Type (Windows10, macOS, etc.)
- Device Registration Status (Registered / Non-Registered)
- Application Accessed
- CA Policy Applied (Yes/No + policy name)
- MFA Method (DUO push, TOTP, etc.)
- MFA Result (Success / Failure)
- ISP of Source IP
- Previous sign-ins from same IP? (Yes/No)
- Verdict dropdown (Expected / Suspicious / Malicious)
- Observations (multi-line, supports bullet points)

**Malicious URL Click fields:**
- Affected User (name + email)
- Email Subject
- Sender Email
- URL (defanged)
- Sandbox Result (Malicious / Benign / Redirects to...)
- Destination Domain
- Credential Input Detected? (Yes/No)
- User Contacted? (Yes/No/Call Not Connected)
- Password Reset Required? (Yes/No)
- IOCs Blocked? (Yes/No)

**Brute Force / Password Spray fields:**
- Target Account(s)
- Source IPs (list)
- ISPs
- Logon Type
- Number of Failed Attempts
- Timeframe
- Any Successful Logins?
- Geo-location(s)

**Endpoint (PowerShell/Regsvr32/Malware) fields:**
- Host Name
- User on Host
- Process Name
- Parent Process
- Command Line (text area)
- File Path
- File Hash
- SentinelOne Status
- Threat Classification (Malware / PUA / Clean)
- Network Connections Observed? (Yes/No)

**Exfiltration / DLP fields:**
- Affected User (name + email)
- DLP Policy Triggered
- File/Email Subject
- Sensitive Data Type (PII / PHI / Financial / IP)
- Destination (external email / cloud upload)
- Recipient(s)
- Action Taken by Defender

### 5.4 Draft Email Generator
After fields are filled, a **"Generate Draft"** button auto-builds the email from a template. The output is editable before copying.

**Standard email structure:**
```
Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]
{summary_auto_built_from_rule_and_user}

[OBSERVATIONS]
{numbered_observations_from_field_data}

[NEXT STEPS]
{next_steps_based_on_verdict}

I'll set this incident to {resolved/pending}, but please don't hesitate to 
reach us if you have further questions or concerns to {soc_email}

Regards,
{analyst_name}
ECI-SOC
```

**Verdict-driven Next Steps logic:**
- **Benign/Expected** → "Since [activity] showed no signs of suspicious activity and [CA policy/MFA] was successfully applied, no further actions are pending from the SOC team. We will proceed with case closure."
- **VPN Detected (Benign)** → auto-appends VPN advisory note: "Please Note: The usage of 3rd party VPN leads to several security concerns such as data breaches and identity theft..."
- **Suspicious — Awaiting Confirmation** → "Could you please confirm if [user] is currently [traveling/expecting this activity]? We tried to contact the user/SPOC; however, the call was not connected."
- **Malicious** → "We have blocked all associated IOCs on our security devices and initiated a SentinelOne scan on the host. We request the user to immediately change their account password."
- **CA Policy / MFA Group Issue** → auto-suggests: "@[SPOC] Could you please review the [group name] and remove all users who do not have a valid business need to be exempt from MFA?"

### 5.5 IP & IOC Defanging
All IP addresses and URLs entered are **automatically defanged** on input:
- `192.168.1.1` → `192.168.1[.]1`
- `https://malicious.com` → `hxxps[://]malicious[.]com`
- Emails in observations → `user[@]domain[.]com`

Toggle to show/hide defanged format. Raw format stored in DB, defanged shown in UI and draft.

### 5.6 Quick Observations Builder
Instead of free-typing all observations, provide a **checklist of common observation items** per alert type that the analyst checks off and fills values for, which auto-generates the numbered observation list:

Example for Azure AD sign-in:
- [ ] Successful sign-in observed from IP `___` using `___` device
- [ ] IP reputation analyzed: `Clean / Malicious / VPN` belonging to ISP `___` (`Country`)
- [ ] CA policy `___` was applied `successfully / unsuccessfully`
- [ ] MFA via `DUO push / TOTP` — result: `success / failure`
- [ ] Sign-in history reviewed (past 30 days): `nothing abnormal / suspicious activity noted`
- [ ] User is member of CA bypass group: `Yes (name: ___) / No`

### 5.7 Case Timeline
Each investigation shows a simple timeline:
- Alert triggered → Investigation started → Observations added → Draft generated → Sent to client → Closed

### 5.8 Search & Filter
Global search across investigations with filters:
- Filter by: Client | Alert Rule | Severity | Status | Date range | Analyst
- Results always show client badge color to prevent confusion
- Cannot bulk-edit across clients

---

## 6. UI/UX REQUIREMENTS

### Visual Design
- **Dark theme** (security tooling aesthetic) — dark navy/slate background
- **Monospace font** for IP addresses, hashes, command lines
- **Color-coded client badges** — each client gets a unique accent color used consistently throughout
- Alert severity colors: Critical = red, High = orange, Medium = yellow, Low = blue

### Client Context Header
When inside any client workspace or investigation, show a persistent header bar:
```
[ 🔒 CLIENT: READY CAPITAL ]  — Severity: HIGH  — Case: CS2099087
```
This bar should be impossible to miss — high contrast, bold, always at the top.

### Navigation
- Sidebar with: Dashboard, Clients, New Investigation, Alert Rules, Settings
- Breadcrumb: Dashboard > Clients > Ready Capital > CS2099087
- Clicking "New Investigation" always starts with client picker as Step 1

### Mobile
- Responsive but desktop-first (analysts work on laptops)

---

## 7. SAMPLE DATA TO SEED

Seed these clients:
```json
[
  { "name": "Ready Capital", "short_code": "READYCAP", "color_tag": "#3B82F6" },
  { "name": "S3 Partners", "short_code": "S3P", "color_tag": "#10B981" },
  { "name": "Arthur Ventures", "short_code": "ARTHUR", "color_tag": "#F59E0B" },
  { "name": "Hedosophia", "short_code": "HEDO", "color_tag": "#8B5CF6" },
  { "name": "SCS Financial", "short_code": "SCS", "color_tag": "#EF4444" },
  { "name": "Matrix LP", "short_code": "MATRIX", "color_tag": "#EC4899" },
  { "name": "Fidelis Capital", "short_code": "FIDELIS", "color_tag": "#06B6D4" },
  { "name": "Control Solutions", "short_code": "CSI", "color_tag": "#84CC16" }
]
```

Seed one sample investigation per major alert type so templates can be tested.

---

## 8. STRETCH FEATURES (Phase 2)

- **Duplicate detection:** Warn if same user + same alert rule + same IP was already investigated for the same client in the past 30 days.
- **IOC Registry:** Save all IPs/hashes/domains per client; auto-flag if same IOC appears in a new alert for the same client.
- **Draft Version History:** Keep previous drafts when analyst regenerates.
- **Ticket Number Auto-Increment:** Auto-assign CS numbers per client (CS-[CLIENT]-[YYYY]-[NNNN]).
- **Analytics dashboard:** Most frequent alert types per client, average time to closure.
- **Shift handoff notes:** A text area per client for shift handover context, visible to the next analyst.

---

## 9. WHAT THIS TOOL MUST NEVER DO

- **Never show Client A's data on Client B's investigation form**
- **Never allow copy-paste of a draft without client watermark review** (show which client's draft is in the clipboard)
- **Never default to a previously used client** when creating a new investigation — client must always be explicitly selected

---

## 10. FIRST PROMPT TO SEND TO LOVABLE

> Build a SOC Analyst Incident Response Tool for an MSSP team using React, TypeScript, Tailwind CSS, shadcn/ui, and Supabase.
>
> The core problem: analysts manage alerts for multiple clients simultaneously and accidentally mix client details when drafting investigation emails, causing confidentiality breaches.
>
> **Start with these screens:**
> 1. **Dashboard** — shows open investigations grouped by client, each with a distinct color badge
> 2. **New Investigation wizard** — Step 1: select client (required, shown as large colored cards). Step 2: select alert rule type from a categorized list. Step 3: fill dynamic fields relevant to that alert type. Step 4: auto-generate draft email.
> 3. **Client Workspace** — shows all cases for ONE client, with a persistent colored banner at the top reading "Working in: [CLIENT NAME]" to prevent cross-contamination.
>
> Always show the client's color-coded badge prominently on every page where an investigation is open. Use a dark security dashboard aesthetic. Include Supabase integration with the schema provided.
>
> Seed the app with 8 sample clients and alert rule templates for: Azure AD High Risk Sign-in, Impossible Travel, Brute Force, Malicious URL Click, Exfiltration/DLP, PowerShell Execution, and Malware Detected.

---

*This document was generated from real SOC investigation drafts. All client names, usernames, and IPs in this document are for reference only and should be replaced with placeholder/seed data in the built application.*
