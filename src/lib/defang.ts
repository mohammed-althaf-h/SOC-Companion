// ─── IP / URL / Email defanging utilities ─────────────────────────────────────
// Used throughout the app to display IOCs safely in emails and reports

/**
 * Defangs an IP address: 192.168.1.1 → 192.168.1[.]1
 */
export function defangIP(ip: string): string {
  return ip.trim().replace(/\./g, '[.]')
}

/**
 * Defangs a URL: https://malicious.com/path → hxxps[://]malicious[.]com/path
 */
export function defangURL(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//i, (match) =>
      match.toLowerCase().replace('https://', 'hxxps[://]').replace('http://', 'hxxp[://]')
    )
    .replace(/\./g, '[.]')
}

/**
 * Defangs an email address: user@domain.com → user[@]domain[.]com
 */
export function defangEmail(email: string): string {
  return email.trim().replace('@', '[@]').replace(/\./g, '[.]')
}

/**
 * Detects and defangs any value based on its apparent type
 */
export function autoDefang(value: string, type: 'ip' | 'url' | 'email' | 'text'): string {
  switch (type) {
    case 'ip':
      return defangIP(value)
    case 'url':
      return defangURL(value)
    case 'email':
      return defangEmail(value)
    default:
      return value
  }
}

/**
 * Refangs a defanged value back to raw form (for storing in DB)
 */
export function refang(value: string): string {
  return value
    .replace(/\[\.]/g, '.')
    .replace(/\[:\]/g, ':')
    .replace(/\[\/\/]/g, '//')
    .replace(/hxxps/gi, 'https')
    .replace(/hxxp/gi, 'http')
    .replace(/\[@]/g, '@')
}

/**
 * Checks if a string looks like an IP address
 */
export function looksLikeIP(value: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value.trim())
}

/**
 * Checks if a string looks like a URL
 */
export function looksLikeURL(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

/**
 * Checks if a string looks like an email
 */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/**
 * Defangs all IPs in a block of text
 */
export function defangTextIPs(text: string): string {
  return text.replace(/\b(\d{1,3}\.){3}\d{1,3}\b/g, (ip) => defangIP(ip))
}
