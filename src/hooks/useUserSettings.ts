import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { UserSettings } from '@/types'
import { DEFAULT_USER_SETTINGS } from '@/types'

// ─── Fetch (or create default) user settings ──────────────────────────────────
export function useUserSettings() {
  return useQuery({
    queryKey: ['user_settings'],
    queryFn: async (): Promise<UserSettings> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error

      // Row doesn't exist yet — create default row and return it
      if (!data) {
        const { data: created, error: createErr } = await supabase
          .from('user_settings')
          .insert({ user_id: user.id, ...DEFAULT_USER_SETTINGS })
          .select()
          .single()
        if (createErr) throw createErr
        return created as UserSettings
      }

      return data as UserSettings
    },
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  })
}

// ─── Update user settings ─────────────────────────────────────────────────────
export function useUpdateUserSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('user_settings')
        .upsert(
          { user_id: user.id, ...patch, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
        .select()
        .single()

      if (error) throw error
      return data as UserSettings
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user_settings'] })
    },
  })
}

// ─── Convenience: resolve template variables from settings ────────────────────
// Used by email generator to substitute {{team_name}}, {{soc_email}}, etc.
export function resolveSignOff(settings: UserSettings, analystName: string): string {
  return settings.sign_off_template
    .replace(/\{\{analyst_name\}\}/g, analystName)
    .replace(/\{\{team_name\}\}/g, settings.team_name)
}
