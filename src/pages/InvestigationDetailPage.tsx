import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CheckCircle2, Download, Copy, RefreshCw, XCircle, Mail, Plus, Trash2,
  FileType2, Copy as CopyIcon, GitBranch, Clock, AlertTriangle, Zap,
  ChevronDown, ChevronUp, Search, Shield, Globe2, Sparkles
} from 'lucide-react'
import { useInvestigation, useUpdateInvestigation, useDeleteInvestigation, useCloneInvestigation } from '@/hooks/useInvestigations'
import { useIOCs, useAddIOC } from '@/hooks/useIOCsTimeline'
import { useEnrichIP, type EnrichmentResult } from '@/hooks/useEnrichment'
import { useGenerateObservations } from '@/hooks/useAIObservations'
import { useClientStore } from '@/store/clientStore'
import { useAlertTemplates } from '@/hooks/useAlertTemplates'
import { generateDraftEmail } from '@/lib/emailTemplates'
import { exportToMarkdown, downloadMarkdown, copyToClipboard } from '@/lib/exportMarkdown'
import { cn, severityClass, statusClass, statusLabel, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import ClientBanner from '@/components/layout/ClientBanner'
import { useUserSettings } from '@/hooks/useUserSettings'
import type { Verdict, InvestigationStatus, IOC } from '@/types'

// ── IOC detection helpers ─────────────────────────────────────────────────────
const IP_RE   = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
const DOMAIN_RE = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|io|gov|edu|co|uk|de|ru|cn|info|xyz|online|site|tech|app|dev|cloud|ai)\b/gi
const HASH_RE = /\b([a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64})\b/gi

function detectIOCType(val: string): IOC['type'] | null {
  if (IP_RE.test(val)) return 'IP'
  if (HASH_RE.test(val)) return 'Hash'
  if (DOMAIN_RE.test(val)) return 'Domain'
  return null
}

function defang(val: string, type: IOC['type']): string {
  if (type === 'IP') return val.replace(/\./g, '[.]')
  if (type === 'Domain') return val.replace(/\./g, '[.]')
  return val
}

// ── SLA helpers ───────────────────────────────────────────────────────────────
function slaColor(dueAt: string | null): string {
  if (!dueAt) return 'text-muted-foreground'
  const diff = new Date(dueAt).getTime() - Date.now()
  if (diff < 0) return 'text-red-400'
  if (diff < 2 * 3600_000) return 'text-amber-400'
  return 'text-emerald-400'
}

