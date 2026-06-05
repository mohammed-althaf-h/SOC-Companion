import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useClientStore } from '@/store/clientStore'
import { cn } from '@/lib/utils'

export default function AppShell() {
  const { sidebarCollapsed } = useClientStore()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main
        className={cn(
          'flex-1 overflow-y-auto transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <div className="min-h-full p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
