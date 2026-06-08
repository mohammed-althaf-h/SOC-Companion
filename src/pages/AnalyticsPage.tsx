import { BarChart3, TrendingUp, Shield, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const VERDICT_COLORS: Record<string, string> = {
  true_positive: '#ef4444',
  false_positive: '#10b981',
  benign: '#6366f1',
  inconclusive: '#f59e0b',
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#6366f1',
}

function useAnalyticsData() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investigations')
        .select('id, status, severity, verdict, created_at, alert_name, closed_at:updated_at, client:clients(name, color_tag)')
      if (error) throw error
      return data ?? []
    },
  })
}

export default function AnalyticsPage() {
  const { data: investigations, isLoading } = useAnalyticsData()

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => <div key={i} className="glass-card h-72 skeleton" />)}
      </div>
    )
  }

  const total = investigations?.length ?? 0

  // Verdict distribution
  const verdictCounts: Record<string, number> = { true_positive: 0, false_positive: 0, benign: 0, inconclusive: 0, pending: 0 }
  investigations?.forEach((inv) => {
    if (inv.verdict) verdictCounts[inv.verdict] = (verdictCounts[inv.verdict] ?? 0) + 1
    else verdictCounts.pending++
  })
  const verdictData = Object.entries(verdictCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value, key: name }))

  // Severity breakdown
  const sevCounts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 }
  investigations?.forEach((inv) => { sevCounts[inv.severity] = (sevCounts[inv.severity] ?? 0) + 1 })
  const severityData = Object.entries(sevCounts).map(([name, value]) => ({ name, value }))

  // Investigations over time (last 14 days)
  const days: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days[d.toISOString().slice(0, 10)] = 0
  }
  investigations?.forEach((inv) => {
    const day = inv.created_at.slice(0, 10)
    if (day in days) days[day]++
  })
  const timelineData = Object.entries(days).map(([date, count]) => ({
    date: date.slice(5), // MM-DD
    count,
  }))

  // Top 8 alert rules
  const ruleCounts: Record<string, number> = {}
  investigations?.forEach((inv) => {
    ruleCounts[inv.alert_name] = (ruleCounts[inv.alert_name] ?? 0) + 1
  })
  const topRules = Object.entries(ruleCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({ name: name.length > 32 ? name.slice(0, 32) + '…' : name, count }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" /> Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aggregate view of investigation trends across all clients.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Cases', value: total, icon: Shield, color: 'text-primary' },
          { label: 'True Positives', value: verdictCounts.true_positive, icon: TrendingUp, color: 'text-red-400' },
          { label: 'False Positives', value: verdictCounts.false_positive, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Pending Verdict', value: verdictCounts.pending, icon: Clock, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-5">
            <div className={`flex items-center gap-2 text-muted-foreground mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs font-medium">{label}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-5">Investigations — Last 14 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={timelineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e5e7eb' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Verdict donut */}
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-5">Verdict Distribution</h2>
          {verdictData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No verdicts recorded yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={verdictData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {verdictData.map((entry) => (
                    <Cell key={entry.key} fill={VERDICT_COLORS[entry.key] ?? '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e5e7eb' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Severity breakdown */}
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-5">Severity Breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={severityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e5e7eb' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] ?? '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top rules */}
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-5">Top Triggered Alert Rules</h2>
          {topRules.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No data yet</div>
          ) : (
            <div className="space-y-2">
              {topRules.map(({ name, count }) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5 text-right flex-shrink-0">{count}</span>
                  <div className="flex-1 bg-surface rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${(count / (topRules[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-foreground truncate max-w-[160px]">{name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
