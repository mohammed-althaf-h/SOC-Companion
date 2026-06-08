import { useState, useRef } from 'react'
import type { FieldDefinition, UserSettings } from '@/types'

interface EmailTemplateEditorProps {
  template: string
  onChange: (template: string) => void
  fields: FieldDefinition[]
}

export default function EmailTemplateEditor({ template, onChange, fields }: EmailTemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)
    
    const newText = `${before}{{${variable}}}${after}`
    onChange(newText)
    
    // Focus and restore cursor
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4)
    }, 0)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-3 space-y-2">
        <label className="text-sm font-medium text-foreground">Email Markdown Template</label>
        <textarea
          ref={textareaRef}
          value={template}
          onChange={e => onChange(e.target.value)}
          className="w-full h-[500px] bg-background border border-surface-border rounded-lg p-4 font-mono text-sm focus:outline-none focus:border-primary resize-none"
          placeholder="Type your email draft template here..."
        />
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">Available Variables</h4>
          <p className="text-xs text-muted-foreground mb-3">Click to insert at cursor</p>
          
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fields</div>
            {fields.length === 0 && <p className="text-xs text-muted-foreground italic">No fields defined</p>}
            {fields.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => insertVariable(f.id)}
                className="block w-full text-left px-2 py-1.5 text-xs bg-surface border border-surface-border rounded hover:border-primary hover:text-primary transition-colors truncate"
                title={f.label}
              >
                {f.id}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-6">Built-in</div>
          <div className="space-y-1">
            {['client_name', 'client_short_code', 'case_number', 'alert_name', 'severity', 'observations'].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="block w-full text-left px-2 py-1.5 text-xs bg-surface border border-surface-border rounded hover:border-primary hover:text-primary transition-colors"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-6">Team Profile</div>
          <div className="space-y-1">
            {['team_name', 'soc_email', 'analyst_name', 'sign_off'].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="block w-full text-left px-2 py-1.5 text-xs bg-surface border border-surface-border rounded hover:border-primary hover:text-primary transition-colors"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
