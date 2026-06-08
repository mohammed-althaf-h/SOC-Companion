import { Outlet } from 'react-router-dom'
import { Menu, Shield } from 'lucide-react'
import Sidebar from './Sidebar'
import { useClientStore } from '@/store/clientStore'
import { cn } from '@/lib/utils'

export default function AppShell() {
  const { sidebarCollapsed, setMobileSidebarOpen } = useClientStore()

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#12141f] border-b border-surface-border z-30 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-sm">SOC-Companion</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <Sidebar />
      <main
        className={cn(
          'flex-1 overflow-y-auto transition-all duration-300 w-full',
          'pt-14 md:pt-0',
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        )}
      >
        <div className="min-h-full p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
