import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Client, ClientFormData } from '@/types'
import { useClientStore } from '@/store/clientStore'

// ─── Fetch all clients for the current user ───────────────────────────────────
export function useClients() {
  const setClientsCache = useClientStore((s) => s.setClientsCache)

  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      setClientsCache(data as Client[])
      return data as Client[]
    },
  })
}

// ─── Fetch a single client ────────────────────────────────────────────────────
export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['clients', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Client
    },
  })
}

// ─── Create client ────────────────────────────────────────────────────────────
export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (form: ClientFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const domains = form.associated_domains
        ? form.associated_domains.split('\n').map((d) => d.trim()).filter(Boolean)
        : []

      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: form.name.trim(),
          short_code: form.short_code.trim().toUpperCase(),
          color_tag: form.color_tag,
          associated_domains: domains,
          contact_email: form.contact_email || null,
          soc_email: form.soc_email || 'soc@eci.com',
          spoc_name: form.spoc_name || null,
          notes: form.notes || null,
        })
        .select()
        .single()
      if (error) throw error
      return data as Client
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

// ─── Update client ────────────────────────────────────────────────────────────
export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, form }: { id: string; form: Partial<ClientFormData> }) => {
      const domains = form.associated_domains !== undefined
        ? form.associated_domains.split('\n').map((d) => d.trim()).filter(Boolean)
        : undefined

      const payload: Record<string, unknown> = { ...form }
      if (domains !== undefined) payload.associated_domains = domains
      delete payload.associated_domains

      const { data, error } = await supabase
        .from('clients')
        .update({ ...payload, ...(domains !== undefined ? { associated_domains: domains } : {}) })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Client
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['clients', id] })
    },
  })
}

// ─── Delete client ────────────────────────────────────────────────────────────
export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
