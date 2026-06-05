import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Eye, AlertTriangle } from 'lucide-react'
import type { Client, Severity, AlertRule } from '@/types'
import { detectCrossContamination } from '@/lib/crossContamination'
import { useClients } from '@/hooks/useClients'
import { useCreateInvestigation } from '@/hooks/useInvestigations'
import { generateDraftEmail } from '@/lib/emailTemplates'
import ClientBanner from '@/components/layout/ClientBanner'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { autoDefang } from '@/lib/defang'
import { useRulesWiki, useCreateRuleWiki } from '@/hooks/useRulesWiki'


interface Props {
  client: Client
  caseNumber: string
  alertName: string
  severity: Severity
  triggeredAt: string
  ruleId: string | null
  templates: AlertRule[]
  onBack: () => void
}

export default function Step3FieldsDraft({
  client, caseNumber, alertName, severity, triggeredAt, ruleId, templates, onBack
}: Props) {
  const navigate = useNavigate()
  const { data: allClients } = useClients()
  const { mutateAsync: createInv, isPending } = useCreateInvestigation()

  const rule = ruleId ? templates.find(t => t.id === ruleId) : null
  const schema = rule?.fieldsSchema || []

  const [formData, setFormData] = useState<Record<string, string>>({})
  const [contamination, setContamination] = useState<{detected: boolean, clientCode: string | null}>({detected: false, clientCode: null})

  // Watch for cross-contamination
  useEffect(() => {
    if (allClients) {
      const result = detectCrossContamination(formData, client.short_code, allClients)
      setContamination({ detected: result.detected, clientCode: result.offendingCode })
    }
  }, [formData, allClients, client.short_code])

  const handleFieldChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleFieldBlur = (key: string, value: string, type: string, defang: boolean) => {
    if (defang) {
      handleFieldChange(key, autoDefang(value, type as any))
    }
  }

  const { data: rulesWiki } = useRulesWiki()
  const { mutateAsync: createRuleWiki } = useCreateRuleWiki()

  const handleCreate = async () => {
    if (contamination.detected) {
      toast.error('Cannot save: Cross-contamination detected!')
      return
    }

    try {
      // Create wiki rule entry if it doesn't exist
      if (rulesWiki && !rulesWiki.some(r => r.rule_name === alertName)) {
        await createRuleWiki(alertName).catch(err => {
          console.error("Failed to create rule wiki", err);
          // Non-fatal if it already exists from another tab
        });
      }

      const inv = await createInv({
        client_id: client.id,
        case_number: caseNumber,
        alert_name: alertName,
        severity,
        triggered_at: triggeredAt,
        alert_rule_id: ruleId,
        field_data: formData,
        observations: [], // Will be generated based on checkboxes in future iterations, or analyst can type in detail page
      })
      toast.success('Investigation draft created')
      navigate(`/investigations/${inv.id}`)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="animate-fade-in">
      <ClientBanner client={client} caseNumber={caseNumber} />

      {contamination.detected && (
        <div className="contamination-alert mb-6">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div>
            <h4 className="font-bold text-red-500">Cross-Contamination Warning</h4>
            <p className="text-sm text-red-400 mt-1">
              Detected references to client short code <strong>{contamination.clientCode}</strong> in your input.
              Data saving is disabled to prevent cross-contamination.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-6">Field Extraction</h2>
          
          {schema.length > 0 ? (
            <div className="space-y-4">
              {schema.map(field => (
                <div key={field.id}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  
                  {field.type === 'select' ? (
                    <select
                      value={formData[field.id] || ''}
                      onChange={e => handleFieldChange(field.id, e.target.value)}
                      className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary/50 outline-none"
                    >
                      <option value="">Select...</option>
                      {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.id] || ''}
                      onChange={e => handleFieldChange(field.id, e.target.value)}
                      onBlur={e => handleFieldBlur(field.id, e.target.value, field.type, !!field.defang)}
                      placeholder={field.placeholder}
                      rows={3}
                      className={cn(
                        "w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary/50 outline-none",
                        field.monospace && "font-mono"
                      )}
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[field.id] || ''}
                      onChange={e => handleFieldChange(field.id, e.target.value)}
                      onBlur={e => handleFieldBlur(field.id, e.target.value, field.type, !!field.defang)}
                      placeholder={field.placeholder}
                      className={cn(
                        "w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary/50 outline-none",
                        field.monospace && "font-mono"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-12 text-center border border-dashed border-surface-border rounded-lg">
              Blank investigation. No pre-defined fields.
            </div>
          )}
        </div>

        <div className="glass-card p-0 flex flex-col h-[700px] sticky top-6">
          <div className="p-4 border-b border-surface-border flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> Live Draft Preview</h3>
          </div>
          <div className="flex-1 p-6 overflow-y-auto bg-[#1a1d27]/50">
            <pre className="text-xs font-sans whitespace-pre-wrap text-foreground/80">
              {generateDraftEmail({ case_number: caseNumber, alert_name: alertName, field_data: formData, triggered_at: triggeredAt, observations: [] } as any, client, rule || null, 'Analyst')}
            </pre>
          </div>
          <div className="p-4 bg-surface border-t border-surface-border flex justify-between">
            <button onClick={onBack} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Back</button>
            <button 
              onClick={handleCreate}
              disabled={isPending || contamination.detected}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Create Draft'} <Save className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
