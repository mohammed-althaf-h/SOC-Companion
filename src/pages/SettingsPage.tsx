import { useState, useEffect } from 'react'
import { Save, Shield, User, Mail, Key, Eye, EyeOff, CheckCircle2, Sparkles } from 'lucide-react'
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { data: settings, isLoading } = useUserSettings()
  const { mutateAsync: updateSettings, isPending } = useUpdateUserSettings()

  const [teamName, setTeamName] = useState('')
  const [socEmail, setSocEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [signOffTemplate, setSignOffTemplate] = useState('')
  const [abuseIpdbKey, setAbuseIpdbKey] = useState('')
  const [ipinfoKey, setIpinfoKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [preferredLlm, setPreferredLlm] = useState('openai')

  const [showAbuseKey, setShowAbuseKey] = useState(false)
  const [showIpinfoKey, setShowIpinfoKey] = useState(false)
  const [showOpenaiKey, setShowOpenaiKey] = useState(false)
  const [showAnthropicKey, setShowAnthropicKey] = useState(false)
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setTeamName(settings.team_name)
      setSocEmail(settings.soc_email)
      setDisplayName(settings.analyst_display_name ?? '')
      setSignOffTemplate(settings.sign_off_template)
      setAbuseIpdbKey(settings.abuseipdb_api_key ?? '')
      setIpinfoKey(settings.ipinfo_api_key ?? '')
      setOpenaiKey(settings.openai_api_key ?? '')
      setAnthropicKey(settings.anthropic_api_key ?? '')
      setGeminiKey(settings.gemini_api_key ?? '')
      setPreferredLlm(settings.preferred_llm ?? 'openai')
    }
  }, [settings])

  const handleSaveProfile = async () => {
    try {
      await updateSettings({
        team_name: teamName,
        soc_email: socEmail,
        analyst_display_name: displayName || null,
        sign_off_template: signOffTemplate,
      })
      setSaved(true)
      toast.success('Team profile saved')
      setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      toast.error('Failed to save settings: ' + e.message)
    }
  }

  const handleSaveApiKeys = async () => {
    try {
      await updateSettings({
        abuseipdb_api_key: abuseIpdbKey || null,
        ipinfo_api_key: ipinfoKey || null,
        openai_api_key: openaiKey || null,
        anthropic_api_key: anthropicKey || null,
        gemini_api_key: geminiKey || null,
        preferred_llm: preferredLlm,
      })
      toast.success('API keys saved')
    } catch (e: any) {
      toast.error('Failed to save API keys: ' + e.message)
    }
  }

  const signOffPreview = signOffTemplate
    .replace(/\{\{analyst_name\}\}/g, displayName || 'Your Name')
    .replace(/\{\{team_name\}\}/g, teamName || 'Your Team')

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card h-32 skeleton" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your SOC team identity, email branding, and integrations.
        </p>
      </div>

      {/* ── Team Profile ───────────────────────────────────────────── */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Team Profile</h2>
            <p className="text-xs text-muted-foreground">
              Used in every generated email draft and exported report.
            </p>
          </div>
        </div>

        <hr className="border-surface-border" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Team / SOC Name
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Acme-CSIRT"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/50 outline-none transition-colors"
            />
            <p className="text-[11px] text-muted-foreground">
              Replaces <code className="bg-surface px-1 rounded">{'{{team_name}}'}</code> in email templates
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              SOC Email Address
            </label>
            <input
              type="email"
              value={socEmail}
              onChange={(e) => setSocEmail(e.target.value)}
              placeholder="e.g. soc@yourcompany.com"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/50 outline-none transition-colors"
            />
            <p className="text-[11px] text-muted-foreground">
              Replaces <code className="bg-surface px-1 rounded">{'{{soc_email}}'}</code> in email templates
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Analyst Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Jane Smith"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/50 outline-none transition-colors"
            />
            <p className="text-[11px] text-muted-foreground">
              Overrides your account email in the email sign-off
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Sign-off Template
            </label>
            <textarea
              value={signOffTemplate}
              onChange={(e) => setSignOffTemplate(e.target.value)}
              rows={3}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:border-primary/50 outline-none resize-none transition-colors"
            />
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-surface rounded-lg border border-surface-border p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Sign-off Preview</p>
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{signOffPreview}</pre>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveProfile}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : isPending ? 'Saving…' : 'Save Team Profile'}
          </button>
        </div>
      </div>

      {/* ── API Keys ───────────────────────────────────────────────── */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Key className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">API Keys — IP Reputation</h2>
            <p className="text-xs text-muted-foreground">
              Used for inline IP / domain enrichment lookups on investigations. Keys are stored encrypted.
            </p>
          </div>
        </div>

        <hr className="border-surface-border" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              AbuseIPDB API Key
            </label>
            <div className="relative">
              <input
                type={showAbuseKey ? 'text' : 'password'}
                value={abuseIpdbKey}
                onChange={(e) => setAbuseIpdbKey(e.target.value)}
                placeholder="Paste your AbuseIPDB key…"
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 pr-10 text-sm text-foreground focus:border-primary/50 outline-none transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowAbuseKey(!showAbuseKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showAbuseKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Get a free key at{' '}
              <a href="https://www.abuseipdb.com/account/api" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                abuseipdb.com
              </a>
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              ipinfo.io API Key
            </label>
            <div className="relative">
              <input
                type={showIpinfoKey ? 'text' : 'password'}
                value={ipinfoKey}
                onChange={(e) => setIpinfoKey(e.target.value)}
                placeholder="Paste your ipinfo.io key…"
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 pr-10 text-sm text-foreground focus:border-primary/50 outline-none transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowIpinfoKey(!showIpinfoKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showIpinfoKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Get a free key at{' '}
              <a href="https://ipinfo.io/account/token" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                ipinfo.io
              </a>
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveApiKeys}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            Save API Keys
          </button>
        </div>
      </div>
      {/* ── AI Providers ─────────────────────────────────────────────── */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Providers — Observation Writer</h2>
            <p className="text-xs text-muted-foreground">
              Configure your LLM provider for the AI-Assisted Observation Writer feature.
            </p>
          </div>
        </div>

        <hr className="border-surface-border" />

        <div className="space-y-4">
          <div className="space-y-1.5 max-w-xs">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Active LLM Provider
            </label>
            <select
              value={preferredLlm}
              onChange={(e) => setPreferredLlm(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-indigo-500/50 outline-none transition-colors"
            >
              <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
              <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
              <option value="gemini">Google (Gemini 1.5 Flash / Pro)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  type={showOpenaiKey ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 pr-10 text-sm text-foreground focus:border-indigo-500/50 outline-none transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Anthropic API Key
              </label>
              <div className="relative">
                <input
                  type={showAnthropicKey ? 'text' : 'password'}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 pr-10 text-sm text-foreground focus:border-indigo-500/50 outline-none transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showAnthropicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Google Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 pr-10 text-sm text-foreground focus:border-indigo-500/50 outline-none transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveApiKeys}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            Save API Keys
          </button>
        </div>
      </div>

      {/* ── Security Info ──────────────────────────────────────────── */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Security Guards</h2>
            <p className="text-xs text-muted-foreground">
              Platform-level protections that are always active.
            </p>
          </div>
        </div>

        <hr className="border-surface-border" />

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="relative flex h-3 w-3 mt-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div>
              <p className="font-medium text-emerald-400">Cross-Contamination Protection Active</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                All text inputs are scanned for other clients' short codes. Detected references block saves and show a warning.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 bg-surface rounded border border-surface-border">
              <div className="text-muted-foreground mb-1">IP Address</div>
              <div className="text-amber-300">192.168.1.1 → 192.168.1[.]1</div>
            </div>
            <div className="p-3 bg-surface rounded border border-surface-border">
              <div className="text-muted-foreground mb-1">URL</div>
              <div className="text-amber-300">https://evil.com → hxxps[://]evil[.]com</div>
            </div>
            <div className="p-3 bg-surface rounded border border-surface-border">
              <div className="text-muted-foreground mb-1">Email</div>
              <div className="text-amber-300">bad@actor.com → bad[@]actor[.]com</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
