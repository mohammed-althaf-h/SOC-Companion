import { Search, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { formatDateTime } from '@/lib/utils'

interface IOCResult {
  id: string
  type: string
  value_raw: string
  value_defanged: string | null
  source: string | null
  notes: string | null
  investigation_id: string
  caseNumber: string
  clientName: string
  clientColor: string
  clientShortCode: string
  created_at: string
}

export default function GlobalIOCsPage() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')

  const { data: results, isLoading } = useQuery({
    queryKey: ['global-iocs', submitted],
    enabled: submitted.length >= 2,
    queryFn: async (): Promise<IOCResult[]> => {
      const { data, error } = await supabase
        .from('iocs')
        .select(`
          id, type, value_raw, value_defanged, source, notes, investigation_id, created_at,
          investigation:investigations(case_number, client:clients(name, color_tag, short_code))
        `)
        .ilike('value_raw', `%${submitted}%`)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      return (data ?? []).map((r: any) => ({
        id: r.id,
        type: r.type,
        value_raw: r.value_raw,
        value_defanged: r.value_defanged,
        source: r.source,
        notes: r.notes,
        investigation_id: r.investigation_id,
        caseNumber: r.investigation?.case_number ?? '—',
        clientName: r.investigation?.client?.name ?? 'Unknown',
        clientColor: r.investigation?.client?.color_tag ?? '#6366f1',
        clientShortCode: r.investigation?.client?.short_code ?? '???',
        created_at: r.created_at,
      }))
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(query.trim())
  }

  // Group by value_raw to detect multi-case IOCs
  const valueCounts = new Map<string, number>()
  results?.forEach((r) => {
    valueCounts.set(r.value_raw, (valueCounts.get(r.value_raw) ?? 0) + 1)
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Global IOC Search</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search across all investigations for a specific IP, domain, hash, URL, or email IOC.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter IP, domain, hash, URL or email…"
            className="w-full bg-surface border border-surface-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground focus:border-primary/50 outline-none font-mono"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Search
        </button>
      </form>

      {submitted && (
        <div className="glass-card p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton rounded-lg" />)}
            </div>
          ) : !results?.length ? (
            <div className="text-center py-16 text-muted-foreground">
              No IOCs found matching "<span className="font-mono text-foreground">{submitted}</span>"
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {results.length} match{results.length !== 1 ? 'es' : ''} for{' '}
                  <span className="font-mono text-foreground">{submitted}</span>
                </p>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-surface">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Type</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Case</th>
                    <th className="px-4 py-3 rounded-tr-lg">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {results.map((ioc) => (
                    <tr key={ioc.id} className="hover:bg-surface/50">
                      <td className="px-4 py-3 font-medium text-xs uppercase">{ioc.type}</td>
                      <td className="px-4 py-3 font-mono text-amber-300">
                        {ioc.value_defanged || ioc.value_raw}
                        {(valueCounts.get(ioc.value_raw) ?? 0) > 1 && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-red-500/20 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {valueCounts.get(ioc.value_raw)} cases
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded"
                          style={{ backgroundColor: ioc.clientColor + '22', color: ioc.clientColor }}
                        >
                          {ioc.clientShortCode}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/investigations/${ioc.investigation_id}`}
                          className="font-mono text-primary hover:underline text-xs"
                        >
                          {ioc.caseNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDateTime(ioc.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  )
}
