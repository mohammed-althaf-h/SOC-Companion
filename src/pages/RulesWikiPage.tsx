import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Book, Save, FileSearch, Search, Clock, ShieldAlert } from 'lucide-react'
import { useRulesWiki, useUpdateRuleWiki } from '@/hooks/useRulesWiki'
import { useInvestigations } from '@/hooks/useInvestigations'
import { cn, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { RuleWiki } from '@/types'

export default function RulesWikiPage() {
  const { data: rulesWiki, isLoading: rulesLoading } = useRulesWiki()
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Set first rule as selected by default if none selected
  useEffect(() => {
    if (rulesWiki && rulesWiki.length > 0 && !selectedRuleId) {
      setSelectedRuleId(rulesWiki[0].id)
    }
  }, [rulesWiki, selectedRuleId])

  const selectedRule = rulesWiki?.find(r => r.id === selectedRuleId)
  
  const filteredRules = rulesWiki?.filter(r => 
    r.rule_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-6 animate-fade-in">
      {/* Left Sidebar - Rules List */}
      <div className="w-80 flex flex-col glass-card p-0 overflow-hidden shrink-0">
        <div className="p-4 border-b border-surface-border">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Book className="w-5 h-5 text-primary" /> Rules Wiki
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg pl-9 pr-4 py-2 text-sm focus:border-primary/50 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {rulesLoading ? (
            <div className="p-4 text-sm text-muted-foreground text-center animate-pulse">Loading rules...</div>
          ) : filteredRules?.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">No rules found.</div>
          ) : (
            filteredRules?.map(rule => (
              <button
                key={rule.id}
                onClick={() => setSelectedRuleId(rule.id)}
                className={cn(
                  "w-full text-left px-3 py-3 rounded-lg text-sm transition-all border",
                  selectedRuleId === rule.id
                    ? "bg-primary/10 border-primary/30 text-primary font-medium"
                    : "bg-transparent border-transparent text-foreground/80 hover:bg-surface-elevated"
                )}
              >
                {rule.rule_name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedRule ? (
          <RuleEditor rule={selectedRule} />
        ) : (
          <div className="flex-1 glass-card flex items-center justify-center text-muted-foreground">
            {rulesWiki?.length === 0 ? "No rules created yet. Draft an investigation to create a rule." : "Select a rule from the sidebar."}
          </div>
        )}
      </div>
    </div>
  )
}

function RuleEditor({ rule }: { rule: RuleWiki }) {
  const [content, setContent] = useState(rule.content)
  const { mutateAsync: updateRule, isPending } = useUpdateRuleWiki()

  // Reset content when rule changes
  useEffect(() => {
    setContent(rule.content)
  }, [rule])

  const handleSave = async () => {
    try {
      await updateRule({ id: rule.id, content })
      toast.success('Wiki updated')
    } catch (e: any) {
      toast.error(e.message || 'Failed to update wiki')
    }
  }

  const { data: investigations, isLoading: invLoading } = useInvestigations({
    alert_name: rule.rule_name
  })

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-12">
      {/* Wiki Editor Section */}
      <div className="glass-card flex flex-col min-h-[400px]">
        <div className="p-6 border-b border-surface-border flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-primary" /> {rule.rule_name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add your notes, SOPs, and observations for this alert rule here.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isPending || content === rule.content}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Saving...' : 'Save Notes'} <Save className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 p-0">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Type your wiki notes here... (Markdown supported mentally, though rendered as text for now)"
            className="w-full h-full min-h-[300px] p-6 bg-transparent resize-none outline-none text-sm font-mono text-foreground/90 leading-relaxed"
          />
        </div>
      </div>

      {/* Appended Drafts Section */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
          <FileSearch className="w-5 h-5 text-primary" /> Appended Drafts & Investigations
        </h2>
        
        {invLoading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse text-sm">Loading drafts...</div>
        ) : investigations?.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-surface-border rounded-xl text-muted-foreground text-sm">
            No drafts have been created under this rule yet.
          </div>
        ) : (
          <div className="space-y-4">
            {investigations?.map(inv => (
              <div key={inv.id} className="bg-surface border border-surface-border rounded-xl p-4 transition-all hover:border-primary/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary">{inv.case_number}</span>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-surface-elevated rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDateTime(inv.created_at)}
                    </span>
                    {inv.client && (
                      <span className="text-xs font-bold" style={{ color: inv.client.color_tag }}>
                        {inv.client.short_code}
                      </span>
                    )}
                  </div>
                  <Link 
                    to={`/investigations/${inv.id}`}
                    className="text-xs font-medium bg-surface-elevated hover:bg-primary/20 hover:text-primary px-3 py-1 rounded-full transition-colors border border-surface-border"
                  >
                    View Case
                  </Link>
                </div>
                
                {/* Draft Preview */}
                <div className="mt-4 p-4 bg-[#12141f] rounded-lg border border-surface-border/50">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Draft Content</h4>
                  {inv.draft_email ? (
                    <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap line-clamp-6">
                      {inv.draft_email}
                    </pre>
                  ) : (
                    <div className="text-xs text-muted-foreground/60 italic">
                      Draft email has not been generated for this case yet. 
                      <br/>
                      Extracted Fields: {Object.keys(inv.field_data).length}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
