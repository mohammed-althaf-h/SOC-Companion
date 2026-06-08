import { useState, useEffect } from 'react'
import { ShieldCheck, ArrowRight, CheckCircle2, User, Database, Building2 } from 'lucide-react'
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings'
import { useClients } from '@/hooks/useClients'
import { seedDefaultTemplates } from '@/lib/seedTemplates'
import { supabase } from '@/lib/supabase'

export default function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const { data: settings, isLoading: settingsLoading } = useUserSettings()
  const { mutateAsync: updateSettings } = useUpdateUserSettings()
  const { data: clients, isLoading: clientsLoading } = useClients()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 2 Form
  const [workspaceType, setWorkspaceType] = useState<'individual' | 'organization'>('organization')

  // Step 3 Form
  const [teamName, setTeamName] = useState('My SOC Team')
  const [socEmail, setSocEmail] = useState('soc@example.com')
  const [analystName, setAnalystName] = useState('')

  // Step 4 Form
  const [importTemplates, setImportTemplates] = useState(true)

  // Step 5 Form
  const [clientName, setClientName] = useState('')
  const [clientShortCode, setClientShortCode] = useState('')

  useEffect(() => {
    if (settings) {
      setTeamName(settings.team_name)
      setSocEmail(settings.soc_email)
      setAnalystName(settings.analyst_display_name || '')
    }
  }, [settings])

  if (settingsLoading || clientsLoading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // If already setup, just complete
  useEffect(() => {
    if (settings?.setup_completed) {
      onComplete()
    }
  }, [settings?.setup_completed]) // eslint-disable-line react-hooks/exhaustive-deps

  if (settings?.setup_completed) {
    return null
  }

  const handleNext = () => setStep(s => s + 1)
  const handlePrev = () => setStep(s => s - 1)

  const handleComplete = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Update settings
      await updateSettings({
        team_name: teamName,
        soc_email: socEmail,
        analyst_display_name: analystName,
        setup_completed: true,
      })

      // 2. Import templates if selected
      if (importTemplates) {
        await seedDefaultTemplates()
      }

      // 3. Create initial client if provided
      if (clientName && clientShortCode) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('clients').insert({
            user_id: user.id,
            name: clientName,
            short_code: clientShortCode.toUpperCase(),
            color_tag: 'bg-blue-500',
            associated_domains: [],
            soc_email: socEmail,
          })
        }
      }

      onComplete()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-12 lg:py-24">
          <div className="mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to SOC Companion</h1>
            <p className="text-muted-foreground">Let's set up your workspace in just a few steps.</p>
          </div>

          <div className="flex gap-2 mb-12">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full ${s <= step ? 'bg-primary' : 'bg-surface-border'}`} />
              </div>
            ))}
          </div>

          <div className="bg-surface border border-surface-border rounded-2xl p-6 md:p-8 min-h-[400px] flex flex-col">
            {error && (
              <div className="bg-red-500/10 text-red-500 p-4 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="flex-1 flex flex-col justify-center items-center text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Your Investigation Workspace</h2>
                <p className="text-muted-foreground mb-8">
                  SOC Companion is designed to streamline your alerts, standardize your notes, and generate perfect email handoffs. We'll need a few details to brand your workspace.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="flex-1 space-y-6">
                <h2 className="text-2xl font-semibold">How are you using SOC Companion?</h2>
                <p className="text-sm text-muted-foreground">This helps us tailor your workspace setup.</p>
                
                <div className="space-y-4 mt-6">
                  <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-colors ${workspaceType === 'individual' ? 'border-primary bg-primary/5' : 'border-surface-border hover:border-primary/50'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${workspaceType === 'individual' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                        {workspaceType === 'individual' && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Individual Analyst</div>
                        <div className="text-sm text-muted-foreground mt-1">I work independently or I'm evaluating this tool for myself.</div>
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      className="hidden" 
                      checked={workspaceType === 'individual'} 
                      onChange={() => {
                        setWorkspaceType('individual')
                        if (teamName === 'My SOC Team') setTeamName('Independent Analyst')
                      }} 
                    />
                  </label>
                  
                  <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-colors ${workspaceType === 'organization' ? 'border-primary bg-primary/5' : 'border-surface-border hover:border-primary/50'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${workspaceType === 'organization' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                        {workspaceType === 'organization' && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">SOC Organization</div>
                        <div className="text-sm text-muted-foreground mt-1">I'm setting this up for a team or MSSP.</div>
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      className="hidden" 
                      checked={workspaceType === 'organization'} 
                      onChange={() => {
                        setWorkspaceType('organization')
                        if (teamName === 'Independent Analyst') setTeamName('My SOC Team')
                      }} 
                    />
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex-1 space-y-6">
                <h2 className="text-2xl font-semibold">{workspaceType === 'individual' ? 'Your Details' : 'Team Profile'}</h2>
                <p className="text-sm text-muted-foreground">This information will be used to auto-generate sign-offs and email templates.</p>
                {workspaceType === 'individual' && (
                  <p className="text-xs bg-primary/10 text-primary p-3 rounded-lg">
                    Since you are using this as an individual analyst, you can enter your company's name or leave it as "Independent Analyst".
                  </p>
                )}
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{workspaceType === 'individual' ? 'Workspace / Team Name' : 'Team Name'}</label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      className="w-full bg-background border border-surface-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                      placeholder="e.g. Acme Corp CSIRT"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{workspaceType === 'individual' ? 'Your Email' : 'SOC Email'}</label>
                    <input
                      type="email"
                      value={socEmail}
                      onChange={e => setSocEmail(e.target.value)}
                      className="w-full bg-background border border-surface-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                      placeholder="e.g. soc@acme.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Display Name {workspaceType !== 'individual' && '(Optional)'}</label>
                    <input
                      type="text"
                      value={analystName}
                      onChange={e => setAnalystName(e.target.value)}
                      className="w-full bg-background border border-surface-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex-1 space-y-6">
                <h2 className="text-2xl font-semibold">Alert Templates</h2>
                <p className="text-sm text-muted-foreground">SOC Companion comes with 89 pre-configured SIEM alert templates. Do you want to import them?</p>
                
                <div className="space-y-4 mt-6">
                  <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-colors ${importTemplates ? 'border-primary bg-primary/5' : 'border-surface-border hover:border-primary/50'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${importTemplates ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                        {importTemplates && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Import Default Library</div>
                        <div className="text-sm text-muted-foreground mt-1">Recommended. Includes templates for Sentinel, Azure AD, SentinelOne, and more. You can edit or delete them later.</div>
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      className="hidden" 
                      checked={importTemplates} 
                      onChange={() => setImportTemplates(true)} 
                    />
                  </label>
                  
                  <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-colors ${!importTemplates ? 'border-primary bg-primary/5' : 'border-surface-border hover:border-primary/50'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${!importTemplates ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                        {!importTemplates && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Start Blank</div>
                        <div className="text-sm text-muted-foreground mt-1">I will create my own templates or import my team's JSON bundle later.</div>
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      className="hidden" 
                      checked={!importTemplates} 
                      onChange={() => setImportTemplates(false)} 
                    />
                  </label>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="flex-1 space-y-6">
                <h2 className="text-2xl font-semibold">Add a Client (Optional)</h2>
                <p className="text-sm text-muted-foreground">If you are an MSSP, you can add your first client here. If you are an internal SOC, you can just add your own company.</p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client / Company Name</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      className="w-full bg-background border border-surface-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                      placeholder="e.g. Globex Corporation"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Short Code</label>
                    <input
                      type="text"
                      value={clientShortCode}
                      onChange={e => setClientShortCode(e.target.value.toUpperCase())}
                      className="w-full bg-background border border-surface-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary uppercase"
                      placeholder="e.g. GLBX"
                      maxLength={8}
                    />
                    <p className="text-xs text-muted-foreground">A 3-5 letter code to prefix cases (e.g. GLBX-102)</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-surface-border flex items-center justify-between">
              {step > 1 ? (
                <button
                  onClick={handlePrev}
                  className="px-6 py-2 rounded-lg font-medium text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors"
                  disabled={loading}
                >
                  Back
                </button>
              ) : <div />}
              
              {step < 5 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
