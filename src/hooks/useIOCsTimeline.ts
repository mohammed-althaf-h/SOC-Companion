import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { IOC, TimelineEvent } from '@/types'

// ─── IOCs ─────────────────────────────────────────────────────────────────────
export function useIOCs(investigationId: string | undefined) {
  return useQuery({
    queryKey: ['iocs', investigationId],
    enabled: !!investigationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('iocs')
        .select('*')
        .eq('investigation_id', investigationId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as IOC[]
    },
  })
}

export function useAddIOC() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ioc: Omit<IOC, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('iocs').insert(ioc).select().single()
      if (error) throw error
      return data as IOC
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['iocs', vars.investigation_id] })
    },
  })
}

export function useUpdateIOC() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates, investigation_id }: { id: string; updates: Partial<IOC>; investigation_id: string }) => {
      const { data, error } = await supabase.from('iocs').update(updates).eq('id', id).select().single()
      if (error) throw error
      return { data: data as IOC, investigation_id }
    },
    onSuccess: ({ investigation_id }) => {
      qc.invalidateQueries({ queryKey: ['iocs', investigation_id] })
    },
  })
}

export function useDeleteIOC() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, investigation_id }: { id: string; investigation_id: string }) => {
      const { error } = await supabase.from('iocs').delete().eq('id', id)
      if (error) throw error
      return investigation_id
    },
    onSuccess: (investigation_id) => {
      qc.invalidateQueries({ queryKey: ['iocs', investigation_id] })
    },
  })
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
export function useTimeline(investigationId: string | undefined) {
  return useQuery({
    queryKey: ['timeline', investigationId],
    enabled: !!investigationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('investigation_id', investigationId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as TimelineEvent[]
    },
  })
}

export function useAddTimelineEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (event: Omit<TimelineEvent, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('timeline_events')
        .insert(event)
        .select()
        .single()
      if (error) throw error
      return data as TimelineEvent
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['timeline', vars.investigation_id] })
    },
  })
}
