import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FileSearch, ShieldAlert, BookOpen, Clock } from 'lucide-react'
import { useClient } from '@/hooks/useClients'
import { useInvestigations } from '@/hooks/useInvestigations'
import { useClientStore } from '@/store/clientStore'
import ClientBanner from '@/components/layout/ClientBanner'
import { cn, severityClass, statusClass, statusLabel, formatDateTime } from '@/lib/utils'

export default function ClientWorkspacePage() {
  const { id } = useParams()
  const { data: client, isLoading } = useClient(id)
  const { data: investigations } = useInvestigations({ client_id: id })
  const { setActiveClient } = useClientStore()
  const [activeTab, setActiveTab] = useState<'overview' | 'investigations' | 'iocs' | 'notes'>('overview')

  useEffect(() => {
    if (client) setActiveClient(client)
    return () => setActiveClient(null)
  }, [client, setActiveClient])

  if (isLoading || !client) return <div className="skeleton h-[400px] rounded-xl" />

  const openInvs = investigations?.filter(i => i.status !== 'closed') || []

  return (
    <div className="space-y-6">
      <ClientBanner client={client} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm flex gap-4">
            <span>SPOC: {client.spoc_name || 'N/A'}</span>
            <span>Email: {client.contact_email || 'N/A'}</span>
          </p>
        </div>
        <Link 
          to={`/investigations/new?client=${client.id}`}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <FileSearch className="w-4 h-4" />
          New Investigation
        </Link>
      </div>

      <div className="flex border-b border-surface-border">
        {(['overview', 'investigations', 'iocs', 'notes'] as const).map(tab => (
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
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-primary" />
                  Recent Open Investigations
                </h2>
                {openInvs.length > 0 ? (
                  <div className="space-y-3">
                    {openInvs.slice(0,5).map(inv => (
                      <Link 
                        key={inv.id} 
                        to={`/investigations/${inv.id}`}
                        className="block p-4 rounded-lg bg-surface border border-surface-border hover:border-primary/30 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-mono text-muted-foreground">{inv.case_number}</span>
                            <h4 className="font-medium mt-1">{inv.alert_name}</h4>
                          </div>
                          <div className="flex gap-2">
                            <span className={cn('text-xs px-2 py-0.5 rounded font-bold uppercase', severityClass(inv.severity))}>
                              {inv.severity}
                            </span>
                            <span className={cn('text-xs px-2 py-0.5 rounded font-bold border uppercase', statusClass(inv.status))}>
                              {statusLabel(inv.status)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-surface-border rounded-lg">
                    No open investigations. All clear.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-3">Associated Domains</h3>
                <div className="space-y-2">
                  {client.associated_domains?.length > 0 ? (
                    client.associated_domains.map(d => (
                      <div key={d} className="text-sm font-mono bg-surface p-2 rounded border border-surface-border truncate">
                        {d}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No domains registered.</p>
                  )}
                </div>
              </div>

              <div className="glass-card p-6 bg-amber-500/5 border-amber-500/20">
                <h3 className="font-semibold mb-3 text-amber-500 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Shift Notes
                </h3>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {client.notes || 'No active handover notes.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'investigations' && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">All Investigations</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-surface">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Case</th>
                    <th className="px-4 py-3">Alert</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Triggered</th>
                    <th className="px-4 py-3 rounded-tr-lg text-right">Analyst</th>
                  </tr>
                </thead>
                <tbody>
                  {investigations?.map(inv => (
                    <tr key={inv.id} className="border-b border-surface-border hover:bg-surface/50">
                      <td className="px-4 py-3 font-mono">
                        <Link to={`/investigations/${inv.id}`} className="text-primary hover:underline">{inv.case_number}</Link>
                      </td>
                      <td className="px-4 py-3 font-medium">{inv.alert_name}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-[10px] px-2 py-0.5 rounded font-bold uppercase', severityClass(inv.severity))}>{inv.severity}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-[10px] px-2 py-0.5 rounded font-bold border uppercase', statusClass(inv.status))}>{statusLabel(inv.status)}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(inv.triggered_at)}</td>
                      <td className="px-4 py-3 text-right">{inv.assigned_analyst}</td>
                    </tr>
                  ))}
                  {!investigations?.length && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">No investigations found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Placeholder for IOCs and Notes */}
        {(activeTab === 'iocs' || activeTab === 'notes') && (
          <div className="glass-card p-12 text-center text-muted-foreground">
            {activeTab} module coming soon...
          </div>
        )}
      </div>
    </div>
  )
}
