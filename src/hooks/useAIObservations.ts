import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserSettings } from './useUserSettings'

interface GenerateObservationsPayload {
  fieldData: Record<string, string>
  templateData: {
    name: string
    description: string
  }
}

export function useGenerateObservations() {
  const { data: settings } = useUserSettings()

  return useMutation({
    mutationFn: async ({ fieldData, templateData }: GenerateObservationsPayload) => {
      const keys = {
        openai: settings?.openai_api_key,
        anthropic: settings?.anthropic_api_key,
        gemini: settings?.gemini_api_key
      }

      const { data, error } = await supabase.functions.invoke('generate-observations', {
        body: {
          fieldData,
          templateData,
          provider: settings?.preferred_llm || 'openai',
          keys
        }
      })

      if (error) throw error
      if (data.error) throw new Error(data.error)
        
      return data.observations as string[]
    }
  })
}
