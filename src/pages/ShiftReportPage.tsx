import { useState } from 'react'
import { Clock, Copy, Download } from 'lucide-react'
import { useInvestigations } from '@/hooks/useInvestigations'
import { useIOCs } from '@/hooks/useIOCsTimeline'
import { formatDateTime } from '@/lib/utils'

function generateReport(investigations: any[], dateFrom: Date, dateTo: Date): string {
  const invInRange = investigations.filter((inv) => {
    const d = new Date(inv.created_at)
    return d >= dateFrom && d <= dateTo
  })

  const opened = invInRange.length
  const closed = invInRange.filter((i) => i.status === 'closed').length
  const pending = invInRange.filter((i) => i.status === 'pending_response').length
  const tp = invInRange.filter((i) => i.verdict === 'true_positive').length
  const fp = invInRange.filter((i) => i.verdict === 'false_positive').length

  // Group by client
  const byClient = new Map<string, { name: string; color: string; items: any[] }>()
  invInRange.forEach((inv) => {
    const key = inv.client?.id ?? 'unknown'
    if (!byClient.has(key)) {
      byClient.set(key, { name: inv.client?.name ?? 'Unknown', color: inv.client?.color_tag ?? '', items: [] })
    }
    byClient.get(key)!.items.push(inv)
  })

  let md = `# Shift Handoff Report\n\n`
  md += `**Period:** ${dateFrom.toLocaleString()} → ${dateTo.toLocaleString()}\n\n`
  md += `---\n\n`
  md += `## Summary\n\n`
  md += `| Metric | Count |\n|---|---|\n`
  md += `| Cases Opened | ${opened} |\n`
  md += `| Cases Closed | ${closed} |\n`
  md += `| Pending Response | ${pending} |\n`
  md += `| True Positives | ${tp} |\n`
  md += `| False Positives | ${fp} |\n\n`
  md += `---\n\n`
  md += `## Cases by Client\n\n`

  byClient.forEach(({ name, items }) => {
    md += `### ${name} (${items.length} case${items.length !== 1 ? 's' : ''})\n\n`
    items.forEach((inv) => {
      md += `- **${inv.case_number}** — ${inv.alert_name} · ${inv.severity.toUpperCase()} · ${inv.status.replace(/_/g, ' ')}`
      if (inv.verdict) md += ` · *${inv.verdict.replace(/_/g, ' ')}*`
      md += `\n`
    })
    md += `\n`
  })

  if (invInRange.length === 0) {
    md += `*No investigations opened in this period.*\n`
  }

  return md
}

export default function ShiftReportPage() {
  const now = new Date()
  const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000)

  const [from, setFrom] = useState(eightHoursAgo.toISOString().slice(0, 16))
  const [to, setTo] = useState(now.toISOString().slice(0, 16))
  const [generated, setGenerated] = useState('')

  const { data: investigations } = useInvestigations()

  const handleGenerate = () => {
    if (!investigations) return
    const md = generateReport(investigations, new Date(from), new Date(to))
    setGenerated(md)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generated)
  }

  const handleDownload = () => {
    const blob = new Blob([generated], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shift-report-${new Date(from).toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Clock className="w-6 h-6 text-primary" /> Shift Handoff Report
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate a shift summary to hand off to the next analyst.
        </p>
      </div>

      <div className="glass-card p-6 space-y-5">
        <h2 className="font-semibold text-lg">Report Period</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">From</label>
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/50 outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">To</label>
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/50 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              const h8 = new Date(now.getTime() - 8 * 60 * 60 * 1000)
              setFrom(h8.toISOString().slice(0, 16))
              setTo(now.toISOString().slice(0, 16))
            }}
            className="text-xs px-3 py-1.5 bg-surface border border-surface-border rounded-lg hover:bg-accent transition-colors"
          >
            Last 8h
          </button>
          <button
            onClick={() => {
              const h12 = new Date(now.getTime() - 12 * 60 * 60 * 1000)
              setFrom(h12.toISOString().slice(0, 16))
              setTo(now.toISOString().slice(0, 16))
            }}
            className="text-xs px-3 py-1.5 bg-surface border border-surface-border rounded-lg hover:bg-accent transition-colors"
          >
            Last 12h
          </button>
          <button
            onClick={() => {
              const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000)
              setFrom(h24.toISOString().slice(0, 16))
              setTo(now.toISOString().slice(0, 16))
            }}
            className="text-xs px-3 py-1.5 bg-surface border border-surface-border rounded-lg hover:bg-accent transition-colors"
          >
            Last 24h
          </button>
        </div>

        <button
          onClick={handleGenerate}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Generate Report
        </button>
      </div>

      {generated && (
        <div className="glass-card p-0 overflow-hidden">
          <div className="bg-surface border-b border-surface-border p-4 flex justify-between items-center">
            <h3 className="font-semibold">Generated Report</h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-surface-border rounded-lg text-sm font-medium hover:bg-accent transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Markdown
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download .md
              </button>
            </div>
          </div>
          <div className="p-6">
            <pre className="text-sm font-mono text-foreground whitespace-pre-wrap leading-relaxed">{generated}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
