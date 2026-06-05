import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { RuleWiki } from '@/types'

export function useRulesWiki() {
  return useQuery({
    queryKey: ['rules_wiki'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rules_wiki')
        .select('*')
        .order('rule_name', { ascending: true })

      if (error) throw error
      return data as RuleWiki[]
    }
  })
}

export function useRuleWiki(id: string) {
  return useQuery({
    queryKey: ['rules_wiki', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rules_wiki')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as RuleWiki
    },
    enabled: !!id
  })
}

export function useCreateRuleWiki() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ruleName: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('rules_wiki')
        .insert({
          user_id: user.id,
          rule_name: ruleName,
          content: ''
        })
        .select()
        .single()

      if (error) throw error
      return data as RuleWiki
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules_wiki'] })
    }
  })
}

export function useUpdateRuleWiki() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data, error } = await supabase
        .from('rules_wiki')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as RuleWiki
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rules_wiki'] })
      queryClient.invalidateQueries({ queryKey: ['rules_wiki', data.id] })
    }
  })
}
