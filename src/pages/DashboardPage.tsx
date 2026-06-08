import { Link } from 'react-router-dom'
import { ShieldAlert, Users, LayoutDashboard, Settings, Plus, Clock, AlertTriangle } from 'lucide-react'
import { useInvestigationStats, useInvestigations } from '@/hooks/useInvestigations'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import { cn } from '@/lib/utils'

function slaUrgencyClass(dueAt: string | null): string {
  if (!dueAt) return 'border-surface-border'
  const diff = new Date(dueAt).getTime() - Date.now()
  if (diff < 0) return 'border-red-500/50 bg-red-500/5'
  if (diff < 2 * 3600_000) return 'border-amber-500/50 bg-amber-500/5'
  return 'border-surface-border'
}

function slaLabel(dueAt: string | null): string {
  if (!dueAt) return ''
  const diff = new Date(dueAt).getTime() - Date.now()
  if (diff < 0) return `Overdue`
  const h = Math.floor(diff / 3600_000)
  const m = Math.floor((diff % 3600_000) / 60_000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useInvestigationStats()
  // Pending-response cases with SLA set
  const { data: pendingInvs } = useInvestigations({ status: 'pending_response' })
  const slaTracked = (pendingInvs || []).filter(i => i.sla_due_at)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your current shift and active cases.
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card h-28 skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 text-muted-foreground mb-3">
              <ShieldAlert className="w-5 h-5 text-primary" />
              <h3 className="font-medium">Total Investigations</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.total || 0}</p>
          </div>

          <div className="glass-card p-5 border-blue-500/30">
            <div className="flex items-center gap-3 text-blue-400 mb-3">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-medium text-muted-foreground">Open Cases</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.open || 0}</p>
          </div>

          <div className="glass-card p-5 border-red-500/30">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-medium text-muted-foreground">Critical Severity</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.critical || 0}</p>
          </div>

          <div className="glass-card p-5 border-amber-500/30">
            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <Clock className="w-5 h-5" />
              <h3 className="font-medium text-muted-foreground">Pending Response</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.pending || 0}</p>
          </div>
        </div>
      )}

      {/* ── SLA Tracker widget ─────────────────────────────────────────────── */}
      {slaTracked.length > 0 && (
        <div className="glass-card p-6 border-amber-500/20">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            Awaiting Response — SLA Tracker
          </h2>
          <div className="space-y-2">
            {slaTracked.map(inv => {
              const overdue = inv.sla_due_at && new Date(inv.sla_due_at).getTime() < Date.now()
              return (
                <Link
                  key={inv.id}
                  to={`/investigations/${inv.id}`}
                  className={cn(
                    'flex items-center justify-between gap-4 p-3 rounded-lg border transition-colors hover:opacity-80',
                    slaUrgencyClass(inv.sla_due_at)
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: inv.client?.color_tag || '#6366f1' }}
                    />
                    <div>
                      <p className="text-sm font-medium">{inv.case_number}</p>
                      <p className="text-xs text-muted-foreground">{inv.alert_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {inv.waiting_on && (
                      <p className="text-xs text-muted-foreground">Waiting on: <strong className="text-foreground">{inv.waiting_on}</strong></p>
                    )}
                    <p className={cn('text-xs font-mono font-bold', overdue ? 'text-red-400' : 'text-amber-400')}>
                      {overdue ? '⚠ ' : ''}{slaLabel(inv.sla_due_at)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/investigations/new" className="p-4 rounded-lg bg-surface border border-surface-border hover:border-primary/50 transition-colors flex flex-col gap-2 group">
              <ShieldAlert className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-medium">New Investigation</span>
              <span className="text-xs text-muted-foreground">Start a new draft</span>
            </Link>
            <Link to="/clients" className="p-4 rounded-lg bg-surface border border-surface-border hover:border-primary/50 transition-colors flex flex-col gap-2 group">
              <Users className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-medium">Clients</span>
              <span className="text-xs text-muted-foreground">Manage workspaces</span>
            </Link>
            <Link to="/templates" className="p-4 rounded-lg bg-surface border border-surface-border hover:border-primary/50 transition-colors flex flex-col gap-2 group">
              <ShieldAlert className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-medium">Alert Templates</span>
              <span className="text-xs text-muted-foreground">Browse library</span>
            </Link>
            <Link to="/settings" className="p-4 rounded-lg bg-surface border border-surface-border hover:border-primary/50 transition-colors flex flex-col gap-2 group">
              <Settings className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-medium">Settings</span>
              <span className="text-xs text-muted-foreground">Team profile &amp; API keys</span>
            </Link>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
