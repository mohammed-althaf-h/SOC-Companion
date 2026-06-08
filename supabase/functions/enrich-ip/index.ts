import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { ip, ipinfoKey, abuseipdbKey } = await req.json()

    if (!ip) {
      return new Response(JSON.stringify({ error: 'IP address required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Check Global Cache
    const { data: cached } = await supabaseClient
      .from('enrichment_cache')
      .select('*')
      .eq('ioc_value', ip)
      .single()

    const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000
    const now = new Date()

    if (cached && cached.updated_at) {
      const cacheAge = now.getTime() - new Date(cached.updated_at).getTime()
      if (cacheAge < FIFTEEN_DAYS) {
        return new Response(JSON.stringify({
          ipinfo: cached.ipinfo_data,
          abuseipdb: cached.abuseipdb_data,
          cached: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // 2. Fetch fresh data if missing or expired
    let ipinfoData = null
    let abuseipdbData = null

    if (ipinfoKey) {
      try {
        const res = await fetch(`https://ipinfo.io/${ip}/json?token=${ipinfoKey}`)
        if (res.ok) ipinfoData = await res.json()
      } catch (e) {
        console.error('IPinfo error:', e)
      }
    }

    if (abuseipdbKey) {
      try {
        const res = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`, {
          headers: {
            'Key': abuseipdbKey,
            'Accept': 'application/json'
          }
        })
        if (res.ok) {
          const json = await res.json()
          abuseipdbData = json.data
        }
      } catch (e) {
        console.error('AbuseIPDB error:', e)
      }
    }

    // 3. Upsert into Global Cache
    await supabaseClient
      .from('enrichment_cache')
      .upsert({
        ioc_value: ip,
        ipinfo_data: ipinfoData,
        abuseipdb_data: abuseipdbData,
        updated_at: now.toISOString()
      }, { onConflict: 'ioc_value' })

    return new Response(JSON.stringify({
      ipinfo: ipinfoData,
      abuseipdb: abuseipdbData,
      cached: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
