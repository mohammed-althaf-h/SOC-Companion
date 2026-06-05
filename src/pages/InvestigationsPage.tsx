import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Plus, Shield } from 'lucide-react'
import { useInvestigations } from '@/hooks/useInvestigations'
import { useClients } from '@/hooks/useClients'
import ClientBadge from '@/components/clients/ClientBadge'
import { cn, severityClass, statusClass, statusLabel, formatDateTime } from '@/lib/utils'

export default function InvestigationsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [clientFilter, setClientFilter] = useState<string>('')

  const { data: investigations, isLoading } = useInvestigations({
    search: search || undefined,
    status: statusFilter ? (statusFilter as any) : undefined,
    severity: severityFilter ? (severityFilter as any) : undefined,
    client_id: clientFilter || undefined,
  })

  const { data: clients } = useClients()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investigations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Global view of all investigations across all client workspaces.
          </p>
        </div>
        <Link 
          to="/investigations/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Investigation
        </Link>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by case number or alert name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          
          <select 
            value={clientFilter} 
            onChange={(e) => setClientFilter(e.target.value)}
            className="bg-surface border border-surface-border rounded-lg text-sm px-3 py-2 outline-none focus:border-primary/50"
          >
            <option value="">All Clients</option>
            {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-surface-border rounded-lg text-sm px-3 py-2 outline-none focus:border-primary/50"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_response">Pending Response</option>
            <option value="closed">Closed</option>
          </select>

          <select 
            value={severityFilter} 
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-surface border border-surface-border rounded-lg text-sm px-3 py-2 outline-none focus:border-primary/50"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="glass-card h-[400px] skeleton" />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-surface border-b border-surface-border">
                <tr>
                  <th className="px-4 py-4 font-semibold">Case</th>
                  <th className="px-4 py-4 font-semibold">Client</th>
                  <th className="px-4 py-4 font-semibold">Alert Name</th>
                  <th className="px-4 py-4 font-semibold">Severity</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Triggered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {investigations?.map(inv => (
                  <tr key={inv.id} className="hover:bg-surface/50 transition-colors group">
                    <td className="px-4 py-4">
                      <Link 
                        to={`/investigations/${inv.id}`} 
                        className="font-mono text-primary font-medium group-hover:underline"
                      >
                        {inv.case_number}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      {inv.client && <ClientBadge client={inv.client} />}
                    </td>
                    <td className="px-4 py-4 font-medium text-foreground">{inv.alert_name}</td>
                    <td className="px-4 py-4">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded font-bold uppercase', severityClass(inv.severity))}>
                        {inv.severity}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded font-bold border uppercase', statusClass(inv.status))}>
                        {statusLabel(inv.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDateTime(inv.triggered_at)}
                    </td>
                  </tr>
                ))}
                {!investigations?.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Shield className="w-12 h-12 mb-3 opacity-20" />
                        <p>No investigations found matching criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
