import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Investigation, Severity, InvestigationStatus, Verdict, NewInvestigationFormData } from '@/types'

// ─── Fetch all investigations (with client join) ──────────────────────────────
export function useInvestigations(filters?: {
  client_id?: string
  status?: InvestigationStatus
  severity?: Severity
  search?: string
  alert_name?: string
}) {
  return useQuery({
    queryKey: ['investigations', filters],
    queryFn: async () => {
      let q = supabase
        .from('investigations')
        .select('*, client:clients(*)')
        .order('created_at', { ascending: false })

      if (filters?.client_id) q = q.eq('client_id', filters.client_id)
      if (filters?.status)    q = q.eq('status', filters.status)
      if (filters?.severity)  q = q.eq('severity', filters.severity)
      if (filters?.alert_name) q = q.eq('alert_name', filters.alert_name)
      if (filters?.search) {
        q = q.or(
          `case_number.ilike.%${filters.search}%,alert_name.ilike.%${filters.search}%`
        )
      }

      const { data, error } = await q
      if (error) throw error
      return data as Investigation[]
    },
  })
}

// ─── Fetch a single investigation ─────────────────────────────────────────────
export function useInvestigation(id: string | undefined) {
  return useQuery({
    queryKey: ['investigations', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investigations')
        .select('*, client:clients(*)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Investigation
    },
  })
}

// ─── Create investigation ─────────────────────────────────────────────────────
export function useCreateInvestigation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (form: NewInvestigationFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('investigations')
        .insert({
          user_id: user.id,
          client_id: form.client_id,
          alert_rule_id: form.alert_rule_id,
          case_number: form.case_number,
          alert_name: form.alert_name,
          severity: form.severity,
          triggered_at: form.triggered_at,
          field_data: form.field_data,
          observations: form.observations,
          assigned_analyst: user.email,
          status: 'new',
        })
        .select()
        .single()
      if (error) throw error
      return data as Investigation
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['investigations'] })
      qc.invalidateQueries({ queryKey: ['investigations', data.client_id] })
    },
  })
}

// ─── Update investigation fields ──────────────────────────────────────────────
export function useUpdateInvestigation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<{
        status: InvestigationStatus
        severity: Severity
        field_data: Record<string, string>
        observations: string[]
        next_steps: string
        verdict: Verdict
        draft_email: string
        summary: string
        assigned_analyst: string
      }>
    }) => {
      const { data, error } = await supabase
        .from('investigations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Investigation
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['investigations'] })
      qc.invalidateQueries({ queryKey: ['investigations', data.id] })
    },
  })
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────
export function useInvestigationStats() {
  return useQuery({
    queryKey: ['investigation-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investigations')
        .select('status, severity, client_id')
      if (error) throw error

      const total = data.length
      const open = data.filter((i) => i.status !== 'closed').length
      const critical = data.filter((i) => i.severity === 'critical' && i.status !== 'closed').length
      const pending = data.filter((i) => i.status === 'pending_response').length

      return { total, open, critical, pending }
    },
  })
}

// ─── Delete investigation ─────────────────────────────────────────────────────
export function useDeleteInvestigation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('investigations')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investigations'] })
    },
  })
}
