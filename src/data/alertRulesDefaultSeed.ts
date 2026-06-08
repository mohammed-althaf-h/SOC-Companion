import type { AlertRule } from '@/types'

export const ALERT_RULES: AlertRule[] = [
  // ─── UBA / AZURE AD ──────────────────────────────────────────────────────────
  {
    id: 'uba-high-risk-signin',
    name: 'Azure AD High Risk Sign-in / Heuristic',
    category: 'UBA_AZURE',
    description: 'High risk sign-in detected by Azure AD Identity Protection for a user account.',
    defaultSeverity: 'high',
    mitreTactics: ['Initial Access', 'Credential Access'],
    fieldsSchema: [
      { id: 'affected_user', label: 'Affected User (Name + Email)', type: 'text', placeholder: 'John Doe (john.doe@client.com)', required: true },
      { id: 'source_ip', label: 'Source IP Address', type: 'ip', placeholder: '117.248.154.109', required: true, defang: true, monospace: true },
      { id: 'country', label: 'Country / Location', type: 'text', placeholder: 'India', required: true },
      { id: 'isp', label: 'ISP', type: 'text', placeholder: 'BSNL Bangalore', required: true },
      { id: 'device_type', label: 'Device Type', type: 'select', options: ['Windows10', 'Windows11', 'MacOS', 'iOS', 'Android', 'Linux', 'Unknown'], required: true },
      { id: 'device_registration', label: 'Device Registration', type: 'select', options: ['Azure AD Registered', 'Non-Registered', 'Azure AD Joined', 'Hybrid Joined'], required: true },
      { id: 'application', label: 'Application Accessed', type: 'text', placeholder: 'Azure Virtual Desktop Client', required: true },
      { id: 'ca_policy', label: 'CA Policy Applied', type: 'text', placeholder: 'External Access - RequireDuoMfa' },
      { id: 'ca_policy_result', label: 'CA Policy Result', type: 'select', options: ['Success', 'Failure', 'Not Applied', 'Report Only'] },
      { id: 'mfa_method', label: 'MFA Method', type: 'select', options: ['DUO Push', 'DUO TOTP', 'Microsoft Authenticator', 'SMS', 'Phone Call', 'None'] },
      { id: 'mfa_result', label: 'MFA Result', type: 'select', options: ['Success', 'Failure', 'Denied', 'Not Required'] },
      { id: 'duo_device', label: 'DUO Device (masked)', type: 'text', placeholder: '+91 ***** ***80', monospace: true },
      { id: 'ip_reputation', label: 'IP Reputation', type: 'select', options: ['Clean', 'Malicious', 'VPN / Proxy', 'Tor Exit Node', 'Partially Clean'] },
      { id: 'vpn_provider', label: 'VPN Provider (if VPN)', type: 'text', placeholder: 'Nord VPN / ExpressVPN' },
      { id: 'sign_in_history', label: 'Sign-in History (30 days)', type: 'select', options: ['Nothing abnormal', 'Previous sign-ins from same IP', 'Suspicious activity noted', 'First time from this location'] },
      { id: 'bypass_group', label: 'MFA Bypass Group (if applicable)', type: 'text', placeholder: 'M365 - Conditional Access Bypass' },
      { id: 'risk_reason', label: 'Risk Reason / Unfamiliar Features', type: 'text', placeholder: 'Unregistered Device or Unrecognized IP address' },
      { id: 'date_time', label: 'Date/Time (if required)', type: 'text', placeholder: 'May 01, 2025 @ 11:17 EST' },
      { id: 'related_case', label: 'Related Case (if any)', type: 'text', placeholder: 'CS1999087' },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['benign_ca_success', 'benign_vpn', 'suspicious_awaiting', 'mfa_bypass_group', 'confirmed_expected', 'malicious_ioc_blocked'], required: true },
    ],
    observationsChecklist: [
      { id: 'obs-signin-basic', text: 'Upon reviewing the logs, we could see successful sign-ins from the user account "{{affected_user}}" towards application: "{{application}}" from the IP: "{{source_ip}}".', variables: ['affected_user', 'application', 'source_ip'] },
      { id: 'obs-signin-device', text: 'Upon reviewing the logs we could see a successful interactive sign in from a {{device_registration}} "{{device_type}}" device originating from {{country}} with IP {{source_ip}}. We have verified the IP and it belongs to {{isp}}. The sign-ins were towards the application "{{application}}".', variables: ['device_registration', 'device_type', 'country', 'source_ip', 'isp', 'application'] },
      { id: 'obs-ip-rep', text: 'We have analyzed the reputation of the mentioned IP: {{source_ip}} across threat intel\'s and found it to be {{ip_reputation}}, belonging to ISP: "{{isp}}", {{country}}.', variables: ['source_ip', 'ip_reputation', 'isp', 'country'] },
      { id: 'obs-ca-device', text: 'We could see these sign-in attempts were initiated from an Azure AD {{device_registration}} "{{device_type}}" device, wherein the Conditional Access policy ({{ca_policy}}) was applied {{ca_policy_result}}.', variables: ['device_registration', 'device_type', 'ca_policy', 'ca_policy_result'] },
      { id: 'obs-ca-duo', text: 'Further reviewing we could see that the sign-ins are successful as the CA policy "{{ca_policy}}" was applied {{ca_policy_result}}. We have verified the DUO logs for the same and could see that a successful DUO push from the device "{{duo_device}}" with the authentication reason as "verification_code_correct".', variables: ['ca_policy', 'ca_policy_result', 'duo_device'] },
      { id: 'obs-history', text: 'Further we observed that user was part of risky sign-ins due to these unfamiliar features i.e.: {{risk_reason}}, However we have reviewed sign-in activities of user over past 30 days and {{sign_in_history}}.', variables: ['risk_reason', 'sign_in_history'] },
      { id: 'obs-interrupted', text: 'Upon reviewing the logs, we observed interrupted sign-in attempts for the account "{{affected_user}}" from external IPs: "{{source_ip}}" (ISP: {{isp}}, {{country}}).', variables: ['affected_user', 'source_ip', 'isp', 'country'] },
      { id: 'obs-interrupted-rep', text: 'We have reviewed the reputation of the IPs and determined it to be {{ip_reputation}}. The afore-mentioned sign-ins occurred on {{date_time}} towards the application: "{{application}}".', variables: ['ip_reputation', 'date_time', 'application'] },
      { id: 'obs-mfa-exempt', text: 'Additionally, we could observe that this user account has been exempted from MFA w.r.t. previous case: {{related_case}}.', variables: ['related_case'] },
      { id: 'obs-signin-vpn', text: 'Upon reviewing the logs, we could see successful sign-in activity from IP address: "{{source_ip}}" using a {{device_registration}} "{{device_type}}" device to access the application "{{application}}" around {{date_time}}. Wherein CA policy ({{ca_policy}}) was applied {{ca_policy_result}}. We reviewed IP reputation across threat intelligence sources and found it to belongs to ISP: "{{isp}}", {{country}}. Which is associated with third party VPN Service ({{vpn_provider}}).', variables: ['source_ip', 'device_registration', 'device_type', 'application', 'date_time', 'ca_policy', 'ca_policy_result', 'isp', 'country', 'vpn_provider'] }
    ],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert triggered due to 'Azure Active Directory High Risk Sign-in/Heuristic' for the user "{{affected_user}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'uba-impossible-travel',
    name: 'Impossible Travel Activity',
    category: 'UBA_AZURE',
    description: 'Sign-ins from two geographically impossible locations within a short time window.',
    defaultSeverity: 'high',
    mitreTactics: ['Initial Access'],
    fieldsSchema: [
      { id: 'affected_user', label: 'Affected User', type: 'text', required: true },
      { id: 'location_1', label: 'Location 1', type: 'text', placeholder: 'Mumbai, India', required: true },
      { id: 'source_ip_1', label: 'IP Address 1', type: 'ip', defang: true, monospace: true, required: true },
      { id: 'time_1', label: 'Time 1', type: 'text', placeholder: 'May 01, 2025 @ 10:30 EST' },
      { id: 'location_2', label: 'Location 2', type: 'text', placeholder: 'New York, USA', required: true },
      { id: 'source_ip_2', label: 'IP Address 2', type: 'ip', defang: true, monospace: true, required: true },
      { id: 'time_2', label: 'Time 2', type: 'text', placeholder: 'May 01, 2025 @ 10:45 EST' },
      { id: 'time_difference', label: 'Time Difference', type: 'text', placeholder: '15 minutes' },
      { id: 'application', label: 'Application', type: 'text', placeholder: 'Microsoft Office' },
      { id: 'ca_policy_result', label: 'CA Policy Result', type: 'select', options: ['Success', 'Failure', 'Not Applied'] },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['suspicious_awaiting', 'benign_ca_success', 'confirmed_expected', 'malicious_ioc_blocked'], required: true },
    ],
    observationsChecklist: [
      { id: 'obs-travel', text: 'Upon reviewing the logs, we observed sign-in activity from two geographically impossible locations: "{{location_1}}" (IP: {{source_ip_1}}) at {{time_1}} and "{{location_2}}" (IP: {{source_ip_2}}) at {{time_2}} — a time difference of {{time_difference}}.', variables: ['location_1', 'source_ip_1', 'time_1', 'location_2', 'source_ip_2', 'time_2', 'time_difference'] },
    ],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert triggered due to 'Impossible travel activity involving one user' for the user "{{affected_user}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'uba-brute-force',
    name: 'Potential Brute Force Attack Detected',
    category: 'UBA_AZURE',
    description: 'Multiple failed login attempts indicating a brute force attack.',
    defaultSeverity: 'high',
    mitreTactics: ['Credential Access'],
    fieldsSchema: [
      { id: 'affected_user', label: 'Target Account(s)', type: 'text', required: true },
      { id: 'source_ip', label: 'Source IP(s)', type: 'ip', defang: true, monospace: true, required: true },
      { id: 'isp', label: 'ISP(s)', type: 'text' },
      { id: 'country', label: 'Geo-location(s)', type: 'text' },
      { id: 'failed_count', label: 'Number of Failed Attempts', type: 'number', placeholder: '47' },
      { id: 'timeframe', label: 'Timeframe', type: 'text', placeholder: 'May 01, 2025 08:00 – 08:30 EST' },
      { id: 'logon_type', label: 'Logon Type', type: 'select', options: ['Interactive', 'Non-Interactive', 'Service Account', 'ADFS'] },
      { id: 'successful_logins', label: 'Any Successful Logins?', type: 'select', options: ['No', 'Yes — User account', 'Yes — Service account'] },
      { id: 'application', label: 'Application Targeted', type: 'text', placeholder: 'Office 365 Exchange Online' },
      { id: 'ip_reputation', label: 'IP Reputation', type: 'select', options: ['Clean', 'Malicious', 'VPN / Proxy', 'Tor Exit Node'] },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['suspicious_awaiting', 'malicious_ioc_blocked', 'benign_ca_success', 'informational'], required: true },
    ],
    observationsChecklist: [
      { id: 'obs-bf', text: 'Upon reviewing the logs, we could see {{failed_count}} failed sign-in attempts for the account "{{affected_user}}" from IP {{source_ip}} (ISP: {{isp}}, {{country}}) towards the application "{{application}}" during {{timeframe}}.', variables: ['failed_count', 'affected_user', 'source_ip', 'isp', 'country', 'application', 'timeframe'] },
    ],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert triggered due to 'Potential Brute Force Attack Detected' for the account "{{affected_user}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'uba-duo-brute-force',
    name: 'Potential DUO MFA Brute Force Attack Detected',
    category: 'UBA_AZURE',
    description: 'Repeated MFA push denials or failures indicating MFA fatigue or brute force.',
    defaultSeverity: 'high',
    mitreTactics: ['Credential Access', 'Initial Access'],
    fieldsSchema: [
      { id: 'affected_user', label: 'Affected User', type: 'text', required: true },
      { id: 'source_ip', label: 'Source IP', type: 'ip', defang: true, monospace: true, required: true },
      { id: 'isp', label: 'ISP', type: 'text' },
      { id: 'country', label: 'Country', type: 'text' },
      { id: 'failed_mfa_count', label: 'Failed MFA Attempts', type: 'number' },
      { id: 'application', label: 'Application', type: 'text' },
      { id: 'successful_login', label: 'Successful Login After MFA?', type: 'select', options: ['No', 'Yes'] },
      { id: 'timeframe', label: 'Timeframe', type: 'text' },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['suspicious_awaiting', 'malicious_ioc_blocked', 'informational'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert triggered due to "Potential Duo MFA Brute Force Attack Detected" for the user "{{affected_user}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'uba-m365-mfa-brute-force',
    name: 'Potential Microsoft 365 MFA Brute Force Attack (Agent)',
    category: 'UBA_AZURE',
    description: 'Potential M365 MFA brute force as detected by the SIEM agent.',
    defaultSeverity: 'high',
    mitreTactics: ['Credential Access'],
    fieldsSchema: [
      { id: 'affected_user', label: 'Affected User', type: 'text', required: true },
      { id: 'source_ip', label: 'Source IP', type: 'ip', defang: true, monospace: true, required: true },
      { id: 'isp', label: 'ISP', type: 'text' },
      { id: 'country', label: 'Country', type: 'text' },
      { id: 'failed_count', label: 'Failed Attempts', type: 'number' },
      { id: 'application', label: 'Application(s)', type: 'text', placeholder: 'Azure Portal, Office 365 SharePoint Online' },
      { id: 'device_type', label: 'Device Type', type: 'text', placeholder: 'Windows (non-registered)' },
      { id: 'successful_login', label: 'Successful Login?', type: 'select', options: ['No', 'Yes'] },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['suspicious_awaiting', 'malicious_ioc_blocked', 'confirmed_expected'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated the alert and below is the summary.

[ALERT SUMMARY]:

This alert was triggered due to "Potential Microsoft 365 MFA Brute Force Attack Detected (Agent)" for the user "{{affected_user}}".

[NEXT STEPS]:

{{next_steps}}

[OBSERVATIONS]:

{{observations}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'uba-password-spray',
    name: 'Password Spray Involving One User',
    category: 'UBA_AZURE',
    description: 'Password spray attack targeting a single user account.',
    defaultSeverity: 'medium',
    mitreTactics: ['Credential Access'],
    fieldsSchema: [
      { id: 'affected_user', label: 'Affected User', type: 'text', required: true },
      { id: 'source_ip', label: 'Source IP', type: 'ip', defang: true, monospace: true, required: true },
      { id: 'isp', label: 'ISP', type: 'text' },
      { id: 'failed_attempts', label: 'Failed Attempts Count', type: 'number' },
      { id: 'confirmed_by', label: 'Confirmed By (internal)', type: 'text', placeholder: 'User / IT Admin' },
      { id: 'reason', label: 'Reason (if benign)', type: 'text', placeholder: 'User recently changed password and used old password' },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['benign_ca_success', 'confirmed_expected', 'malicious_ioc_blocked', 'suspicious_awaiting'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

An alert was triggered due to a "Password Spray involving one user" for user "{{affected_user}}". Upon reviewing the logs, we identified that the user attempted to sign in from IP address {{source_ip}}, which is associated with ISP {{isp}}.

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'uba-account-privileged-group',
    name: 'Account Added to Privileged / Sensitive Security Group',
    category: 'UBA_AZURE',
    description: 'A user account was added to a privileged or sensitive Azure AD security group.',
    defaultSeverity: 'medium',
    mitreTactics: ['Privilege Escalation'],
    fieldsSchema: [
      { id: 'user_added', label: 'User Added', type: 'text', required: true },
      { id: 'group_name', label: 'Group Name', type: 'text', required: true },
      { id: 'added_by', label: 'Added By', type: 'text' },
      { id: 'timestamp', label: 'Timestamp', type: 'text' },
      { id: 'justification', label: 'Business Justification', type: 'textarea' },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['informational', 'suspicious_awaiting', 'malicious_ioc_blocked'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert triggered due to the account "{{user_added}}" being added to the privileged/sensitive group "{{group_name}}" by "{{added_by}}" at {{timestamp}}.

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'uba-suspicious-account-changes',
    name: 'Suspicious Account Changes (Password Never Expires)',
    category: 'UBA_AZURE',
    description: 'Suspicious account configuration changes such as setting password never expires.',
    defaultSeverity: 'medium',
    mitreTactics: ['Persistence'],
    fieldsSchema: [
      { id: 'affected_account', label: 'Affected Account', type: 'text', required: true },
      { id: 'change_type', label: 'Change Type', type: 'text', placeholder: 'Password Never Expires set to True' },
      { id: 'changed_by', label: 'Changed By', type: 'text' },
      { id: 'timestamp', label: 'Timestamp', type: 'text' },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['suspicious_awaiting', 'informational', 'malicious_ioc_blocked'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert triggered due to suspicious account changes detected for account "{{affected_account}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  // ─── SIEM ─────────────────────────────────────────────────────────────────────
  {
    id: 'siem-m365-unusual-activity',
    name: 'Unusual Activity Detected by Microsoft 365 Defender',
    category: 'SIEM',
    description: 'Correlated alert from Microsoft 365 Defender for unusual activity involving a user.',
    defaultSeverity: 'medium',
    mitreTactics: ['Collection', 'Exfiltration'],
    fieldsSchema: [
      { id: 'affected_user', label: 'Affected User', type: 'text', required: true },
      { id: 'activity_type', label: 'Activity Type / Alert Message', type: 'text', placeholder: 'Admin Activities Monitoring', required: true },
      { id: 'm365_message', label: 'M365 Alert Message', type: 'text', placeholder: 'Removed an entry in Tenant Allow/Block List' },
      { id: 'timestamp', label: 'Alert Timestamp', type: 'text' },
      { id: 'details', label: 'Additional Details', type: 'textarea' },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['informational', 'suspicious_awaiting', 'benign_ca_success'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert was triggered due to the detection of an Unusual Activity by Microsoft 365 Defender, under the message "{{m365_message}}" for the user account "{{affected_user}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'siem-exfiltration-dlp',
    name: 'Exfiltration Incident Involving One User (DLP)',
    category: 'SIEM',
    description: 'Microsoft Defender DLP policy triggered for data exfiltration activity.',
    defaultSeverity: 'high',
    mitreTactics: ['Exfiltration'],
    fieldsSchema: [
      { id: 'affected_user', label: 'Affected User', type: 'text', required: true },
      { id: 'host', label: 'Host Name', type: 'text', required: true },
      { id: 'dlp_policy', label: 'DLP Policy Triggered', type: 'text', placeholder: 'Device DLP - Block File Upload / U.S. Financial Data', required: true },
      { id: 'sensitive_data_type', label: 'Sensitive Data Type', type: 'select', options: ['PII', 'PHI', 'Financial / ABA Routing', 'U.S. Financial Data', 'IP / Proprietary', 'General Files'] },
      { id: 'files_copied', label: 'Files / Data Involved', type: 'textarea', placeholder: 'List files or describe data' },
      { id: 'destination', label: 'Destination / Action', type: 'text', placeholder: 'Clipboard / External email / Cloud upload' },
      { id: 'action_taken', label: 'Action Taken by Defender', type: 'select', options: ['Blocked', 'Audited only', 'Quarantined', 'Allowed'] },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['dlp_benign', 'suspicious_awaiting', 'malicious_ioc_blocked'], required: true },
    ],
    observationsChecklist: [
      { id: 'obs-dlp', text: 'Upon reviewing the logs, Microsoft Defender flagged "{{affected_user}}" for copying sensitive files to clipboard on the host "{{host}}", that triggered the DLP policy ({{dlp_policy}}).', variables: ['affected_user', 'host', 'dlp_policy'] },
      { id: 'obs-dlp-note', text: 'Note: A DLP (Data Loss Prevention) policy is a set of rules designed to prevent the unauthorized sharing, transmission, or access of sensitive data, such as personal information, financial records, or proprietary content.', variables: [] },
    ],
    emailTemplate: `Hello All,

We have investigated the alert and below is the summary.

[ALERT SUMMARY]:

This alert was triggered due to the detection of unusual activity by Microsoft 365 Defender for the activity: "Exfiltration incident involving one user" for the user account "{{affected_user}}".

[NEXT STEPS]:

{{next_steps}}

[OBSERVATIONS]:

{{observations}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'siem-malicious-url-click',
    name: 'Potentially Malicious URL Click Detected',
    category: 'SIEM',
    description: 'User clicked a potentially malicious URL detected by Microsoft Defender for Email.',
    defaultSeverity: 'high',
    mitreTactics: ['Initial Access', 'Phishing'],
    fieldsSchema: [
      { id: 'affected_user', label: 'Affected User', type: 'text', required: true },
      { id: 'email_subject', label: 'Email Subject', type: 'text', required: true },
      { id: 'sender_email', label: 'Sender Email', type: 'email', defang: true, monospace: true },
      { id: 'url', label: 'Malicious URL', type: 'url', defang: true, monospace: true, required: true },
      { id: 'destination_domain', label: 'Destination Domain', type: 'text', monospace: true },
      { id: 'sandbox_result', label: 'Sandbox / URL Analysis Result', type: 'select', options: ['Malicious', 'Benign', 'Suspicious', 'Redirects to phishing page', 'Credential harvesting', 'Unknown'] },
      { id: 'credential_input', label: 'Credential Input Detected?', type: 'select', options: ['No', 'Yes', 'Unknown'] },
      { id: 'user_contacted', label: 'User Contacted?', type: 'select', options: ['Yes — confirmed safe', 'Yes — confirmed malicious', 'No', 'Call not connected'] },
      { id: 'password_reset', label: 'Password Reset Required?', type: 'select', options: ['No', 'Yes — completed', 'Yes — pending'] },
      { id: 'iocs_blocked', label: 'IOCs Blocked?', type: 'select', options: ['Yes', 'No', 'In progress'] },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['malicious_ioc_blocked', 'suspicious_awaiting', 'benign_ca_success'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert was triggered due to a potentially malicious URL click detected for the user "{{affected_user}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'siem-threat-analytics',
    name: 'Threat Analytics Report from Microsoft 365 Defender',
    category: 'SIEM',
    description: 'Informational threat analytics report from Microsoft 365 Defender.',
    defaultSeverity: 'low',
    mitreTactics: [],
    fieldsSchema: [
      { id: 'threat_actor', label: 'Threat Actor / Campaign', type: 'text', placeholder: 'Storm-0126', required: true },
      { id: 'threat_description', label: 'Threat Description', type: 'textarea' },
      { id: 'impacted_systems', label: 'Impacted Systems / Users', type: 'textarea' },
      { id: 'mitre_techniques', label: 'MITRE Techniques', type: 'text' },
      { id: 'defender_detections', label: 'Defender Detection Signatures', type: 'textarea' },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['informational'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have reviewed the alert, and below is the summary of our observations.

ALERT SUMMARY:

We wanted to inform you that we've reviewed an informational alert regarding the threat '{{threat_actor}}' that was identified by Microsoft Defender.

NEXT STEPS:

{{next_steps}}

OBSERVATIONS:

{{observations}}

We are continuously monitoring your systems and will take any necessary actions if additional indicators or tactics related to this threat emerge.

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'siem-suspicious-activity-incident',
    name: 'Suspicious Activity Incident Involving One User',
    category: 'SIEM',
    description: 'Correlated suspicious activity alert involving a single user account.',
    defaultSeverity: 'medium',
    mitreTactics: ['Collection', 'Privilege Escalation'],
    fieldsSchema: [
      { id: 'affected_user', label: 'Affected User', type: 'text', required: true },
      { id: 'activity_description', label: 'Activity Description', type: 'textarea', required: true },
      { id: 'timestamp', label: 'Timestamp', type: 'text' },
      { id: 'related_case', label: 'Related Case (if any)', type: 'text', placeholder: 'CS2140198' },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['informational', 'suspicious_awaiting', 'benign_ca_success'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have received a correlated alert regarding "Unusual Activity Detected by Microsoft 365 Defender" for the user "{{affected_user}}".

{{activity_description}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  // ─── SENTINELONE (S1) ─────────────────────────────────────────────────────────
  {
    id: 's1-threat-detected',
    name: 'Threat Detected by SentinelOne',
    category: 'SENTINELONE',
    description: 'SentinelOne detected and actioned a threat on a managed endpoint.',
    defaultSeverity: 'high',
    mitreTactics: ['Execution', 'Defense Evasion'],
    fieldsSchema: [
      { id: 'host_name', label: 'Host Name', type: 'text', monospace: true, required: true },
      { id: 'username', label: 'Logged-in User', type: 'text', required: true },
      { id: 'threat_file', label: 'Threat File Name', type: 'text', monospace: true, required: true },
      { id: 'file_path', label: 'File Path', type: 'text', monospace: true, placeholder: '\\Device\\HarddiskVolume3\\...', required: true },
      { id: 'file_size', label: 'File Size', type: 'text', placeholder: '21.92 MB' },
      { id: 'file_hash', label: 'File Hash (SHA256)', type: 'text', monospace: true },
      { id: 'hash_reputation', label: 'Hash Reputation', type: 'select', options: ['Clean', 'Malicious', 'Partially Clean', 'Unknown', 'Signed by trusted vendor'] },
      { id: 'classification', label: 'S1 Classification', type: 'select', options: ['Malware', 'PUA / Grayware', 'Ransomware', 'Trojan', 'Spyware', 'Adware', 'Clean'] },
      { id: 'detection_type', label: 'Detection Type', type: 'select', options: ['Dynamic', 'Static', 'Reputation', 'Cloud Intelligence', 'User Defined'] },
      { id: 'originating_process', label: 'Originating Process', type: 'text', monospace: true, placeholder: 'explorer.exe' },
      { id: 's1_action', label: 'S1 Action Taken', type: 'select', options: ['Killed + Quarantined', 'Killed only', 'Quarantined only', 'Alert only', 'Blocked'] },
      { id: 'network_connections', label: 'Network Connections Observed?', type: 'select', options: ['None', 'Clean', 'Suspicious', 'C2 traffic detected'] },
      { id: 'host_health', label: 'Host Status in S1', type: 'select', options: ['Healthy', 'Suspicious', 'Infected', 'Unknown'] },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['s1_killed_quarantined', 's1_false_positive', 'malicious_ioc_blocked', 'suspicious_awaiting'], required: true },
    ],
    observationsChecklist: [
      { id: 'obs-s1-file', text: 'Upon reviewing, we observed that a file "{{threat_file}}" located under the directory "{{file_path}}" was detected as suspicious on the host "{{host_name}}".', variables: ['threat_file', 'file_path', 'host_name'] },
      { id: 'obs-s1-action', text: 'From the SentinelOne console, we could see that S1 actively detected, killed and quarantined the file.', variables: [] },
      { id: 'obs-s1-class', text: 'The classification of above-mentioned threat file was seen as "{{classification}}" and detection type was "{{detection_type}}" which means the file has been executed and then it was detected as suspicious by S1. The size of the above-mentioned file was observed to be {{file_size}}, and the originating process was identified as "{{originating_process}}".', variables: ['classification', 'detection_type', 'file_size', 'originating_process'] },
      { id: 'obs-s1-hash', text: 'We have reviewed the hash reputation of the threat file "{{threat_file}}" and determined it to be {{hash_reputation}}.', variables: ['threat_file', 'hash_reputation'] },
      { id: 'obs-s1-network', text: 'Further we have reviewed all the associated processes and network connections and did not find anything suspicious/abnormal. The host status was reported as {{host_health}}, and the last logged-in user was identified as "{{username}}".', variables: ['host_health', 'username'] },
    ],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

The alert was triggered due to the detection of a threat by SentinelOne on host "{{host_name}}".

[NEXT STEPS]:

{{next_steps}}

[OBSERVATIONS]:

{{observations}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 's1-regsvr32',
    name: 'Regsvr32.exe Launched Suspicious Commands',
    category: 'SENTINELONE',
    description: 'Regsvr32.exe was used to register a suspicious DLL or execute commands.',
    defaultSeverity: 'high',
    mitreTactics: ['Defense Evasion', 'Execution'],
    fieldsSchema: [
      { id: 'host_name', label: 'Host Name', type: 'text', monospace: true, required: true },
      { id: 'username', label: 'User on Host', type: 'text', required: true },
      { id: 'dll_file', label: 'DLL File Name', type: 'text', monospace: true, placeholder: 'hvqql.dll' },
      { id: 'dll_path', label: 'DLL Path', type: 'text', monospace: true, placeholder: 'C:\\Users\\user\\AppData\\Roaming\\...' },
      { id: 'parent_process', label: 'Parent Process', type: 'text', monospace: true, placeholder: 'Explorer.exe' },
      { id: 'preceding_process', label: 'Preceding/Following Process', type: 'text', monospace: true, placeholder: 'AdobeCollabSync.exe' },
      { id: 'dns_queries', label: 'DNS Queries / Network Connections', type: 'select', options: ['Nothing suspicious', 'Suspicious domains', 'C2 traffic', 'Clean external'] },
      { id: 's1_status', label: 'S1 Host Status', type: 'select', options: ['Healthy', 'Suspicious', 'Infected'] },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['benign_ca_success', 's1_false_positive', 'malicious_ioc_blocked', 'suspicious_awaiting'], required: true },
    ],
    observationsChecklist: [
      { id: 'obs-reg1', text: 'Upon reviewing the logs, we could observe that the alert was triggered due to "Regsvr32.exe" invoked by "{{parent_process}}".', variables: ['parent_process'] },
      { id: 'obs-reg2', text: 'The "regsvr32.exe" was used to register a DLL file, "{{dll_file}}", located in "{{dll_path}}".', variables: ['dll_file', 'dll_path'] },
      { id: 'obs-reg3', text: 'We can see {{preceding_process}} on preceding and following of process of "Regsvr32.exe".', variables: ['preceding_process'] },
      { id: 'obs-reg4', text: 'We have also reviewed the DNS queries and network connections during the alert timeframe and nothing suspicious was observed.', variables: [] },
      { id: 'obs-reg5', text: 'Further checking the host in Sentinel One, we have found the host to be in healthy state with no threats detected in the past 30 days and last logged in user as "{{username}}".', variables: ['username'] },
    ],
    emailTemplate: `Hello All,

We received an alert triggered by the detection of unusual activity by Microsoft Defender from the host "{{host_name}}" for user '{{username}}'.

[NEXT STEP]:

{{next_steps}}

I'll set this incident to resolved, but please don't hesitate to reach us if you have further questions or concerns to {{soc_email}}.

[OBSERVATIONS]:

{{observations}}

Please Note:
"Regsvr32.exe" is a Windows command-line utility used to register and unregister Dynamic Link Libraries (DLLs)

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 's1-powershell-bypass',
    name: 'PowerShell Policy Bypass Execution Detection',
    category: 'SENTINELONE',
    description: 'PowerShell was executed with policy bypass flags.',
    defaultSeverity: 'medium',
    mitreTactics: ['Execution', 'Defense Evasion'],
    fieldsSchema: [
      { id: 'host_name', label: 'Host Name', type: 'text', monospace: true, required: true },
      { id: 'username', label: 'User on Host', type: 'text', required: true },
      { id: 'ps_command', label: 'PowerShell Command / Arguments', type: 'textarea', monospace: true, placeholder: 'powershell.exe -ExecutionPolicy Bypass ...' },
      { id: 'parent_process', label: 'Parent Process', type: 'text', monospace: true },
      { id: 'initiating_exe', label: 'Initiating Executable', type: 'text', monospace: true },
      { id: 'network_connections', label: 'Network Connections', type: 'select', options: ['None suspicious', 'External connections', 'C2 traffic', 'Internal only'] },
      { id: 's1_status', label: 'S1 Host Status', type: 'select', options: ['Healthy', 'Suspicious', 'Infected'] },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['benign_ca_success', 'suspicious_awaiting', 'malicious_ioc_blocked'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert was triggered due to "PowerShell Policy Bypass Execution Detection" on host "{{host_name}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 's1-powershell-cmd-spawn',
    name: 'PowerShell Spawning CMD',
    category: 'SENTINELONE',
    description: 'PowerShell.exe spawned a CMD process, which may indicate script execution.',
    defaultSeverity: 'medium',
    mitreTactics: ['Execution'],
    fieldsSchema: [
      { id: 'host_name', label: 'Host Name', type: 'text', monospace: true, required: true },
      { id: 'username', label: 'User on Host', type: 'text', required: true },
      { id: 'cmd_command', label: 'CMD Command Line', type: 'textarea', monospace: true },
      { id: 'parent_process', label: 'Parent Process', type: 'text', monospace: true, placeholder: 'powershell.exe' },
      { id: 'context', label: 'Context / Reason', type: 'text', placeholder: 'Admin task / IT script' },
      { id: 's1_status', label: 'S1 Host Status', type: 'select', options: ['Healthy', 'Suspicious', 'Infected'] },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['benign_ca_success', 'suspicious_awaiting', 'malicious_ioc_blocked'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert was triggered due to the "PowerShell Spawning CMD" rule on the host "{{host_name}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 's1-powershell-session',
    name: 'Possible PowerShell Session Creation and Use',
    category: 'SENTINELONE',
    description: 'Possible PowerShell remoting session creation detected.',
    defaultSeverity: 'medium',
    mitreTactics: ['Execution', 'Lateral Movement'],
    fieldsSchema: [
      { id: 'host_name', label: 'Host Name', type: 'text', monospace: true, required: true },
      { id: 'username', label: 'User on Host', type: 'text', required: true },
      { id: 'ps_script', label: 'PowerShell Script / Command', type: 'textarea', monospace: true },
      { id: 'remote_host', label: 'Remote Host (if any)', type: 'text', monospace: true },
      { id: 'network_connections', label: 'Network Connections', type: 'select', options: ['None suspicious', 'Internal', 'External', 'Suspicious'] },
      { id: 's1_status', label: 'S1 Host Status', type: 'select', options: ['Healthy', 'Suspicious', 'Infected'] },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['benign_ca_success', 'suspicious_awaiting', 'malicious_ioc_blocked'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert was triggered due to "Possible PowerShell Session Creation and Use" on host "{{host_name}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  // ─── OTHERS ──────────────────────────────────────────────────────────────────
  {
    id: 'other-firewall-disabled',
    name: 'Windows Firewall Disabled',
    category: 'OTHERS',
    description: 'Windows Defender Firewall was disabled on a managed host.',
    defaultSeverity: 'medium',
    mitreTactics: ['Defense Evasion'],
    fieldsSchema: [
      { id: 'host_name', label: 'Host Name', type: 'text', monospace: true, required: true },
      { id: 'username', label: 'User on Host', type: 'text', required: true },
      { id: 'profile_affected', label: 'Firewall Profile Affected', type: 'select', options: ['Domain', 'Private', 'Public', 'All Profiles'] },
      { id: 'confirmed_by', label: 'Confirmed By (if expected)', type: 'text', placeholder: 'Kalaivanan, Naveen (ECI)' },
      { id: 'reason', label: 'Reason (if expected)', type: 'text', placeholder: 'Testing a URL' },
      { id: 'firewall_re_enabled', label: 'Firewall Re-enabled?', type: 'select', options: ['Yes', 'No', 'Pending'] },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['confirmed_expected', 'suspicious_awaiting', 'malicious_ioc_blocked'], required: true },
    ],
    observationsChecklist: [
      { id: 'obs-fw1', text: 'Upon checking logs, we could see that firewall setting for Enable Windows Defender Firewall profile was turned off on {{host_name}}.', variables: ['host_name'] },
      { id: 'obs-fw2', text: 'We have received confirmation from {{confirmed_by}} that the activity was expected and it was part of {{reason}} and Firewall has been enabled back.', variables: ['confirmed_by', 'reason'] },
    ],
    emailTemplate: `Hello All,

We have investigated the alert and below is the summary.

[ALERT SUMMARY]:

The alert was triggered due to Windows Firewall being disabled on host "{{host_name}}".

[NEXT STEPS]:

{{next_steps}}

I'll set this incident to resolved, but please don't hesitate to reach us if you have further questions or concerns to {{soc_email}}.

[OBSERVATIONS]:

{{observations}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'other-netsh-firewall',
    name: 'Disable Windows Firewall Rules via Netsh',
    category: 'OTHERS',
    description: 'Netsh command was used to disable Windows Firewall rules.',
    defaultSeverity: 'high',
    mitreTactics: ['Defense Evasion'],
    fieldsSchema: [
      { id: 'host_name', label: 'Host Name', type: 'text', monospace: true, required: true },
      { id: 'username', label: 'User on Host', type: 'text', required: true },
      { id: 'netsh_command', label: 'Netsh Command Line', type: 'textarea', monospace: true, placeholder: 'netsh advfirewall set allprofiles state off' },
      { id: 'parent_process', label: 'Parent Process', type: 'text', monospace: true },
      { id: 'rule_affected', label: 'Rule / Profile Affected', type: 'text' },
      { id: 's1_status', label: 'S1 Host Status', type: 'select', options: ['Healthy', 'Suspicious', 'Infected'] },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['benign_ca_success', 'suspicious_awaiting', 'malicious_ioc_blocked'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert was triggered due to "Disable Windows Firewall Rules via Netsh" on host "{{host_name}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'other-sc-exe',
    name: 'Sc.exe Manipulating Windows Services',
    category: 'OTHERS',
    description: 'Sc.exe was used to create, modify, or delete Windows services.',
    defaultSeverity: 'medium',
    mitreTactics: ['Persistence', 'Privilege Escalation'],
    fieldsSchema: [
      { id: 'host_name', label: 'Host Name', type: 'text', monospace: true, required: true },
      { id: 'username', label: 'User on Host', type: 'text', required: true },
      { id: 'service_name', label: 'Service Name', type: 'text', monospace: true },
      { id: 'sc_command', label: 'SC Command Line', type: 'textarea', monospace: true },
      { id: 'action', label: 'Action (create/modify/delete)', type: 'select', options: ['Create', 'Modify', 'Delete', 'Start', 'Stop'] },
      { id: 'confirmed_by', label: 'Confirmed By (if expected)', type: 'text' },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['confirmed_expected', 'suspicious_awaiting', 'malicious_ioc_blocked'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated the alert and below is the summary.

[ALERT SUMMARY]:

The alert was triggered due to Sc.exe Manipulating Windows Services on host "{{host_name}}".

[NEXT STEPS]:

{{next_steps}}

I'll set this incident to resolved, but please don't hesitate to reach us if you have further questions or concerns to {{soc_email}}.

[OBSERVATIONS]:

{{observations}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'other-scheduled-task-persistence',
    name: 'Detection of Persistence via New Scheduled Task',
    category: 'OTHERS',
    description: 'A new scheduled task was created that may indicate persistence.',
    defaultSeverity: 'medium',
    mitreTactics: ['Persistence'],
    fieldsSchema: [
      { id: 'host_name', label: 'Host Name', type: 'text', monospace: true, required: true },
      { id: 'username', label: 'User on Host', type: 'text', required: true },
      { id: 'task_name', label: 'Task Name', type: 'text', monospace: true },
      { id: 'task_path', label: 'Task Path', type: 'text', monospace: true },
      { id: 'trigger', label: 'Trigger', type: 'text', placeholder: 'On logon / At startup / Every 5 minutes' },
      { id: 'action_exe', label: 'Action / Executable', type: 'text', monospace: true },
      { id: 's1_status', label: 'S1 Host Status', type: 'select', options: ['Healthy', 'Suspicious', 'Infected'] },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['benign_ca_success', 'suspicious_awaiting', 'malicious_ioc_blocked'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert triggered due to detection of persistence via a new scheduled task on host "{{host_name}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'other-lateral-movement-schtasks',
    name: 'Possible Lateral Movement via Scheduled Tasks (schtasks.exe)',
    category: 'OTHERS',
    description: 'Schtasks.exe used for possible lateral movement across hosts.',
    defaultSeverity: 'high',
    mitreTactics: ['Lateral Movement', 'Execution'],
    fieldsSchema: [
      { id: 'host_name', label: 'Source Host', type: 'text', monospace: true, required: true },
      { id: 'dest_host', label: 'Destination Host', type: 'text', monospace: true },
      { id: 'username', label: 'User Account', type: 'text', required: true },
      { id: 'task_name', label: 'Task Name', type: 'text', monospace: true },
      { id: 's1_status', label: 'S1 Host Status', type: 'select', options: ['Healthy', 'Suspicious', 'Infected'] },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['suspicious_awaiting', 'malicious_ioc_blocked', 'benign_ca_success'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert triggered due to possible lateral movement via scheduled tasks (schtasks.exe) from host "{{host_name}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'other-lateral-startup-folder',
    name: 'Lateral Movement via Startup Folder',
    category: 'OTHERS',
    description: 'A file was placed in a startup folder, indicating potential lateral movement or persistence.',
    defaultSeverity: 'high',
    mitreTactics: ['Persistence', 'Lateral Movement'],
    fieldsSchema: [
      { id: 'host_name', label: 'Host Name', type: 'text', monospace: true, required: true },
      { id: 'username', label: 'User on Host', type: 'text', required: true },
      { id: 'file_name', label: 'File Name', type: 'text', monospace: true },
      { id: 'file_path', label: 'File Path', type: 'text', monospace: true },
      { id: 'originating_process', label: 'Originating Process', type: 'text', monospace: true },
      { id: 's1_status', label: 'S1 Host Status', type: 'select', options: ['Healthy', 'Suspicious', 'Infected'] },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['suspicious_awaiting', 'malicious_ioc_blocked', 'benign_ca_success'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert triggered due to lateral movement via startup folder on host "{{host_name}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'other-unusual-network-winbinary',
    name: 'Unusual Network Activity from a Windows System Binary',
    category: 'OTHERS',
    description: 'A Windows system binary initiated unexpected network connections.',
    defaultSeverity: 'medium',
    mitreTactics: ['Defense Evasion', 'Command and Control'],
    fieldsSchema: [
      { id: 'host_name', label: 'Host Name', type: 'text', monospace: true, required: true },
      { id: 'username', label: 'User on Host', type: 'text', required: true },
      { id: 'binary_name', label: 'Windows Binary', type: 'text', monospace: true, placeholder: 'curl.exe / certutil.exe' },
      { id: 'dest_ip', label: 'Destination IP', type: 'ip', defang: true, monospace: true },
      { id: 'dest_domain', label: 'Destination Domain', type: 'url', defang: true, monospace: true },
      { id: 'connection_type', label: 'Connection Type', type: 'text', placeholder: 'DNS query / HTTPS / HTTP' },
      { id: 'context', label: 'Context / Reason', type: 'textarea' },
      { id: 's1_status', label: 'S1 Host Status', type: 'select', options: ['Healthy', 'Suspicious', 'Infected'] },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['benign_ca_success', 'suspicious_awaiting', 'malicious_ioc_blocked'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert triggered due to unusual network activity from Windows system binary "{{binary_name}}" on host "{{host_name}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'other-netsh-wlan',
    name: 'Detection of Windows Netsh WLAN Profile Enumeration',
    category: 'OTHERS',
    description: 'Netsh was used to enumerate WLAN profiles, potentially exfiltrating Wi-Fi credentials.',
    defaultSeverity: 'medium',
    mitreTactics: ['Credential Access', 'Discovery'],
    fieldsSchema: [
      { id: 'host_name', label: 'Host Name', type: 'text', monospace: true, required: true },
      { id: 'username', label: 'User on Host', type: 'text', required: true },
      { id: 'netsh_command', label: 'Netsh Command', type: 'text', monospace: true, placeholder: 'netsh wlan show profile' },
      { id: 'context', label: 'Context', type: 'text' },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['benign_ca_success', 'suspicious_awaiting', 'malicious_ioc_blocked'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert triggered due to detection of Windows Netsh WLAN profile enumeration on host "{{host_name}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'other-browser-extension',
    name: 'Suspicious Browser Extension Load Activity',
    category: 'OTHERS',
    description: 'A suspicious browser extension was loaded on a managed endpoint.',
    defaultSeverity: 'low',
    mitreTactics: ['Persistence', 'Collection'],
    fieldsSchema: [
      { id: 'host_name', label: 'Host Name', type: 'text', monospace: true, required: true },
      { id: 'username', label: 'User on Host', type: 'text', required: true },
      { id: 'extension_name', label: 'Extension Name', type: 'text' },
      { id: 'browser', label: 'Browser', type: 'select', options: ['Chrome', 'Edge', 'Firefox', 'Brave', 'Opera'] },
      { id: 'extension_id', label: 'Extension ID', type: 'text', monospace: true },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['benign_ca_success', 'suspicious_awaiting', 'malicious_ioc_blocked'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert triggered due to suspicious browser extension load activity on host "{{host_name}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },

  {
    id: 'other-infostealer',
    name: 'Possible Infostealer Malware Detected',
    category: 'OTHERS',
    description: 'Possible infostealer malware detected based on behavioral patterns.',
    defaultSeverity: 'critical',
    mitreTactics: ['Credential Access', 'Collection', 'Exfiltration'],
    fieldsSchema: [
      { id: 'host_name', label: 'Host Name', type: 'text', monospace: true, required: true },
      { id: 'username', label: 'User on Host', type: 'text', required: true },
      { id: 'process_name', label: 'Process Name', type: 'text', monospace: true },
      { id: 'file_hash', label: 'File Hash', type: 'text', monospace: true },
      { id: 'hash_reputation', label: 'Hash Reputation', type: 'select', options: ['Malicious', 'Suspicious', 'Clean', 'Unknown'] },
      { id: 'c2_connections', label: 'C2 Connections Observed?', type: 'select', options: ['No', 'Yes', 'Unknown'] },
      { id: 'data_exfiltrated', label: 'Data Exfiltration Indicators?', type: 'select', options: ['No', 'Possible', 'Confirmed'] },
      { id: 's1_status', label: 'S1 Host Status', type: 'select', options: ['Healthy', 'Suspicious', 'Infected'] },
      { id: 'verdict_type', label: 'Next Step Type', type: 'select', options: ['malicious_ioc_blocked', 'suspicious_awaiting', 's1_killed_quarantined'], required: true },
    ],
    observationsChecklist: [],
    emailTemplate: `Hello All,

We have investigated this alert and below is the summary of our investigation.

[ALERT SUMMARY]:

This alert triggered due to possible infostealer malware detected on host "{{host_name}}".

[OBSERVATIONS]:

{{observations}}

[NEXT STEPS]:

{{next_steps}}

Regards,
{{analyst_name}}
ECI-SOC`,
  },
]

