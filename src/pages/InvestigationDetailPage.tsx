import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileSearch, Clock, ChevronDown, CheckCircle2, Save, Download, Copy, RefreshCw, XCircle, Mail, Plus, Trash2 } from 'lucide-react'
import { useInvestigation, useUpdateInvestigation, useDeleteInvestigation } from '@/hooks/useInvestigations'
import { useIOCs, useAddIOC } from '@/hooks/useIOCsTimeline'
import { useClientStore } from '@/store/clientStore'
import { getAlertRuleById } from '@/data/alertRules'
import { generateDraftEmail } from '@/lib/emailTemplates'
import { exportToMarkdown, downloadMarkdown, copyToClipboard } from '@/lib/exportMarkdown'
import { cn, severityClass, statusClass, statusLabel, formatDateTime, formatDateTimeLocal } from '@/lib/utils'
import { toast } from 'sonner'
import ClientBanner from '@/components/layout/ClientBanner'
import type { Verdict, InvestigationStatus } from '@/types'

export default function InvestigationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: inv, isLoading } = useInvestigation(id)
  const { mutateAsync: updateInv } = useUpdateInvestigation()
  const { mutateAsync: deleteInv } = useDeleteInvestigation()
  const { data: iocs } = useIOCs(id)
  const { setActiveClient } = useClientStore()

  const [activeTab, setActiveTab] = useState<'details' | 'draft' | 'iocs'>('details')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  
  // Status/Verdict updating
  const [savingStatus, setSavingStatus] = useState(false)

  useEffect(() => {
    if (inv?.client) {
      setActiveClient(inv.client)
      setFormData(inv.field_data || {})
    }
    return () => setActiveClient(null)
  }, [inv, setActiveClient])

  if (isLoading || !inv || !inv.client) {
    return <div className="skeleton h-[600px] rounded-xl" />
  }

  const rule = inv.alert_rule_id ? getAlertRuleById(inv.alert_rule_id) : null

  const handleUpdateStatus = async (status: InvestigationStatus) => {
    setSavingStatus(true)
    try {
      await updateInv({ id: inv.id, updates: { status } })
      toast.success(`Status updated to ${statusLabel(status)}`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSavingStatus(false)
    }
  }

  const handleUpdateVerdict = async (verdict: Verdict) => {
    setSavingStatus(true)
    try {
      await updateInv({ id: inv.id, updates: { verdict } })
      toast.success(`Verdict recorded`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSavingStatus(false)
    }
  }

  const handleSaveFields = async () => {
    try {
      await updateInv({ id: inv.id, updates: { field_data: formData } })
      setIsEditing(false)
      toast.success('Fields saved successfully')
    } catch (e: any) {
      toast.error('Failed to save fields: ' + e.message)
    }
  }

  const generatedDraft = generateDraftEmail(inv, inv.client!, rule || null, inv.assigned_analyst || 'Analyst')

  const handleExport = () => {
    const md = exportToMarkdown(inv, inv.client!, iocs || [], [], generatedDraft)
    downloadMarkdown(md, `${inv.client!.short_code}_${inv.case_number}`)
    toast.success('Markdown report downloaded')
  }

  const handleCopy = async () => {
    await copyToClipboard(generatedDraft)
    toast.success('Draft copied to clipboard')
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this investigation? This action cannot be undone.')) {
      try {
        await deleteInv(inv.id)
        toast.success('Investigation deleted')
        navigate('/investigations')
      } catch (e: any) {
        toast.error('Failed to delete investigation: ' + e.message)
      }
    }
  }

  return (
    <div className="space-y-6">
      <ClientBanner client={inv.client} caseNumber={inv.case_number} severity={inv.severity} />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground font-mono">{inv.case_number}</h1>
            <span className={cn('text-xs px-2 py-0.5 rounded font-bold border uppercase', statusClass(inv.status))}>
              {statusLabel(inv.status)}
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded font-bold uppercase', severityClass(inv.severity))}>
              {inv.severity}
            </span>
            {inv.verdict && (
              <span className="text-xs px-2 py-0.5 rounded font-bold bg-surface border border-surface-border text-foreground">
                Verdict: {inv.verdict.replace('_', ' ').toUpperCase()}
              </span>
            )}
          </div>
          <h2 className="text-xl text-foreground font-medium">{inv.alert_name}</h2>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-4">
            <span>Triggered: {formatDateTime(inv.triggered_at)}</span>
            <span>Analyst: {inv.assigned_analyst}</span>
          </p>
        </div>

        <div className="flex gap-2">
          {inv.status !== 'closed' && (
            <button 
              onClick={() => handleUpdateStatus('closed')}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> Close Case
            </button>
          )}
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-surface-border rounded-lg text-sm font-medium hover:bg-accent transition-colors">
            <Download className="w-4 h-4" /> Export .md
          </button>
          <button onClick={handleDelete} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="flex border-b border-surface-border">
        {(['details', 'draft', 'iocs'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-6 py-3 text-sm font-medium capitalize border-b-2 transition-colors',
              activeTab === tab 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-surface-border'
            )}
          >
            {tab === 'iocs' ? 'IOCs' : tab}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Investigation Fields</h3>
                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="text-sm text-primary hover:underline">Edit Fields</button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditing(false)} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                      <button onClick={handleSaveFields} className="text-sm text-primary font-medium hover:underline">Save</button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(formData).map(([k, v]) => (
                    <div key={k} className="bg-surface p-3 rounded-lg border border-surface-border">
                      <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                        {k.replace(/_/g, ' ')}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={v}
                          onChange={(e) => setFormData(p => ({ ...p, [k]: e.target.value }))}
                          className="w-full bg-background border border-surface-border rounded p-1.5 text-sm font-mono text-foreground focus:border-primary/50 outline-none"
                        />
                      ) : (
                        <div className="text-sm font-mono text-foreground break-words">{v || '-'}</div>
                      )}
                    </div>
                  ))}
                  {Object.keys(formData).length === 0 && (
                    <div className="col-span-full text-sm text-muted-foreground">No field data recorded.</div>
                  )}
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4">Observations</h3>
                {inv.observations?.length > 0 ? (
                  <ul className="space-y-3">
                    {inv.observations.map((obs, i) => (
                      <li key={i} className="flex gap-3 text-sm text-foreground bg-surface p-3 rounded-lg border border-surface-border">
                        <span className="font-bold text-primary">{i+1}.</span>
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No observations recorded.</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Update Status</label>
                    <select 
                      value={inv.status}
                      onChange={(e) => handleUpdateStatus(e.target.value as InvestigationStatus)}
                      disabled={savingStatus}
                      className="w-full bg-surface border border-surface-border rounded-lg text-sm p-2 outline-none focus:border-primary/50"
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="pending_response">Pending Response</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1 block">Set Verdict</label>
                    <select 
                      value={inv.verdict || ''}
                      onChange={(e) => handleUpdateVerdict(e.target.value as Verdict)}
                      disabled={savingStatus}
                      className="w-full bg-surface border border-surface-border rounded-lg text-sm p-2 outline-none focus:border-primary/50"
                    >
                      <option value="">Pending Analysis...</option>
                      <option value="true_positive">True Positive (Malicious)</option>
                      <option value="false_positive">False Positive (Benign)</option>
                      <option value="benign">Benign True Positive</option>
                      <option value="inconclusive">Inconclusive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'draft' && (
          <div className="glass-card p-0 overflow-hidden flex flex-col h-[600px]">
            <div className="bg-surface border-b border-surface-border p-4 flex justify-between items-center">
              <h3 className="font-semibold flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" /> Generated Email Draft
              </h3>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors"
              >
                <Copy className="w-4 h-4" /> Copy to Clipboard
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <pre className="text-sm font-sans whitespace-pre-wrap text-foreground">
                {generatedDraft}
              </pre>
            </div>
            <div className="bg-amber-500/10 border-t border-amber-500/20 p-3 text-xs text-amber-500 text-center">
              Variables in this draft are automatically populated and defanged based on investigation fields.
            </div>
          </div>
        )}

        {activeTab === 'iocs' && (
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Indicators of Compromise</h3>
              <button className="text-sm flex items-center gap-1 bg-surface border border-surface-border px-3 py-1.5 rounded-lg hover:bg-accent transition-colors">
                <Plus className="w-4 h-4" /> Add IOC
              </button>
            </div>
            
            {iocs?.length ? (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-surface">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Type</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Blocked</th>
                    <th className="px-4 py-3 rounded-tr-lg">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {iocs.map(ioc => (
                    <tr key={ioc.id}>
                      <td className="px-4 py-3 font-medium">{ioc.type}</td>
                      <td className="px-4 py-3 font-mono text-amber-300">{ioc.value_defanged || ioc.value_raw}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ioc.source || '-'}</td>
                      <td className="px-4 py-3">{ioc.blocked ? '✅' : '❌'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ioc.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 border border-dashed border-surface-border rounded-lg text-muted-foreground">
                No IOCs recorded for this investigation.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
