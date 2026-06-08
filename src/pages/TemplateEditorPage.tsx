import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, LayoutTemplate, ListTree, CheckSquare, Mail } from 'lucide-react'
import { toast } from 'sonner'
import type { AlertRule, FieldDefinition, ObservationTemplate } from '@/types'
import { useAlertTemplates, useSaveAlertTemplate } from '@/hooks/useAlertTemplates'
import FieldSchemaBuilder from '@/components/templates/FieldSchemaBuilder'
import ObservationBuilder from '@/components/templates/ObservationBuilder'
import EmailTemplateEditor from '@/components/templates/EmailTemplateEditor'
import { cn } from '@/lib/utils'

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: templates, isLoading } = useAlertTemplates()
  const { mutateAsync: saveTemplate } = useSaveAlertTemplate()

  const [activeTab, setActiveTab] = useState<'basic' | 'fields' | 'observations' | 'email'>('basic')
  
  const [template, setTemplate] = useState<AlertRule>({
    id: `custom_${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    category: 'OTHERS',
    description: '',
    defaultSeverity: 'medium',
    mitreTactics: [],
    fieldsSchema: [],
    observationsChecklist: [],
    emailTemplate: ''
  })

  useEffect(() => {
    if (id && id !== 'new' && templates) {
      const existing = templates.find(t => t.id === id)
      if (existing) {
        setTemplate(existing)
      }
    }
  }, [id, templates])

  const handleSave = async () => {
    if (!template.name) {
      toast.error('Template name is required')
      return
    }
    try {
      await saveTemplate(template)
      toast.success('Template saved successfully')
      navigate('/templates')
    } catch (error: any) {
      toast.error(`Failed to save template: ${error.message}`)
    }
  }

  if (isLoading && id !== 'new') {
    return <div className="p-8 text-center text-muted-foreground">Loading template...</div>
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: LayoutTemplate },
    { id: 'fields', label: 'Fields Schema', icon: ListTree },
    { id: 'observations', label: 'Observations', icon: CheckSquare },
    { id: 'email', label: 'Email Template', icon: Mail },
  ] as const

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between bg-surface border border-surface-border p-4 rounded-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/templates')}
            className="p-2 hover:bg-surface-elevated rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{id === 'new' ? 'New Template' : 'Edit Template'}</h1>
            <p className="text-sm text-muted-foreground">{template.name || 'Untitled'}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Template
        </button>
      </div>

      <div className="flex gap-2 border-b border-surface-border pb-px overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-surface-border'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-surface-border rounded-xl p-6">
        {activeTab === 'basic' && (
          <div className="max-w-2xl space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template Name</label>
              <input
                type="text"
                value={template.name}
                onChange={e => setTemplate({ ...template, name: e.target.value })}
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                placeholder="e.g. Impossible Travel"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  value={template.category}
                  onChange={e => setTemplate({ ...template, category: e.target.value as any })}
                  className="w-full bg-background border border-surface-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                >
                  <option value="UBA_AZURE">UBA / Azure AD</option>
                  <option value="SIEM">SIEM</option>
                  <option value="SENTINELONE">SentinelOne</option>
                  <option value="OTHERS">Others</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Severity</label>
                <select
                  value={template.defaultSeverity}
                  onChange={e => setTemplate({ ...template, defaultSeverity: e.target.value as any })}
                  className="w-full bg-background border border-surface-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={template.description}
                onChange={e => setTemplate({ ...template, description: e.target.value })}
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary h-24 resize-none"
                placeholder="Describe what this rule detects..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">MITRE Tactics (comma separated)</label>
              <input
                type="text"
                value={template.mitreTactics.join(', ')}
                onChange={e => setTemplate({ 
                  ...template, 
                  mitreTactics: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                })}
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                placeholder="Initial Access, Execution, Persistence..."
              />
            </div>
          </div>
        )}

        {activeTab === 'fields' && (
          <FieldSchemaBuilder
            fields={template.fieldsSchema}
            onChange={(fieldsSchema) => setTemplate({ ...template, fieldsSchema })}
          />
        )}

        {activeTab === 'observations' && (
          <ObservationBuilder
            observations={template.observationsChecklist}
            onChange={(observationsChecklist) => setTemplate({ ...template, observationsChecklist })}
          />
        )}

        {activeTab === 'email' && (
          <EmailTemplateEditor
            template={template.emailTemplate}
            onChange={(emailTemplate) => setTemplate({ ...template, emailTemplate })}
            fields={template.fieldsSchema}
          />
        )}
      </div>
    </div>
  )
}
