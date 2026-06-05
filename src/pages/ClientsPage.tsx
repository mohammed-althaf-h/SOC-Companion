import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Plus, Search, Building2, ExternalLink } from 'lucide-react'
import { useClients } from '@/hooks/useClients'
import ClientBadge from '@/components/clients/ClientBadge'
import ClientModal from '@/components/clients/ClientModal'
import { useClientStore } from '@/store/clientStore'

export default function ClientsPage() {
  const { data: clients, isLoading } = useClients()
  const { setActiveClient } = useClientStore()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredClients = clients?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.short_code.toLowerCase().includes(search.toLowerCase())
  ) || []

  // Ensure active client is cleared when on main clients page
  useEffect(() => {
    setActiveClient(null)
  }, [setActiveClient])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your MSSP client workspaces and view isolated data.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search clients by name or short code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-primary/50"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card h-48 skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="glass-card flex flex-col overflow-hidden hover:border-primary/30 transition-colors group">
              <div 
                className="h-2 w-full" 
                style={{ backgroundColor: client.color_tag }} 
              />
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                      {client.name}
                    </h3>
                    <div className="mt-1">
                      <ClientBadge client={client} />
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-surface border border-surface-border flex items-center justify-center text-muted-foreground">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-2 mt-auto">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Domains</span>
                    <span className="font-medium">{client.associated_domains?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SOC Email</span>
                    <span className="font-medium text-xs truncate max-w-[150px]" title={client.soc_email}>{client.soc_email}</span>
                  </div>
                </div>

                <Link 
                  to={`/clients/${client.id}`}
                  className="mt-6 flex items-center justify-center gap-2 w-full py-2 bg-surface hover:bg-accent rounded-md text-sm font-medium transition-colors border border-surface-border"
                >
                  Enter Workspace
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}

          {filteredClients.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-surface/50 rounded-lg border border-dashed border-surface-border">
              No clients found. Add one to get started.
            </div>
          )}
        </div>
      )}

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  )
}
