import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileSearch,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
  BarChart3,
  Clock,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClientStore } from '@/store/clientStore'
import { useAuth } from '@/hooks/useAuth'
import { useUserSettings } from '@/hooks/useUserSettings'
import { toast } from 'sonner'

const NAV_ITEMS = [
  { to: '/',               icon: LayoutDashboard, label: 'Dashboard',       end: true },
  { to: '/clients',        icon: Users,           label: 'Clients' },
  { to: '/investigations', icon: FileSearch,      label: 'Investigations' },
  { to: '/templates',      icon: BookOpen,        label: 'Alert Templates' },
  { to: '/rules-wiki',     icon: BookOpen,        label: 'Rules Wiki' },
  { to: '/iocs',           icon: Search,          label: 'Global IOCs' },
  { to: '/analytics',      icon: BarChart3,       label: 'Analytics' },
  { to: '/shift-report',   icon: Clock,           label: 'Shift Report' },
  { to: '/settings',       icon: Settings,        label: 'Settings' },
]

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useClientStore()
  const { user, signOut, analystName } = useAuth()
  const { data: settings } = useUserSettings()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300',
          'bg-[#12141f] border-r border-surface-border',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 h-16 border-b border-surface-border',
        sidebarCollapsed && 'justify-center px-0'
      )}>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-foreground leading-tight">SOC-Companion</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">
              {settings?.team_name ?? 'SOC Platform'}
            </p>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'nav-link',
                isActive && 'active',
                sidebarCollapsed && 'justify-center px-0'
              )
            }
            title={sidebarCollapsed ? label : undefined}
            onClick={() => setMobileSidebarOpen(false)}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + collapse */}
      <div className="border-t border-surface-border p-2 space-y-1">
        {/* User info */}
        {!sidebarCollapsed && (
          <div className="px-3 py-2 rounded-lg bg-surface">
            <p className="text-xs font-medium text-foreground truncate">{analystName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className={cn(
            'nav-link w-full text-destructive hover:text-destructive hover:bg-destructive/10',
            sidebarCollapsed && 'justify-center px-0'
          )}
          title={sidebarCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span>Sign Out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            'nav-link w-full',
            sidebarCollapsed && 'justify-center px-0'
          )}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed
            ? <ChevronRight className="w-4 h-4" />
            : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
    </>
  )
}
