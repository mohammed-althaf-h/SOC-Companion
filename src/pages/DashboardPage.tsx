import { Link } from 'react-router-dom'
import { ShieldAlert, Users, LayoutDashboard, Settings, Plus } from 'lucide-react'
import { useInvestigationStats } from '@/hooks/useInvestigations'

export default function DashboardPage() {
  const { data: stats, isLoading } = useInvestigationStats()

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
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-medium text-muted-foreground">Pending Response</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.pending || 0}</p>
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
              <span className="text-xs text-muted-foreground">App config</span>
            </Link>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="text-sm text-muted-foreground flex items-center justify-center h-48 border border-dashed border-surface-border rounded-lg">
            Activity feed coming soon...
          </div>
        </div>
      </div>
    </div>
  )
}
