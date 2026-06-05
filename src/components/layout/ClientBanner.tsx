import { Lock } from 'lucide-react'
import type { Client, Severity } from '@/types'
import { severityColor } from '@/lib/utils'

interface ClientBannerProps {
  client: Client
  caseNumber?: string
  severity?: Severity
}

export default function ClientBanner({ client, caseNumber, severity }: ClientBannerProps) {
  return (
    <div
      className="w-full h-11 flex items-center px-4 gap-3 font-semibold text-white shadow-lg mb-6 rounded-lg"
      style={{ backgroundColor: client.color_tag }}
    >
      <Lock className="w-4 h-4 flex-shrink-0 opacity-90" />
      <span className="text-sm tracking-wide">
        CLIENT: <span className="font-bold">{client.name.toUpperCase()}</span>
      </span>
      <span className="opacity-60 text-xs">|</span>
      <span className="text-xs font-mono opacity-80">{client.short_code}</span>

      {caseNumber && (
        <>
          <span className="opacity-60 text-xs">|</span>
          <span className="text-xs font-mono">Case: {caseNumber}</span>
        </>
      )}

      {severity && (
        <>
          <span className="opacity-60 text-xs">|</span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: '#fff' }}
          >
            {severity.toUpperCase()}
          </span>
        </>
      )}

      <div className="ml-auto text-xs opacity-60 font-normal">
        ⚠️ Working in this client's context — do not mix data
      </div>
    </div>
  )
}
