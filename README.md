# SOC Companion

An open-source workspace for Security Operations Center (SOC) analysts to manage investigations, standardize observations, track IOCs, and generate perfectly formatted email handoffs.

Built for both individual analysts and full SOC/MSSP teams.

## ✨ Features

- **Investigation Workflows:** Standardized templates for Azure AD, SentinelOne, SIEM alerts, and more.
- **Observation Checklists:** Dynamically generated checklists with `{{variable}}` substitution based on investigation fields.
- **IOC Quick-Add:** Automatically scan your notes for IPs, domains, and hashes. Defang and log them with a single click.
- **SLA Tracker:** Move investigations into "Pending Response", track who you're waiting on, and monitor deadlines directly on your dashboard.
- **Shift Handoff Reports:** Automatically generate a Markdown summary of the last 8/12/24 hours of your shift.
- **Template Import/Export:** Export your team's alert schemas as a `.soc-templates.json` bundle to share with others.
- **Custom Branding:** Completely white-labeled. Configure your team name, SOC email, and custom sign-offs via the UI.

---

## 🌐 Try the Live Demo

You can try out SOC Companion without installing anything! 

**Demo URL:** `https://soc-companion.vercel.app` (or your hosted URL)  
**Email:** `test@test.com`  
**Password:** `testpassword123`

> [!NOTE]  
> The demo account is fully functional, but please do not save any sensitive PII or API keys. To keep the database clean, **all cases, clients, and settings for the demo account are securely wiped every 24 hours.**

---

## 🚀 Quick Start (Local Setup)

This project uses **React (Vite)** on the frontend and **Supabase** for the backend.

### 1. Set up Supabase
1. Create a new project on [Supabase](https://supabase.com).
2. Install the [Supabase CLI](https://supabase.com/docs/guides/cli).
3. Link your local project to your remote Supabase project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
4. Push the database schema and migrations:
   ```bash
   supabase db push
   ```
5. Deploy the edge functions for IP reputation and AI generation:
   ```bash
   supabase functions deploy enrich-ip
   supabase functions deploy generate-observations
   ```
6. If you want to use the IP reputation features, set the API keys as edge function secrets:
   ```bash
   supabase secrets set IPINFO_API_KEY=your-key
   supabase secrets set ABUSEIPDB_API_KEY=your-key
   ```

### 2. Set up the Frontend
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/soc-companion.git
   cd soc-companion
   ```
2. Copy the example environment file and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
   *(Find your URL and Anon Key in Supabase under Project Settings -> API)*
3. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```

### 3. First Run
When you create your first account and log in, the **First-Run Setup Wizard** will guide you through:
- Setting your Workspace/Team Name.
- Configuring your analyst display name and email.
- Importing the default library of 89 SOC alert templates.

---

## 🛠 Architecture & Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS
- **Routing:** React Router v6
- **State & Data Fetching:** TanStack React Query (`@tanstack/react-query`), Zustand
- **Backend/Database:** Supabase (PostgreSQL, GoTrue Auth)
- **Icons:** Lucide React

## 📄 License
This project is licensed under the [MIT License](LICENSE).
