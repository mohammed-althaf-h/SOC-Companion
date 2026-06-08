import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, Server, Mail, Globe, Search, Plus, Edit2, Upload, Download, Package, X, Check } from 'lucide-react'
import type { AlertCategory, AlertRule } from '@/types'
import { cn, severityClass } from '@/lib/utils'
import { useAlertTemplates, useSaveAlertTemplate } from '@/hooks/useAlertTemplates'
import { toast } from 'sonner'

// ── Pack format ───────────────────────────────────────────────────────────────
interface TemplatePack {
  name: string
  version: string
  author: string
  exportedAt: string
  templates: AlertRule[]
}

function exportPack(templates: AlertRule[]): TemplatePack {
  return {
    name: 'My SOC Template Pack',
    version: '1.0',
    author: 'SOC Companion',
    exportedAt: new Date().toISOString(),
    templates,
  }
}

function downloadJSON(obj: object, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AlertTemplatesPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AlertCategory>('UBA_AZURE')
  const [search, setSearch] = useState('')
  const [importModal, setImportModal] = useState(false)
  const [importPack, setImportPack] = useState<TemplatePack | null>(null)
  const [importSelected, setImportSelected] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: templates, isLoading } = useAlertTemplates()
  const { mutateAsync: saveTemplate } = useSaveAlertTemplate()

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

  // ── Export single template ────────────────────────────────────────────────
  const handleExportOne = (rule: AlertRule) => {
    const pack = exportPack([rule])
    pack.name = `${rule.name} Template`
    downloadJSON(pack, `${rule.id}.soc-templates.json`)
    toast.success('Template exported')
  }

  // ── Export all (current category) ────────────────────────────────────────
  const handleExportAll = () => {
    if (!templates?.length) return
    const pack = exportPack(templates)
    pack.name = 'Full SOC Template Library'
    downloadJSON(pack, 'all-templates.soc-templates.json')
    toast.success(`Exported ${templates.length} templates`)
  }

  // ── Import: read file ─────────────────────────────────────────────────────
  const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const pack: TemplatePack = JSON.parse(ev.target!.result as string)
        if (!Array.isArray(pack.templates)) throw new Error('Invalid format: no templates array')
        setImportPack(pack)
        // Pre-select all
        setImportSelected(new Set(pack.templates.map(t => t.id)))
        setImportModal(true)
      } catch (err: any) {
        toast.error('Invalid file: ' + err.message)
      }
    }
    reader.readAsText(file)
    // Reset so same file can be re-uploaded
    e.target.value = ''
  }

  // ── Import: save selected ────────────────────────────────────────────────
  const handleImport = async () => {
    if (!importPack) return
    setImporting(true)
    const toImport = importPack.templates.filter(t => importSelected.has(t.id))
    let ok = 0
    for (const t of toImport) {
      try {
        await saveTemplate(t)
        ok++
      } catch { /* skip */ }
    }
    toast.success(`Imported ${ok} template${ok !== 1 ? 's' : ''}`)
    setImporting(false)
    setImportModal(false)
    setImportPack(null)
  }

  const toggleImportSelect = (id: string) => {
    setImportSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alert Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse the library of pre-configured alert templates and investigation workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Import */}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 bg-surface border border-surface-border text-foreground px-4 py-2 rounded-lg font-medium hover:bg-accent transition-colors text-sm"
          >
            <Upload className="w-4 h-4" /> Import Pack
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.soc-templates.json"
            className="hidden"
            onChange={handleFileRead}
          />
          {/* Export all */}
          <button
            onClick={handleExportAll}
            disabled={!templates?.length}
            className="flex items-center gap-2 bg-surface border border-surface-border text-foreground px-4 py-2 rounded-lg font-medium hover:bg-accent transition-colors text-sm disabled:opacity-40"
          >
            <Download className="w-4 h-4" /> Export All
          </button>
          {/* Add template */}
          <button
            onClick={() => navigate('/templates/new')}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Template
          </button>
        </div>
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
                  onClick={() => handleExportOne(rule)}
                  className="p-1 text-muted-foreground hover:text-primary transition-colors"
                  title="Export template"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate(`/templates/${rule.id}/edit`)}
                  className="p-1 text-muted-foreground hover:text-primary transition-colors"
                  title="Edit Template"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{rule.description}</p>

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
        {filteredRules.length === 0 && !isLoading && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-surface/50 rounded-lg border border-dashed border-surface-border">
            No templates found matching your search.
          </div>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
      )}

      {/* ═══════════════ Import Modal ═══════════════ */}
      {importModal && importPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setImportModal(false)}>
          <div className="bg-surface border border-surface-border rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold">{importPack.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    v{importPack.version} · {importPack.templates.length} templates · by {importPack.author}
                  </p>
                </div>
              </div>
              <button onClick={() => setImportModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              Select which templates to import. Existing templates with the same ID will be overwritten.
            </p>

            <div className="flex justify-between items-center mb-2 text-xs text-muted-foreground">
              <span>{importSelected.size} selected</span>
              <div className="flex gap-3">
                <button onClick={() => setImportSelected(new Set(importPack.templates.map(t => t.id)))} className="hover:text-foreground">Select all</button>
                <button onClick={() => setImportSelected(new Set())} className="hover:text-foreground">Clear</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
              {importPack.templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => toggleImportSelect(t.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors',
                    importSelected.has(t.id)
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-surface-border bg-background hover:border-surface-border/80'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors',
                    importSelected.has(t.id) ? 'bg-primary border-primary' : 'border-surface-border'
                  )}>
                    {importSelected.has(t.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.category} · {t.fieldsSchema.length} fields</p>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded font-bold capitalize shrink-0', severityClass(t.defaultSeverity))}>
                    {t.defaultSeverity}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setImportModal(false)}
                className="flex-1 py-2 rounded-lg border border-surface-border text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || importSelected.size === 0}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {importing ? 'Importing…' : `Import ${importSelected.size} Template${importSelected.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
