import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useCreateClient, useUpdateClient } from '@/hooks/useClients'
import type { Client, ClientFormData } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  clientToEdit?: Client
}

const DEFAULT_FORM: ClientFormData = {
  name: '',
  short_code: '',
  color_tag: '#3b82f6',
  associated_domains: '',
  contact_email: '',
  soc_email: 'soc@eci.com',
  spoc_name: '',
  notes: ''
}

export default function ClientModal({ isOpen, onClose, clientToEdit }: Props) {
  const [form, setForm] = useState<ClientFormData>(
    clientToEdit
      ? {
          name: clientToEdit.name,
          short_code: clientToEdit.short_code,
          color_tag: clientToEdit.color_tag,
          associated_domains: clientToEdit.associated_domains?.join('\n') || '',
          contact_email: clientToEdit.contact_email || '',
          soc_email: clientToEdit.soc_email || 'soc@eci.com',
          spoc_name: clientToEdit.spoc_name || '',
          notes: clientToEdit.notes || ''
        }
      : DEFAULT_FORM
  )

  const { mutateAsync: createClient, isPending: isCreating } = useCreateClient()
  const { mutateAsync: updateClient, isPending: isUpdating } = useUpdateClient()

  const isPending = isCreating || isUpdating

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (clientToEdit) {
        await updateClient({ id: clientToEdit.id, form })
      } else {
        await createClient(form)
      }
      onClose()
      if (!clientToEdit) setForm(DEFAULT_FORM)
    } catch (err) {
      console.error('Failed to save client:', err)
      alert('Failed to save client. Please check the console for details.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-surface-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <h2 className="text-xl font-bold text-foreground">
            {clientToEdit ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Acme Corp"
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary/50 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
                Short Code <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="short_code"
                value={form.short_code}
                onChange={handleChange}
                placeholder="e.g. ACME"
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary/50 outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
                Color Tag <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  required
                  name="color_tag"
                  value={form.color_tag}
                  onChange={handleChange}
                  className="h-9 w-9 rounded cursor-pointer bg-transparent border-0 p-0"
                />
                <input
                  required
                  name="color_tag"
                  value={form.color_tag}
                  onChange={handleChange}
                  placeholder="#000000"
                  className="flex-1 bg-background border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary/50 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
                Associated Domains
              </label>
              <textarea
                name="associated_domains"
                value={form.associated_domains}
                onChange={handleChange}
                placeholder="acme.com&#10;acme.org"
                rows={3}
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary/50 outline-none resize-none font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">One domain per line</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
                SOC Email
              </label>
              <input
                name="soc_email"
                type="email"
                value={form.soc_email}
                onChange={handleChange}
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary/50 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
                Contact Email
              </label>
              <input
                name="contact_email"
                type="email"
                value={form.contact_email}
                onChange={handleChange}
                placeholder="security@acme.com"
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary/50 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
                SPOC Name
              </label>
              <input
                name="spoc_name"
                value={form.spoc_name}
                onChange={handleChange}
                placeholder="Jane Doe"
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary/50 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
                Notes
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Any special instructions or context for this client..."
                rows={3}
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary/50 outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-surface-border mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {clientToEdit ? 'Save Changes' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
