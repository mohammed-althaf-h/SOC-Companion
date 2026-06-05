import type { Investigation, Client, AlertRule } from '@/types'
import { defangIP, defangURL, defangEmail } from './defang'

/**
 * Simple Handlebars-style template renderer.
 * Replaces {{variable}} tokens with values from the context map.
 */
function renderTemplate(template: string, context: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] ?? `[${key}]`)
}

/**
 * Builds the verdict-driven NEXT STEPS block using the analyst's exact phrasing
 * extracted from real investigation drafts.
 */
function buildNextSteps(
  fieldData: Record<string, string>,
  client: Client,
  investigation: Investigation
): string {
  const verdict = fieldData.verdict_type || fieldData.next_step_type || ''
  const user = fieldData.affected_user || fieldData.username || '[User]'
  const application = fieldData.application || '[Application]'
  const spoc = client.spoc_name || '@SPOC'
  const bypassGroup = fieldData.bypass_group || 'M365 - Conditional Access Bypass'
  const country = fieldData.country || '[Country]'
  const date = new Date(investigation.triggered_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const threatFile = fieldData.threat_file || '[File]'
  const socEmail = client.soc_email || 'soc@eci.com'

  switch (verdict) {
    case 'benign_ca_success':
      return `Since this activity was related to sign-in activity for user account "${user}" towards "${application}" where CA policy was successful and nothing suspicious was observed, we will proceed with case closure.\n\nI'll set this incident as resolved, but please don't hesitate to reach us if you have further questions or concerns to ${socEmail}`

    case 'benign_vpn':
      return `Given that the sign-in activities showed no signs of suspicious activity and the CA policy was successfully applied, no further actions required from the SOC team. We will now proceed with case closure.\n\nPlease Note: The usage of 3rd party VPN leads to several security concerns such as data breaches and identity theft which may also led to privacy issue. we do not recommend usage of a 3rd party VPN's to access corporate resources.\n\nI'll set this incident as resolved, but please don't hesitate to reach us if you have further questions or concerns to ${socEmail}`

    case 'suspicious_awaiting':
      return `Since this alert pertains to sign-in activity for the user "${user}" from ${country} on ${date}, ${spoc}, could you please confirm if the user is currently traveling or if these sign-ins are expected for "${user}"?\n\nWe tried to contact the user/SPOC; however, the call was not connected.`

    case 'mfa_bypass_group':
      return `Nothing suspicious activity was observed in the user's sign-in pattern.\n\n${spoc} — Could you please review the [${bypassGroup}] group and remove all users who do not have a valid business need to be exempt from MFA? Retaining unnecessary users in this group increases the risk of unauthorized access and potential security breaches.`

    case 'confirmed_expected':
      return `As we have received confirmation from "${spoc}", that sign-ins are expected/known; no further actions are pending from SOC Team, we will proceed to close the case.\n\nI'll set this incident as resolved, but please don't hesitate to reach us if you have further questions or concerns to ${socEmail}`

    case 's1_killed_quarantined':
      return `Since the file has already been killed and quarantined by SentinelOne, we have resolved the threat on the host. Since no further actions are pending from SOC team, we will proceed to close this case.\n\nI'll set this incident to resolved, but please don't hesitate to reach us if you have further questions or concerns to ${socEmail}`

    case 's1_false_positive':
      return `Since the observed file "${threatFile}" was a false detection, we will mark it as false positive, resolve the threat on the host, and proceed with case closure.`

    case 'dlp_benign':
      return `As we have reviewed the logs and nothing suspicious was observed in the alert timeframe we will proceed to close this case. If you have any questions or concerns please do respond to this email or reach us at ${socEmail}`

    case 'malicious_ioc_blocked':
      return `We have blocked all associated IOCs on our security devices and initiated a SentinelOne scan on the host. We request the user to immediately change their account password.\n\nI'll set this incident to pending, but please don't hesitate to reach us if you have further questions or concerns to ${socEmail}`

    case 'informational':
      return `Since this is an informational alert and no further actions are pending, we will proceed with case closure.\n\nI'll set this incident to Resolved, but please don't hesitate to reach out to us at ${socEmail} if you have any further questions or concerns.`

    default:
      return `I'll set this incident to resolved, but please don't hesitate to reach us if you have further questions or concerns to ${socEmail}`
  }
}

/**
 * Builds a numbered observations list from the observations array
 */
function buildObservations(observations: string[]): string {
  if (!observations.length) return '[No observations recorded]'
  return observations.map((obs, i) => `${i + 1}. ${obs}`).join('\n\n')
}

/**
 * Builds the ALERT SUMMARY section from field data and alert rule name
 */
function buildAlertSummary(
  investigation: Investigation,
  fieldData: Record<string, string>
): string {
  const alertName = investigation.alert_name
  const user = fieldData.affected_user || fieldData.username || ''
  const host = fieldData.host_name || ''

  if (user) {
    return `This alert triggered due to '${alertName}' for the user "${user}".`
  }
  if (host) {
    return `This alert was triggered due to the detection of a threat by SentinelOne on host "${host}".`
  }
  return `This alert was triggered due to '${alertName}'.`
}

/**
 * Main draft email generator.
 * Produces the analyst's exact email format matching real drafts.
 */
export function generateDraftEmail(
  investigation: Investigation,
  client: Client,
  rule: AlertRule | null,
  analystName: string
): string {
  const fd = investigation.field_data || {}

  // Auto-defang IPs and URLs in field values for display
  const displayFd: Record<string, string> = {}
  for (const [k, v] of Object.entries(fd)) {
    if (k.includes('ip') || k.includes('IP')) {
      displayFd[k] = defangIP(v)
    } else if (k.includes('url') || k.includes('URL')) {
      displayFd[k] = defangURL(v)
    } else if (k.includes('email') || k.includes('Email')) {
      displayFd[k] = defangEmail(v)
    } else {
      displayFd[k] = v
    }
  }

  const alertSummary = buildAlertSummary(investigation, fd)
  const observations = buildObservations(investigation.observations || [])
  const nextSteps = buildNextSteps(fd, client, investigation)

  // Use rule template if available, else use generic template
  let body: string
  if (rule?.emailTemplate) {
    const context: Record<string, string> = {
      ...displayFd,
      alert_summary: alertSummary,
      observations: observations,
      next_steps: nextSteps,
      analyst_name: analystName,
      soc_email: client.soc_email || 'soc@eci.com',
      client_name: client.name,
      case_number: investigation.case_number,
    }
    body = renderTemplate(rule.emailTemplate, context)
  } else {
    body = `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

${alertSummary}

[OBSERVATIONS]:

${observations}

[NEXT STEPS]:

${nextSteps}

Regards,
${analystName}
ECI-SOC`
  }

  return body
}
