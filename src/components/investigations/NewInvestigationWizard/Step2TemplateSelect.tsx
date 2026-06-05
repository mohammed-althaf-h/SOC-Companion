import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, FileX } from 'lucide-react'
import type { AlertCategory, AlertRule } from '@/types'
import { cn, severityClass, categoryLabel } from '@/lib/utils'

interface Props {
  templates: AlertRule[]
  selectedRuleId: string | null
  setSelectedRuleId: (id: string | null) => void
  onNext: () => void
  onBack: () => void
}

export default function Step2TemplateSelect({ templates, selectedRuleId, setSelectedRuleId, onNext, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<AlertCategory>('UBA_AZURE')
  const [search, setSearch] = useState('')

  const tabs: AlertCategory[] = ['UBA_AZURE', 'SIEM', 'SENTINELONE', 'OTHERS']

  const filteredRules = templates.filter(r => 
    r.category === activeTab && r.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Select Investigation Template</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:border-primary/50 outline-none"
            />
          </div>
        </div>

        <div className="flex bg-surface p-1 rounded-lg border border-surface-border mb-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 text-center py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === tab 
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
              )}
            >
              {categoryLabel(tab)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          <button
            onClick={() => setSelectedRuleId(null)}
            className={cn(
              'p-4 rounded-xl border text-left flex flex-col justify-center items-center gap-3 transition-all h-[120px]',
              selectedRuleId === null 
                ? 'bg-surface-elevated ring-2 ring-primary/50 border-primary/50' 
                : 'bg-surface border-surface-border border-dashed hover:border-primary/30 text-muted-foreground hover:text-foreground'
            )}
          >
            <FileX className="w-6 h-6" />
            <span className="font-medium">Blank Investigation (No Template)</span>
          </button>

          {filteredRules.map(rule => (
            <button
              key={rule.id}
              onClick={() => setSelectedRuleId(rule.id)}
              className={cn(
                'p-4 rounded-xl border text-left flex flex-col transition-all h-[120px]',
                selectedRuleId === rule.id 
                  ? 'bg-surface-elevated ring-2 ring-primary/50 border-primary/50' 
                  : 'bg-surface border-surface-border hover:border-primary/30'
              )}
            >
              <div className="font-medium text-foreground line-clamp-2 leading-tight mb-2">{rule.name}</div>
              <div className="mt-auto flex items-center justify-between">
                <span className={cn('text-[10px] px-2 py-0.5 rounded font-bold uppercase', severityClass(rule.defaultSeverity))}>
                  {rule.defaultSeverity}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase">{rule.fieldsSchema.length} fields</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
