import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface EnrichmentResult {
  ipinfo?: any
  abuseipdb?: any
  cached: boolean
}

export function useEnrichIP() {
  return useMutation({
    mutationFn: async ({ ip, ipinfoKey, abuseipdbKey }: { ip: string, ipinfoKey?: string | null, abuseipdbKey?: string | null }) => {
      const { data, error } = await supabase.functions.invoke('enrich-ip', {
        body: { ip, ipinfoKey, abuseipdbKey }
      })

      if (error) throw error
      return data as EnrichmentResult
    }
  })
}
