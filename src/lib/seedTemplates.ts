import { supabase } from './supabase'
import { ALERT_RULES } from '../data/alertRulesDefaultSeed'

export async function seedDefaultTemplates() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  for (const rule of ALERT_RULES) {
    const { error } = await supabase
      .from('alert_templates')
      .upsert({
        id: rule.id,
        user_id: user.id,
        name: rule.name,
        category: rule.category,
        description: rule.description,
        default_severity: rule.defaultSeverity,
        mitre_tactics: rule.mitreTactics,
        fields_schema: rule.fieldsSchema,
        observations_checklist: rule.observationsChecklist,
        email_template: rule.emailTemplate,
      }, { onConflict: 'id' })

    if (error) {
      console.error(`Failed to insert rule ${rule.id}:`, error.message)
      throw error
    }
  }
}
