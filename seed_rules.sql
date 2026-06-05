-- Seed script to bulk insert SIEM rules into rules_wiki
-- Run this in your Supabase Dashboard SQL Editor

DO $$
DECLARE
    u record;
    r text;
    rule_list text[] := ARRAY[
        'Enumeration of Administrator Accounts',
        'Network Connection via Registration Utility',
        'File Downloaded via Curl File Detected',
        'Potential Use of msiexec.exe as a Living Off the Land Technique',
        'Lateral Movement via WMI',
        'Windows Security Event Log Cleared',
        'Suspicious Write Files Using Zip',
        'Possible PowerShell Session Creation and Use',
        'Suspicious Writes to Windows Recycle Bin',
        'Account Added to Privileged or Sensitive Security Group',
        'Detecting Script-Based Launch of msiexec.exe or net.exe',
        'Service Control Spawned via Script Interpreter',
        'Execution of File Written or Modified by Microsoft Office',
        'MsBuild Making Network Connections',
        'Torrent Downloads',
        'Remote File Download via Desktopimgdownldr Utility',
        'Suspicious ARP Command Usage by Unknown Process',
        'Potential Brute Force Attack Detected',
        'Windows Event Logs Cleared',
        'Potential Brute Force/Password Spraying Attack on Public Facing Service Detected',
        'Executable File Creation with Multiple Extensions',
        'Suspicious Browser Extension Load Activity (via cmdline)',
        'UAC Disable Attempt (via registry_event)',
        'Detection of Suspicious Tunneling and Web Server Processes',
        'Remote Execution via File Shares',
        'Windows Network Enumeration',
        'RDP Files Written by Outlook',
        'Microsoft Windows Defender Tampering',
        'Possible Lateral Movement via Scheduled Tasks [schtasks.exe] (via cmdline)',
        'Threat Intel Hash Indicator Match',
        'Suspicious Account Changes [Password Never Expires]',
        'Create or Delete Windows Shares Using Net.exe',
        'Detection of Windows Netsh WLAN Profile Enumeration Activity',
        'Cmdkey Cached Credentials Recon',
        'Detection of Persistence via New Scheduled Task',
        'Suspicious Outbound Traffic Detected From Windows System',
        'Possible Network Scan via Nmap (via cmdline)',
        'Possible Infostealer Malware Detected',
        'Setuid / Setgid Bit Set via Chmod',
        'Threat Intel IP Address Indicator Match [FS-ISAC]',
        'Linux Possible Access Credential Files (via process creation)',
        'The Netlogon Service Denied a Vulnerable Netlogon Secure Channel Connection (CVE-2020-1472)',
        'Possible PsExec Execution Detected',
        'Unusual Parent Process for cmd.exe',
        'Removal Of Syslog Files Detected',
        'Probable Suspicious Traffic Allowed',
        'Suspicious Elevate Execution (via cmdline)',
        'PowerShell Downgrade Attack Detected',
        'Anomalous PowerShell Usage from Temp Location',
        'Disable Windows Firewall Rules via Netsh',
        'Lateral Movement via Startup Folder',
        'Suspicious JAVA Child Process',
        'Threat Intel URL Indicator Match',
        'Azure Global Administrator Role Addition to PIM Use',
        'Remote File Copy via TeamViewer',
        'Microsoft 365 Exchange Safe Link Policy Disabled',
        'Suspicious Activity Using Ping.exe',
        'Microsoft 365 Exchange Management Group Role Assignment',
        'Azure Active Directory High Risk Sign-in/Heuristic',
        'UnwantedSoftware',
        'Exfiltration',
        'Regsvr32.exe launched suspicious commands',
        'A potentially malicious URL click was detected',
        'Anonymous IP address involving one user',
        'Impossible travel activity involving one user',
        'Malware detection involving one user',
        'Email reported by user as malware or phish involving one user',
        'Activity from an anonymous proxy involving one user',
        'Anomalous Token involving one user',
        'Detect and notify when outdated browser OS is used involving one user',
        'User Reported Fraudulent DUO MFA Prompt',
        'Multiple threat families detected on one endpoint',
        'An active ''NetShFirewallRuleAdd'' malware in a command line was prevented from executing',
        'Email messages removed after delivery involving one user',
        'An active ''Wacatac'' malware was detected',
        'App accessed sensitive data',
        'Connection to a suspicious domain related to credential phishing',
        'Potential Duo MFA Brute Force Attack Detected',
        'User account compromise identified from a known attack pattern (attack disruption)',
        '''Presenoker'' unwanted software was prevented',
        'Unfamiliar sign-in properties involving one user',
        'Potential Microsoft 365 MFA Brute Force Attack Detected (Agent)',
        'Removed an entry in Tenant Allow/Block List',
        'Suspicious activity incident involving one user',
        'Threat analytics report from Microsoft 365 Defender',
        'Threat Detected by SentinelOne',
        'Failed Attempt to Remove EPP or EDR Agent',
        'SentinelOne Unresolved & Mitigated Threats Detected'
    ];
BEGIN
    -- Loop through EVERY user in the database
    FOR u IN SELECT id FROM auth.users
    LOOP
        -- Insert all rules for this specific user
        FOREACH r IN ARRAY rule_list
        LOOP
            INSERT INTO public.rules_wiki (user_id, rule_name, content)
            VALUES (u.id, r, '')
            ON CONFLICT (user_id, rule_name) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;
