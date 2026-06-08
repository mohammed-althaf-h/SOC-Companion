import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ActivityEntry {
  id: string
  investigationId: string
  caseNumber: string
  clientName: string
  clientColor: string
  clientShortCode: string
  description: string
  timestamp: string
}

export function useActivityFeed(limit = 12) {
  return useQuery({
    queryKey: ['activity-feed'],
    queryFn: async (): Promise<ActivityEntry[]> => {
      // Fetch latest timeline events joined with investigation + client
      const { data, error } = await supabase
        .from('timeline_events')
        .select(`
          id,
          description,
          created_at,
          investigation:investigations(
            id,
            case_number,
            client:clients(name, color_tag, short_code)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data ?? [])
        .filter((e: any) => e.investigation)
        .map((e: any) => ({
          id: e.id,
          investigationId: e.investigation.id,
          caseNumber: e.investigation.case_number,
          clientName: e.investigation.client?.name ?? 'Unknown',
          clientColor: e.investigation.client?.color_tag ?? '#6366f1',
          clientShortCode: e.investigation.client?.short_code ?? '???',
          description: e.description,
          timestamp: e.created_at,
        }))
    },
    refetchInterval: 60_000, // auto-refresh every 60 seconds
  })
}
