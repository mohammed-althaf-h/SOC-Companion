import { useState } from 'react'
import type { Client, Severity } from '@/types'
import { cn } from '@/lib/utils'
import { ChevronRight, Search, Plus } from 'lucide-react'
import { useRulesWiki } from '@/hooks/useRulesWiki'

interface Props {
  clients: Client[]
  clientId: string
  setClientId: (id: string) => void
  caseNumber: string
  setCaseNumber: (s: string) => void
  alertName: string
  setAlertName: (s: string) => void
  severity: Severity
  setSeverity: (s: Severity) => void
  triggeredAt: string
  setTriggeredAt: (s: string) => void
  onNext: () => void
  canNext: boolean
  onAddClient: () => void
}

export default function Step1ClientInfo({
  clients, clientId, setClientId, caseNumber, setCaseNumber,
  alertName, setAlertName, severity, setSeverity,
  triggeredAt, setTriggeredAt, onNext, canNext, onAddClient
}: Props) {
  const [search, setSearch] = useState('')
  const { data: rulesWiki } = useRulesWiki()

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.short_code.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold">1. Select Workspace Client</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 bg-background border border-surface-border rounded-lg text-sm focus:border-primary/50 outline-none"
              />
            </div>
            <button
              onClick={onAddClient}
              className="flex items-center gap-2 bg-surface hover:bg-surface-elevated text-foreground border border-surface-border px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Client
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pr-2">
          {clients.length === 0 ? (
            <div className="col-span-full py-8 text-center text-muted-foreground bg-surface/50 rounded-lg border border-dashed border-surface-border">
              No clients found. <button onClick={onAddClient} className="text-primary hover:underline font-medium">Add a client</button> to get started.
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="col-span-full py-8 text-center text-muted-foreground">
              No clients match your search.
            </div>
          ) : (
            filteredClients.map(c => (
              <button
                key={c.id}
                onClick={() => setClientId(c.id)}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all flex flex-col items-start h-full',
                  clientId === c.id 
                    ? 'bg-surface-elevated ring-2 ring-primary/50 border-primary/50' 
                    : 'bg-surface border-surface-border hover:border-primary/30'
                )}
              >
                <div className="h-1.5 w-8 rounded-full mb-3 shrink-0" style={{ backgroundColor: c.color_tag }} />
                <div className="font-bold text-foreground">{c.short_code}</div>
                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.name}</div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">2. Alert Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Case Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={caseNumber}
              onChange={e => setCaseNumber(e.target.value)}
              placeholder="e.g. CS2099087"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary/50 outline-none font-mono text-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Triggered At</label>
            <input
              type="datetime-local"
              value={triggeredAt}
              onChange={e => setTriggeredAt(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary/50 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Alert Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              list="alert-names-list"
              value={alertName}
              onChange={e => setAlertName(e.target.value)}
              placeholder="Select or type new alert rule name"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary/50 outline-none"
            />
            <datalist id="alert-names-list">
              {rulesWiki?.map(rule => (
                <option key={rule.id} value={rule.rule_name} />
              ))}
            </datalist>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Severity</label>
            <div className="flex gap-3">
              {(['critical', 'high', 'medium', 'low'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-bold uppercase border transition-all flex-1',
                    severity === s 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-surface-border bg-surface text-muted-foreground hover:bg-surface-elevated'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!canNext}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
