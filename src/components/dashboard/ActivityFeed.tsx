import { Link } from 'react-router-dom'
import { useActivityFeed } from '@/hooks/useActivityFeed'
import { formatDateTime } from '@/lib/utils'
import { Activity, RefreshCw } from 'lucide-react'

export default function ActivityFeed() {
  const { data: entries, isLoading, isFetching, refetch } = useActivityFeed()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 skeleton rounded-lg" />
        ))}
      </div>
    )
  }

  if (!entries?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border border-dashed border-surface-border rounded-lg gap-2">
        <Activity className="w-8 h-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No recent activity</p>
        <p className="text-xs text-muted-foreground/60">Start an investigation to see events here</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-muted-foreground">Last {entries.length} events · auto-refreshes every 60s</p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {entries.map((entry) => (
        <Link
          key={entry.id}
          to={`/investigations/${entry.investigationId}`}
          className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface transition-colors group"
        >
          {/* Client color dot */}
          <div
            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
            style={{ backgroundColor: entry.clientColor }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: entry.clientColor + '22', color: entry.clientColor }}
              >
                {entry.clientShortCode}
              </span>
              <span className="text-xs font-mono text-muted-foreground">{entry.caseNumber}</span>
            </div>
            <p className="text-xs text-foreground truncate group-hover:text-primary transition-colors">
              {entry.description}
            </p>
          </div>

          <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
            {formatDateTime(entry.timestamp)}
          </span>
        </Link>
      ))}
    </div>
  )
}
