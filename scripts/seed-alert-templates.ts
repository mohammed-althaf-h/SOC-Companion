import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { ALERT_RULES } from '../src/data/alertRulesDefaultSeed'

config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seed() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('Usage: npx tsx scripts/seed-alert-templates.ts <email> <password>')
    process.exit(1)
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
  if (authError || !authData.user) {
    console.error('Login failed:', authError?.message)
    process.exit(1)
  }

  console.log(`Logged in as ${authData.user.email}`)

  let successCount = 0
  for (const rule of ALERT_RULES) {
    const { error } = await supabase
      .from('alert_templates')
      .upsert({
        id: rule.id,
        user_id: authData.user.id,
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
    } else {
      successCount++
    }
  }

  console.log(`Successfully seeded ${successCount}/${ALERT_RULES.length} templates.`)
}

seed()
