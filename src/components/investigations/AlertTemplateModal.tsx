import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Save } from 'lucide-react'
import { useSaveAlertTemplate } from '@/hooks/useAlertTemplates'
import type { AlertRule, AlertCategory, Severity, FieldDefinition, ObservationTemplate } from '@/types'
import { toast } from 'sonner'

interface Props {
  template: AlertRule | null
  onClose: () => void
}

export default function AlertTemplateModal({ template, onClose }: Props) {
  const { mutateAsync: saveTemplate, isPending } = useSaveAlertTemplate()

  const [formData, setFormData] = useState<AlertRule>({
    id: '',
    name: '',
    category: 'OTHERS',
    description: '',
    defaultSeverity: 'medium',
    mitreTactics: [],
    fieldsSchema: [],
    observationsChecklist: [],
    emailTemplate: 'Hello All,\n\nWe have investigated this alert and below is the summary of our investigation.\n\n[ALERT SUMMARY]:\n\n[OBSERVATIONS]:\n\n{{observations}}\n\n[NEXT STEPS]:\n\n{{next_steps}}\n\nRegards,\n{{analyst_name}}\nECI-SOC',
  })

  useEffect(() => {
    if (template) {
      setFormData(template)
    } else {
      setFormData(prev => ({ ...prev, id: `custom-${Date.now()}` }))
    }
  }, [template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await saveTemplate(formData)
      toast.success('Template saved successfully')
      onClose()
    } catch (err: any) {
      toast.error('Failed to save template: ' + err.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-surface-border rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-surface-border">
          <h2 className="text-xl font-bold">{template ? 'Edit Template' : 'New Template'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-elevated rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Basic Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-primary border-b border-surface-border pb-2">Basic Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full p-2 rounded-md bg-background border border-surface-border focus:border-primary/50 outline-none" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value as AlertCategory }))} className="w-full p-2 rounded-md bg-background border border-surface-border focus:border-primary/50 outline-none">
                  <option value="UBA_AZURE">UBA / Azure AD</option>
                  <option value="SIEM">SIEM</option>
                  <option value="SENTINELONE">SentinelOne</option>
                  <option value="OTHERS">Others</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <input value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full p-2 rounded-md bg-background border border-surface-border focus:border-primary/50 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Default Severity</label>
                <select value={formData.defaultSeverity} onChange={e => setFormData(p => ({ ...p, defaultSeverity: e.target.value as Severity }))} className="w-full p-2 rounded-md bg-background border border-surface-border focus:border-primary/50 outline-none">
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">MITRE Tactics (comma separated)</label>
                <input 
                  value={formData.mitreTactics.join(', ')} 
                  onChange={e => setFormData(p => ({ ...p, mitreTactics: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} 
                  className="w-full p-2 rounded-md bg-background border border-surface-border focus:border-primary/50 outline-none" 
                  placeholder="Initial Access, Credential Access"
                />
              </div>
            </div>
          </div>

          {/* Fields Schema */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-surface-border pb-2">
              <h3 className="font-semibold text-primary">Investigation Fields Schema</h3>
              <button type="button" onClick={() => setFormData(p => ({ ...p, fieldsSchema: [...p.fieldsSchema, { id: '', label: '', type: 'text' }] }))} className="text-sm flex items-center gap-1 text-primary hover:underline">
                <Plus className="w-4 h-4" /> Add Field
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.fieldsSchema.map((field, index) => (
                <div key={index} className="flex gap-2 items-start bg-surface-elevated p-3 rounded-lg border border-surface-border">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1">
                    <input placeholder="ID (e.g. source_ip)" value={field.id} onChange={e => {
                      const newFields = [...formData.fieldsSchema]
                      newFields[index].id = e.target.value
                      setFormData(p => ({ ...p, fieldsSchema: newFields }))
                    }} className="p-1.5 text-sm rounded bg-background border border-surface-border" />
                    
                    <input placeholder="Label" value={field.label} onChange={e => {
                      const newFields = [...formData.fieldsSchema]
                      newFields[index].label = e.target.value
                      setFormData(p => ({ ...p, fieldsSchema: newFields }))
                    }} className="p-1.5 text-sm rounded bg-background border border-surface-border md:col-span-2" />
                    
                    <select value={field.type} onChange={e => {
                      const newFields = [...formData.fieldsSchema]
                      newFields[index].type = e.target.value as any
                      setFormData(p => ({ ...p, fieldsSchema: newFields }))
                    }} className="p-1.5 text-sm rounded bg-background border border-surface-border">
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="ip">IP</option>
                      <option value="url">URL</option>
                      <option value="select">Select</option>
                    </select>
                  </div>
                  <button type="button" onClick={() => {
                    const newFields = [...formData.fieldsSchema]
                    newFields.splice(index, 1)
                    setFormData(p => ({ ...p, fieldsSchema: newFields }))
                  }} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {formData.fieldsSchema.length === 0 && <p className="text-sm text-muted-foreground">No fields defined.</p>}
            </div>
          </div>

          {/* Observations Checklist */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-surface-border pb-2">
              <h3 className="font-semibold text-primary">Observations Checklist</h3>
              <button type="button" onClick={() => setFormData(p => ({ ...p, observationsChecklist: [...p.observationsChecklist, { id: `obs-${Date.now()}`, text: '', variables: [] }] }))} className="text-sm flex items-center gap-1 text-primary hover:underline">
                <Plus className="w-4 h-4" /> Add Observation
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.observationsChecklist.map((obs, index) => (
                <div key={index} className="flex gap-2 items-start bg-surface-elevated p-3 rounded-lg border border-surface-border">
                  <textarea 
                    placeholder="Observation text with {{variable}} placeholders" 
                    value={obs.text} 
                    onChange={e => {
                      const newObs = [...formData.observationsChecklist]
                      newObs[index].text = e.target.value
                      setFormData(p => ({ ...p, observationsChecklist: newObs }))
                    }} 
                    className="flex-1 p-2 text-sm rounded bg-background border border-surface-border min-h-[60px]" 
                  />
                  <button type="button" onClick={() => {
                    const newObs = [...formData.observationsChecklist]
                    newObs.splice(index, 1)
                    setFormData(p => ({ ...p, observationsChecklist: newObs }))
                  }} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {formData.observationsChecklist.length === 0 && <p className="text-sm text-muted-foreground">No observations defined.</p>}
            </div>
          </div>

          {/* Email Template */}
          <div className="space-y-4">
            <h3 className="font-semibold text-primary border-b border-surface-border pb-2">Email Template</h3>
            <textarea 
              value={formData.emailTemplate} 
              onChange={e => setFormData(p => ({ ...p, emailTemplate: e.target.value }))}
              className="w-full p-4 rounded-md bg-background border border-surface-border focus:border-primary/50 outline-none font-mono text-sm min-h-[200px]"
            />
          </div>

        </form>

        <div className="p-4 border-t border-surface-border bg-surface flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-elevated transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" />
            {isPending ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  )
}
