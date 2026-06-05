import type { ContaminationResult, Client } from '@/types'

/**
 * Scans all text field values for short codes belonging to OTHER clients.
 * Runs client-side before save for instant feedback.
 * The same logic also runs server-side in the Supabase mutation.
 */
export function detectCrossContamination(
  payload: Record<string, string>,
  activeClientShortCode: string,
  allClients: Pick<Client, 'id' | 'short_code' | 'name'>[]
): ContaminationResult {
  const otherClients = allClients.filter(
    (c) => c.short_code.toUpperCase() !== activeClientShortCode.toUpperCase()
  )

  const offendingFields: string[] = []
  let offendingCode: string | null = null
  let offendingClientName: string | null = null

  const allText = Object.entries(payload)

  for (const client of otherClients) {
    const code = client.short_code.toUpperCase()
    for (const [field, value] of allText) {
      if (
        value &&
        typeof value === 'string' &&
        value.toUpperCase().includes(code)
      ) {
        offendingCode = client.short_code
        offendingClientName = client.name
        if (!offendingFields.includes(field)) {
          offendingFields.push(field)
        }
      }
    }
  }

  return {
    detected: offendingFields.length > 0,
    offendingCode,
    offendingClientName,
    fields: offendingFields,
  }
}

/**
 * Also checks associated domains of other clients in text fields.
 * e.g. typing "readycapital.com" while working on a different client.
 */
export function detectDomainContamination(
  payload: Record<string, string>,
  activeClientId: string,
  allClients: Pick<Client, 'id' | 'name' | 'associated_domains'>[]
): ContaminationResult {
  const otherClients = allClients.filter((c) => c.id !== activeClientId)

  const offendingFields: string[] = []
  let offendingCode: string | null = null
  let offendingClientName: string | null = null

  for (const client of otherClients) {
    const domains = client.associated_domains || []
    for (const domain of domains) {
      const domainLower = domain.toLowerCase()
      for (const [field, value] of Object.entries(payload)) {
        if (value && typeof value === 'string' && value.toLowerCase().includes(domainLower)) {
          offendingCode = domain
          offendingClientName = client.name
          if (!offendingFields.includes(field)) {
            offendingFields.push(field)
          }
        }
      }
    }
  }

  return {
    detected: offendingFields.length > 0,
    offendingCode,
    offendingClientName,
    fields: offendingFields,
  }
}
