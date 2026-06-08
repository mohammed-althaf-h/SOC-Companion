import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Eye, AlertTriangle, Plus, XCircle } from 'lucide-react'
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
  const [observations, setObservations] = useState<string[]>([])
  const [newObservation, setNewObservation] = useState('')
  const [selectedChecklists, setSelectedChecklists] = useState<string[]>([])

  const renderTemplateLocal = (template: string, context: Record<string, string>) => {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] || `[${key}]`)
  }

  const checklistObservations = selectedChecklists.map(id => {
    const tpl = rule?.observationsChecklist?.find(c => c.id === id)?.text || ''
    return renderTemplateLocal(tpl, formData)
  })

  const finalObservations = [...checklistObservations, ...observations]


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

  const handleAddObservation = () => {
    if (!newObservation.trim()) return
    setObservations(prev => [...prev, newObservation.trim()])
    setNewObservation('')
  }

  const handleRemoveObservation = (index: number) => {
    setObservations(prev => prev.filter((_, i) => i !== index))
  }

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
        observations: finalObservations,
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

          <div className="mt-8 border-t border-surface-border pt-6">
            <h3 className="text-md font-semibold mb-4">Observations Checklist</h3>
            {rule?.observationsChecklist && rule.observationsChecklist.length > 0 ? (
              <div className="space-y-3 mb-6">
                {rule.observationsChecklist.map((chk) => (
                  <label key={chk.id} className="flex items-start gap-3 p-3 bg-surface border border-surface-border rounded-lg cursor-pointer hover:bg-surface/80 transition-colors">
                    <input 
                      type="checkbox" 
                      className="mt-1"
                      checked={selectedChecklists.includes(chk.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChecklists(prev => [...prev, chk.id])
                        } else {
                          setSelectedChecklists(prev => prev.filter(id => id !== chk.id))
                        }
                      }}
                    />
                    <div className="text-sm text-foreground">
                      {renderTemplateLocal(chk.text, formData)}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-6">No checklists configured for this template.</p>
            )}

            <h3 className="text-md font-semibold mb-4">Additional Observations</h3>
            {observations.length > 0 ? (
              <ul className="space-y-3 mb-4">
                {observations.map((obs, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground bg-surface p-3 rounded-lg border border-surface-border group">
                    <span className="font-bold text-primary shrink-0">{i+1}.</span>
                    <span className="flex-1">{obs}</span>
                    <button 
                      onClick={() => handleRemoveObservation(i)}
                      className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">No observations added yet.</p>
            )}
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newObservation}
                onChange={(e) => setNewObservation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddObservation();
                  }
                }}
                placeholder="Add an observation..."
                className="flex-1 bg-background border border-surface-border rounded-lg p-2 text-sm text-foreground focus:border-primary/50 outline-none"
              />
              <button
                onClick={handleAddObservation}
                disabled={!newObservation.trim()}
                className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card p-0 flex flex-col h-[700px] sticky top-6">
          <div className="p-4 border-b border-surface-border flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> Live Draft Preview</h3>
          </div>
          <div className="flex-1 p-6 overflow-y-auto bg-[#1a1d27]/50">
            <pre className="text-xs font-sans whitespace-pre-wrap text-foreground/80">
              {generateDraftEmail({ case_number: caseNumber, alert_name: alertName, field_data: formData, triggered_at: triggeredAt, observations: finalObservations } as any, client, rule || null, 'Analyst')}
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
