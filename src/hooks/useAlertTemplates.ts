import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AlertRule } from '@/types'

// Convert from DB row to AlertRule
const mapDbToAlertRule = (row: any): AlertRule => ({
  id: row.id,
  name: row.name,
  category: row.category,
  description: row.description,
  defaultSeverity: row.default_severity,
  mitreTactics: row.mitre_tactics || [],
  fieldsSchema: row.fields_schema || [],
  observationsChecklist: row.observations_checklist || [],
  emailTemplate: row.email_template,
  verdictOptions: row.verdict_options, // Optional, can add to DB if needed
})

export function useAlertTemplates() {
  return useQuery({
    queryKey: ['alert_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_templates')
        .select('*')

      if (error) throw error

      return (data || []).map(mapDbToAlertRule)
    },
  })
}

export function useSaveAlertTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (template: AlertRule) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('alert_templates')
        .upsert({
          id: template.id, // Custom templates can have e.g. "custom-uuid", overwriting defaults use existing id
          user_id: user.id,
          name: template.name,
          category: template.category,
          description: template.description,
          default_severity: template.defaultSeverity,
          mitre_tactics: template.mitreTactics,
          fields_schema: template.fieldsSchema,
          observations_checklist: template.observationsChecklist,
          email_template: template.emailTemplate,
        }, { onConflict: 'id' })
        .select()
        .single()

      if (error) throw error
      return mapDbToAlertRule(data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alert_templates'] })
    },
  })
}
