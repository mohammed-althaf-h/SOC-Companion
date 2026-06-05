import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Client } from '@/types'

interface ClientStore {
  // The currently "active" client context (for banners, guards, etc.)
  activeClient: Client | null
  setActiveClient: (client: Client | null) => void

  // Sidebar collapsed state
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void

  // All clients cache (to avoid re-fetching for cross-contamination checks)
  clientsCache: Client[]
  setClientsCache: (clients: Client[]) => void
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set) => ({
      activeClient: null,
      setActiveClient: (client) => set({ activeClient: client }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      clientsCache: [],
      setClientsCache: (clients) => set({ clientsCache: clients }),
    }),
    {
      name: 'soc-companion-client-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        // Don't persist active client — should be re-set on navigation
      }),
    }
  )
)