function slaLabel(dueAt: string | null): string {
  if (!dueAt) return ''
  const diff = new Date(dueAt).getTime() - Date.now()
  if (diff < 0) return `⚠ Overdue by ${Math.round(-diff / 3600_000)}h`
  const h = Math.floor(diff / 3600_000)
  const m = Math.floor((diff % 3600_000) / 60_000)
  return h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`
}

export default function InvestigationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: inv, isLoading } = useInvestigation(id)
  const { mutateAsync: updateInv } = useUpdateInvestigation()
  const { mutateAsync: deleteInv } = useDeleteInvestigation()
  const { mutateAsync: cloneInv } = useCloneInvestigation()
  const { data: iocs } = useIOCs(id)
  const { mutateAsync: addIOC } = useAddIOC()
  const { mutateAsync: enrichIP } = useEnrichIP()
  const { mutateAsync: generateAIObs, isPending: isGeneratingAI } = useGenerateObservations()
  const { setActiveClient } = useClientStore()
  const { data: templates } = useAlertTemplates()
  const { data: settings } = useUserSettings()

  const [activeTab, setActiveTab] = useState<'details' | 'draft' | 'iocs'>('details')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [newObservation, setNewObservation] = useState('')
  const [draftText, setDraftText] = useState<string | null>(null)
  const [savingStatus, setSavingStatus] = useState(false)

  // SLA panel state
  const [showSLAPanel, setShowSLAPanel] = useState(false)
  const [waitingOn, setWaitingOn] = useState('')
  const [slaDueAt, setSlaDueAt] = useState('')

  // IOC quick-add modal state
  const [iocModal, setIocModal] = useState<{ type: IOC['type']; value: string; field: string } | null>(null)
  const [iocSaving, setIocSaving] = useState(false)

  // Enrichment state (Feature 11)
  const [enrichingIp, setEnrichingIp] = useState<string | null>(null)
  const [enrichModal, setEnrichModal] = useState<{ field: string, ip: string, data: EnrichmentResult } | null>(null)

  // Observation checklist state (Feature 8)
  const [checklistDrafts, setChecklistDrafts] = useState<Record<string, string>>({})
  const [checklistAccepted, setChecklistAccepted] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (inv?.client) {
      setActiveClient(inv.client)
      setFormData(inv.field_data || {})
      setWaitingOn(inv.waiting_on || '')
      setSlaDueAt(inv.sla_due_at ? inv.sla_due_at.slice(0, 16) : '')
    }
    return () => setActiveClient(null)
  }, [inv, setActiveClient])

  // Initialise checklist drafts with field_data substitutions
  useEffect(() => {
    if (!inv || !templates) return
    const rule = inv.alert_rule_id ? templates.find(t => t.id === inv.alert_rule_id) : null
    if (!rule?.observationsChecklist?.length) return
    const alreadySaved = new Set(inv.observations || [])
    const drafts: Record<string, string> = {}
    rule.observationsChecklist.forEach(oc => {
      let text = oc.text
      // Replace {{variable}} with actual field_data values
      Object.entries(inv.field_data || {}).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || `[${k}]`)
      })
      // If already accepted (saved), mark as accepted
      if (alreadySaved.has(text)) {
        setChecklistAccepted(prev => new Set([...prev, oc.id]))
      }
      drafts[oc.id] = text
    })
    setChecklistDrafts(drafts)
  }, [inv?.id, templates])

  if (isLoading || !inv || !inv.client) {
    return <div className="skeleton h-[600px] rounded-xl" />
  }

  const rule = inv.alert_rule_id && templates ? templates.find(t => t.id === inv.alert_rule_id) : null

  // ── Status / Verdict ────────────────────────────────────────────────────────
  const handleUpdateStatus = async (status: InvestigationStatus) => {
    setSavingStatus(true)
    try {
      await updateInv({ id: inv.id, updates: { status } })
      toast.success(`Status updated to ${statusLabel(status)}`)
      // Show SLA panel when switching to pending_response
      if (status === 'pending_response') setShowSLAPanel(true)
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
      toast.success('Verdict recorded')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSavingStatus(false)
    }
  }

  // ── Fields ──────────────────────────────────────────────────────────────────
  const handleSaveFields = async () => {
    try {
      await updateInv({ id: inv.id, updates: { field_data: formData } })
      setIsEditing(false)
      toast.success('Fields saved successfully')
    } catch (e: any) {
      toast.error('Failed to save fields: ' + e.message)
    }
  }

  // ── Observations (manual) ───────────────────────────────────────────────────
  const handleAddObservation = async () => {
    if (!newObservation.trim()) return
    const updatedObservations = [...(inv.observations || []), newObservation.trim()]
    try {
      await updateInv({ id: inv.id, updates: { observations: updatedObservations } })
      setNewObservation('')
      toast.success('Observation added')
    } catch (e: any) {
      toast.error('Failed to add observation: ' + e.message)
    }
  }

  const handleRemoveObservation = async (index: number) => {
    const updatedObservations = (inv.observations || []).filter((_, i) => i !== index)
    try {
      await updateInv({ id: inv.id, updates: { observations: updatedObservations } })
      toast.success('Observation removed')
    } catch (e: any) {
      toast.error('Failed to remove observation: ' + e.message)
    }
  }

  // ── Feature 8: Accept checklist observation ─────────────────────────────────
  const handleAcceptChecklist = async (ocId: string) => {
    const text = checklistDrafts[ocId]
    if (!text) return
    const updatedObservations = [...(inv.observations || []), text]
    try {
      await updateInv({ id: inv.id, updates: { observations: updatedObservations } })
      setChecklistAccepted(prev => new Set([...prev, ocId]))
      toast.success('Observation accepted')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  // ── Draft email ─────────────────────────────────────────────────────────────
  const generatedDraft = generateDraftEmail(
    inv, inv.client!, rule || null,
    settings?.analyst_display_name || inv.assigned_analyst || 'Analyst',
    settings
  )

  useEffect(() => {
    setDraftText(inv.draft_email || generatedDraft)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inv.id])

  const handleRegenerateDraft = useCallback(() => {
    setDraftText(generatedDraft)
    toast.success('Draft regenerated from template')
  }, [generatedDraft])

  const handleSaveDraft = async (text: string) => {
    try {
      await updateInv({ id: inv.id, updates: { draft_email: text } })
    } catch { /* silent */ }
  }

  const handleCopyRichText = async () => {
    const text = draftText || generatedDraft
    const html = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\[([A-Z ]+)\]:/g, '<strong>[$1]:</strong>')
      .replace(/^(\d+)\. /gm, '<li>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })
      ])
      toast.success('Copied as rich text — paste directly into Outlook or Gmail')
    } catch {
      await copyToClipboard(text)
      toast.success('Draft copied to clipboard')
    }
  }

  const handleExport = () => {
    const draft = draftText || generatedDraft
    const md = exportToMarkdown(inv, inv.client!, iocs || [], [], draft)
    downloadMarkdown(md, `${inv.client!.short_code}_${inv.case_number}`)
    toast.success('Markdown report downloaded')
  }

  const handleCopy = async () => {
    await copyToClipboard(draftText || generatedDraft)
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

  // ── Feature 12: Clone ───────────────────────────────────────────────────────
  const handleClone = async () => {
    try {
      const cloned = await cloneInv(inv)
      toast.success(`Cloned as ${cloned.case_number}`)
      navigate(`/investigations/${cloned.id}`)
    } catch (e: any) {
      toast.error('Clone failed: ' + e.message)
    }
  }

  // ── Feature 13: Save SLA ────────────────────────────────────────────────────
  const handleSaveSLA = async () => {
    try {
      await updateInv({
        id: inv.id,
        updates: {
          waiting_on: waitingOn || null,
          sla_due_at: slaDueAt ? new Date(slaDueAt).toISOString() : null,
        }
      })
      toast.success('SLA tracker saved')
      setShowSLAPanel(false)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  // ── Feature 9: IOC quick-add ────────────────────────────────────────────────
  const handleQuickAddIOC = async () => {
    if (!iocModal) return
    setIocSaving(true)
    try {
      await addIOC({
        investigation_id: inv.id,
        type: iocModal.type,
        value_raw: iocModal.value,
        value_defanged: defang(iocModal.value, iocModal.type),
        source: `field:${iocModal.field}`,
        notes: null,
        blocked: false,
      })
      toast.success(`${iocModal.type} added to IOCs`)
      setIocModal(null)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIocSaving(false)
    }
  }

  const existingIocValues = new Set((iocs || []).map(i => i.value_raw))

  // ── Feature 11: Enrich IP ───────────────────────────────────────────────────
  const handleEnrichIP = async (ip: string, field: string) => {
    setEnrichingIp(ip)
    try {
      const data = await enrichIP({
        ip,
        ipinfoKey: settings?.ipinfo_api_key,
        abuseipdbKey: settings?.abuseipdb_api_key
      })
      setEnrichModal({ field, ip, data })
    } catch (e: any) {
      toast.error('Enrichment failed: ' + e.message)
    } finally {
      setEnrichingIp(null)
    }
  }

  const handleAutoFillGeo = async () => {
    if (!enrichModal) return
    const { data } = enrichModal
    const updates: Record<string, string> = { ...formData }
    if (data.ipinfo) {
      if (!updates.source_isp && data.ipinfo.org) updates.source_isp = data.ipinfo.org
      if (!updates.source_geo && data.ipinfo.country) updates.source_geo = `${data.ipinfo.city || ''}, ${data.ipinfo.country}`.trim()
    }
    try {
      await updateInv({ id: inv.id, updates: { field_data: updates } })
      setFormData(updates)
      toast.success('Auto-filled geo & ISP fields')
      setEnrichModal(null)
    } catch (e: any) {
      toast.error('Failed to save fields: ' + e.message)
    }
  }

  // ── Feature 17: AI Observations ──────────────────────────────────────────────
  const handleGenerateAIObservations = async () => {
    if (!rule) {
      toast.error('No template data found to generate observations.')
      return
    }
    try {
      const generated = await generateAIObs({
        fieldData: formData,
        templateData: { name: rule.name, description: rule.description }
      })
      const newObs = [...(inv.observations || []), ...generated]
      await updateInv({ id: inv.id, updates: { observations: newObs } })
      toast.success('Generated and added AI observations!')
    } catch (e: any) {
      toast.error('AI Generation failed: ' + e.message)
    }
  }

  return (
    <div className="space-y-6">
      <ClientBanner client={inv.client} caseNumber={inv.case_number} severity={inv.severity} />

      {/* ── SLA alert banner (Feature 13) ── */}
      {inv.status === 'pending_response' && inv.sla_due_at && (
        <div
          className={cn(
            'flex items-center justify-between gap-4 px-4 py-3 rounded-lg border text-sm',
            new Date(inv.sla_due_at).getTime() < Date.now()
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          )}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              <strong>Pending Response</strong>
              {inv.waiting_on && <> — waiting on <strong>{inv.waiting_on}</strong></>}
            </span>
          </div>
          <span className="font-mono font-bold">{slaLabel(inv.sla_due_at)}</span>
        </div>
      )}

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

        <div className="flex gap-2 flex-wrap justify-end">
          {inv.status !== 'closed' && (
            <button
              onClick={() => handleUpdateStatus('closed')}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> Close Case
            </button>
          )}
          {/* Feature 12: Clone */}
          <button
            onClick={handleClone}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-surface-border rounded-lg text-sm font-medium hover:bg-accent transition-colors"
          >
            <GitBranch className="w-4 h-4" /> Clone
          </button>
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
            {tab === 'iocs' ? `IOCs${iocs?.length ? ` (${iocs.length})` : ''}` : tab}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* ═══════════════ DETAILS TAB ═══════════════ */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Fields */}
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
                  {Object.entries(formData).map(([k, v]) => {
                    // Feature 9: detect IOC candidates
                    const iocType = v ? detectIOCType(v) : null
                    const alreadyAdded = existingIocValues.has(v)
                    return (
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
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-mono text-foreground break-words flex-1">{v || '-'}</div>
                            {/* 🔍 Lookup button (Feature 11) */}
                            {iocType === 'IP' && (
                              <button
                                onClick={() => handleEnrichIP(v, k)}
                                disabled={enrichingIp === v}
                                title="Lookup Reputation"
                                className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                              >
                                <Search className={cn("w-3 h-3", enrichingIp === v && "animate-spin")} /> LOOKUP
                              </button>
                            )}
                            {/* ⊕ IOC button (Feature 9) */}
                            {iocType && !alreadyAdded && v && (
                              <button
                                onClick={() => setIocModal({ type: iocType, value: v, field: k })}
                                title={`Add as ${iocType} IOC`}
                                className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                              >
                                <Zap className="w-3 h-3" /> IOC
                              </button>
                            )}
                            {iocType && alreadyAdded && v && (
                              <span className="shrink-0 text-[10px] text-emerald-500 font-bold uppercase">✓ IOC</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {Object.keys(formData).length === 0 && (
                    <div className="col-span-full text-sm text-muted-foreground">No field data recorded.</div>
                  )}
                </div>
              </div>

              {/* Feature 8: Observation Checklist from template */}
              {rule != null && (rule.observationsChecklist?.length ?? 0) > 0 && (
                <div className="glass-card p-6 border border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      Observation Checklist
                      <span className="text-xs text-muted-foreground font-normal">— from template</span>
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {checklistAccepted.size}/{rule.observationsChecklist?.length ?? 0} accepted
                    </span>
                  </div>
                  <div className="space-y-3">
                    {(rule.observationsChecklist ?? []).map(oc => {
                      const accepted = checklistAccepted.has(oc.id)
                      return (
                        <div
                          key={oc.id}
                          className={cn(
                            'rounded-lg border p-3 transition-all',
                            accepted
                              ? 'border-emerald-500/30 bg-emerald-500/5'
                              : 'border-surface-border bg-surface'
                          )}
                        >
                          <textarea
                            rows={2}
                            value={checklistDrafts[oc.id] || oc.text}
                            onChange={e => setChecklistDrafts(prev => ({ ...prev, [oc.id]: e.target.value }))}
                            disabled={accepted}
                            className="w-full bg-transparent text-sm text-foreground resize-none outline-none disabled:opacity-60 leading-relaxed"
                          />
                          {!accepted ? (
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => handleAcceptChecklist(oc.id)}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-md bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Accept & Add
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-emerald-500 font-medium mt-1">✓ Added to observations</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Observations (manual) */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Observations</h3>
                  <button
                    onClick={handleGenerateAIObservations}
                    disabled={isGeneratingAI}
                    className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 disabled:opacity-50 transition-colors"
                  >
                    <Sparkles className={cn("w-3.5 h-3.5", isGeneratingAI && "animate-pulse text-indigo-300")} />
                    {isGeneratingAI ? 'Drafting...' : 'Draft with AI'}
                  </button>
                </div>
                {inv.observations?.length > 0 ? (
                  <ul className="space-y-3 mb-4">
                    {inv.observations.map((obs, i) => (
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
                  <p className="text-sm text-muted-foreground mb-4">No observations recorded.</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newObservation}
                    onChange={(e) => setNewObservation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddObservation()}
                    placeholder="Add a new observation..."
                    className="flex-1 bg-background border border-surface-border rounded-lg p-2 text-sm text-foreground focus:border-primary/50 outline-none"
                  />
                  <button
                    onClick={handleAddObservation}
                    disabled={!newObservation.trim() || savingStatus}
                    className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>
            </div>

            {/* ── Sidebar ── */}
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

              {/* Feature 13: SLA / Pending Response Tracker */}
              <div className="glass-card p-6">
                <button
                  onClick={() => setShowSLAPanel(v => !v)}
                  className="w-full flex items-center justify-between text-sm font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    SLA Tracker
                    {inv.sla_due_at && (
                      <span className={cn('text-xs font-mono', slaColor(inv.sla_due_at))}>
                        {slaLabel(inv.sla_due_at)}
                      </span>
                    )}
                  </span>
                  {showSLAPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showSLAPanel && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Waiting On</label>
                      <input
                        type="text"
                        value={waitingOn}
                        onChange={e => setWaitingOn(e.target.value)}
                        placeholder="e.g. Client IT Team, John Smith"
                        className="w-full bg-background border border-surface-border rounded-lg p-2 text-sm text-foreground focus:border-primary/50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Expected Response By</label>
                      <input
                        type="datetime-local"
                        value={slaDueAt}
                        onChange={e => setSlaDueAt(e.target.value)}
                        className="w-full bg-background border border-surface-border rounded-lg p-2 text-sm text-foreground focus:border-primary/50 outline-none"
                      />
                    </div>
                    <button
                      onClick={handleSaveSLA}
                      className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Save SLA
                    </button>
                    {inv.sla_due_at && (
                      <button
                        onClick={() => updateInv({ id: inv.id, updates: { waiting_on: null, sla_due_at: null } }).then(() => { setSlaDueAt(''); setWaitingOn('') })}
                        className="w-full text-xs text-muted-foreground hover:text-foreground py-1"
                      >
                        Clear SLA
                      </button>
                    )}
                  </div>
                )}

                {!showSLAPanel && !inv.sla_due_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Set a deadline when waiting on client or team response.
                  </p>
                )}
              </div>

              {/* Template info */}
              {rule && (
                <div className="glass-card p-6">
                  <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Alert Template</h3>
                  <p className="text-sm font-medium">{rule.name}</p>
                  {rule.mitreTactics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {rule.mitreTactics.map(t => (
                        <span key={t} className="text-[10px] uppercase bg-surface border border-surface-border px-1.5 py-0.5 rounded text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ DRAFT TAB ═══════════════ */}
        {activeTab === 'draft' && (
          <div className="glass-card p-0 overflow-hidden flex flex-col" style={{ minHeight: 560 }}>
            <div className="bg-surface border-b border-surface-border p-4 flex justify-between items-center gap-2 flex-wrap">
              <h3 className="font-semibold flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" /> Email Draft
                <span className="text-xs text-muted-foreground font-normal">— editable before sending</span>
              </h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleRegenerateDraft}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-surface-border rounded-lg text-sm font-medium hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </button>
                <button
                  onClick={handleCopyRichText}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-surface-border rounded-lg text-sm font-medium hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  <FileType2 className="w-3.5 h-3.5" /> Copy Rich Text
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors"
                >
                  <Copy className="w-4 h-4" /> Copy Plain
                </button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <textarea
                className="w-full h-full min-h-[440px] bg-background border border-surface-border rounded-lg p-4 text-sm font-mono text-foreground resize-none focus:border-primary/50 outline-none leading-relaxed"
                value={draftText ?? generatedDraft}
                onChange={(e) => setDraftText(e.target.value)}
                onBlur={(e) => handleSaveDraft(e.target.value)}
                spellCheck={false}
              />
            </div>
            <div className="bg-amber-500/10 border-t border-amber-500/20 p-3 text-xs text-amber-500 text-center">
              Edits are auto-saved. Team name &amp; sign-off pulled from{' '}
              <a href="/settings" className="underline hover:text-amber-400">Settings → Team Profile</a>.
            </div>
          </div>
        )}

        {/* ═══════════════ IOCs TAB ═══════════════ */}
        {activeTab === 'iocs' && (
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Indicators of Compromise</h3>
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
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No IOCs recorded.</p>
                <p className="text-xs mt-1">Use the ⚡ IOC buttons in the Details tab to quickly add IOCs from field values.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════ IOC Quick-Add Modal (Feature 9) ═══════════════ */}
      {iocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIocModal(null)}>
          <div className="bg-surface border border-surface-border rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold">Add IOC</h3>
                <p className="text-xs text-muted-foreground">Detected from field: <code className="font-mono">{iocModal.field.replace(/_/g, ' ')}</code></p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="bg-background border border-surface-border rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Type</div>
                <div className="font-medium">{iocModal.type}</div>
              </div>
              <div className="bg-background border border-surface-border rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Value (raw)</div>
                <div className="font-mono text-sm break-all">{iocModal.value}</div>
              </div>
              <div className="bg-background border border-surface-border rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Value (defanged)</div>
                <div className="font-mono text-sm text-amber-300 break-all">{defang(iocModal.value, iocModal.type)}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIocModal(null)}
                className="flex-1 py-2 rounded-lg border border-surface-border text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickAddIOC}
                disabled={iocSaving}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {iocSaving ? 'Adding…' : 'Add to IOCs'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ Enrichment Modal (Feature 11) ═══════════════ */}
      {enrichModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEnrichModal(null)}>
          <div className="bg-surface border border-surface-border rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold">IP Reputation</h3>
                <p className="text-xs text-muted-foreground font-mono">{enrichModal.ip}</p>
              </div>
            </div>

            <div className="space-y-4 mb-5">
              {/* ipinfo */}
              <div className="bg-background border border-surface-border rounded-lg p-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">ipinfo.io</h4>
                {enrichModal.data.ipinfo ? (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">ISP/Org:</span> <span className="font-medium">{enrichModal.data.ipinfo.org || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Location:</span> <span className="font-medium">{enrichModal.data.ipinfo.city}, {enrichModal.data.ipinfo.country}</span></div>
                    {enrichModal.data.ipinfo.privacy && (
                      <div className="flex justify-between mt-1 text-xs">
                        <span className="text-muted-foreground">Privacy:</span>
                        <span className="text-amber-400 font-bold">
                          {enrichModal.data.ipinfo.privacy.vpn ? 'VPN ' : ''}
                          {enrichModal.data.ipinfo.privacy.proxy ? 'Proxy ' : ''}
                          {enrichModal.data.ipinfo.privacy.tor ? 'Tor ' : ''}
                          {enrichModal.data.ipinfo.privacy.hosting ? 'Hosting ' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No IPinfo data available.</p>
                )}
              </div>

              {/* abuseipdb */}
              <div className="bg-background border border-surface-border rounded-lg p-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">AbuseIPDB</h4>
                {enrichModal.data.abuseipdb ? (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Abuse Confidence:</span>
                      <span className={cn("font-bold", enrichModal.data.abuseipdb.abuseConfidenceScore > 0 ? "text-red-400" : "text-emerald-400")}>
                        {enrichModal.data.abuseipdb.abuseConfidenceScore}%
                      </span>
                    </div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Reports:</span> <span className="font-medium">{enrichModal.data.abuseipdb.totalReports}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Usage Type:</span> <span className="font-medium">{enrichModal.data.abuseipdb.usageType || '-'}</span></div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No AbuseIPDB data available.</p>
                )}
              </div>

              {enrichModal.data.cached && (
                <p className="text-[10px] text-muted-foreground text-center italic mt-2">Results fetched from global cache</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEnrichModal(null)}
                className="flex-1 py-2 rounded-lg border border-surface-border text-sm font-medium hover:bg-accent transition-colors"
              >
                Close
              </button>
              {enrichModal.data.ipinfo && (
                <button
                  onClick={handleAutoFillGeo}
                  className="flex-1 py-2 rounded-lg bg-blue-500 text-blue-950 text-sm font-bold hover:bg-blue-400 transition-colors flex justify-center items-center gap-2"
                >
                  Auto-fill Geo/ISP
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

