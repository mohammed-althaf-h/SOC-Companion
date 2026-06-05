import { useState } from 'react'
import { ShieldAlert, Server, Mail, Globe, Search, Plus, Edit2 } from 'lucide-react'
import type { AlertCategory, AlertRule } from '@/types'
import { cn, severityClass } from '@/lib/utils'
import { useAlertTemplates } from '@/hooks/useAlertTemplates'
import AlertTemplateModal from '@/components/investigations/AlertTemplateModal'

export default function AlertTemplatesPage() {
  const [activeTab, setActiveTab] = useState<AlertCategory>('UBA_AZURE')
  const [search, setSearch] = useState('')

  const { data: templates, isLoading } = useAlertTemplates()
  const [editingTemplate, setEditingTemplate] = useState<AlertRule | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const tabs: { id: AlertCategory; label: string; icon: any }[] = [
    { id: 'UBA_AZURE', label: 'UBA / Azure AD', icon: Server },
    { id: 'SIEM', label: 'SIEM', icon: Globe },
    { id: 'SENTINELONE', label: 'SentinelOne', icon: ShieldAlert },
    { id: 'OTHERS', label: 'Others', icon: Mail },
  ]

  const filteredRules = (templates || [])
    .filter(r => r.category === activeTab)
    .filter(r => 
      r.name.toLowerCase().includes(search.toLowerCase()) || 
      r.mitreTactics.some(t => t.toLowerCase().includes(search.toLowerCase()))
    )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alert Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse the library of pre-configured alert templates and investigation workflows.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Template
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex bg-surface p-1 rounded-lg border border-surface-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === tab.id 
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filteredRules.map(rule => (
          <div key={rule.id} className="glass-card p-5 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg pr-4">{rule.name}</h3>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs px-2 py-0.5 rounded font-bold capitalize', severityClass(rule.defaultSeverity))}>
                  {rule.defaultSeverity}
                </span>
                <button
                  onClick={() => {
                    setEditingTemplate(rule)
                    setIsModalOpen(true)
                  }}
                  className="p-1 text-muted-foreground hover:text-primary transition-colors"
                  title="Edit Template"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {rule.description}
            </p>

            <div className="mt-auto space-y-4">
              {rule.mitreTactics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {rule.mitreTactics.map(tactic => (
                    <span key={tactic} className="text-[10px] uppercase tracking-wider bg-surface border border-surface-border px-2 py-1 rounded text-muted-foreground">
                      {tactic}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="pt-4 border-t border-surface-border flex items-center justify-between text-xs text-muted-foreground">
                <span>{rule.fieldsSchema.length} fields</span>
                <span>{rule.observationsChecklist.length} observation points</span>
              </div>
            </div>
          </div>
        ))}
        {filteredRules.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-surface/50 rounded-lg border border-dashed border-surface-border">
            No templates found matching your search.
          </div>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
      )}

      {isModalOpen && (
        <AlertTemplateModal 
          template={editingTemplate} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  )
}
