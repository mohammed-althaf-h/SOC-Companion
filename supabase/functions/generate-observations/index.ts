import { serve } from "https://deno.land/std@0.192.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fieldData, templateData, provider, keys } = await req.json()

    if (!templateData || !fieldData) {
      throw new Error('Missing fieldData or templateData')
    }

    const systemPrompt = `You are an expert SOC Analyst. Your task is to generate a professional, concise, numbered list of observations based on the provided investigation fields and the alert template context. Do not include any introductory or concluding text, ONLY the numbered list. Use a neutral, technical tone. Extract and summarize the key findings. Limit to 3-5 key points.`
    
    const userPrompt = `
      Alert Name: ${templateData.name}
      Alert Description: ${templateData.description}
      
      Investigation Data:
      ${JSON.stringify(fieldData, null, 2)}
    `

    let observationsText = ''

    if (provider === 'openai') {
      const key = keys.openai || Deno.env.get('OPENAI_API_KEY')
      if (!key) throw new Error('OpenAI API Key not configured')
      
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3
        })
      })
      if (!res.ok) throw new Error(`OpenAI Error: ${await res.text()}`)
      const json = await res.json()
      observationsText = json.choices[0].message.content

    } else if (provider === 'anthropic') {
      const key = keys.anthropic || Deno.env.get('ANTHROPIC_API_KEY')
      if (!key) throw new Error('Anthropic API Key not configured')
      
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3
        })
      })
      if (!res.ok) throw new Error(`Anthropic Error: ${await res.text()}`)
      const json = await res.json()
      observationsText = json.content[0].text

    } else if (provider === 'gemini') {
      const key = keys.gemini || Deno.env.get('GEMINI_API_KEY')
      if (!key) throw new Error('Gemini API Key not configured')
      
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.3 }
        })
      })
      if (!res.ok) throw new Error(`Gemini Error: ${await res.text()}`)
      const json = await res.json()
      observationsText = json.candidates[0].content.parts[0].text
    } else {
      throw new Error('Unsupported LLM provider')
    }

    // Parse the numbered list into an array of strings
    const observationsArray = observationsText
      .split('\n')
      .filter(line => /^\d+\.\s/.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())

    // Fallback if the LLM didn't return a numbered list properly
    const finalObservations = observationsArray.length > 0 
      ? observationsArray 
      : observationsText.split('\n').filter(l => l.trim().length > 0)

    return new Response(JSON.stringify({ observations: finalObservations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
