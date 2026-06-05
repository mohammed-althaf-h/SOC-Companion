import type { Client } from '@/types'
import { cn } from '@/lib/utils'

interface ClientBadgeProps {
  client: Client
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

export default function ClientBadge({ client, size = 'sm', showName = true, className }: ClientBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-2.5 py-1 gap-2',
    lg: 'text-base px-3 py-1.5 gap-2',
  }

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold border',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${client.color_tag}20`,
        borderColor: `${client.color_tag}40`,
        color: client.color_tag,
      }}
    >
      <span
        className={cn('rounded-full flex-shrink-0', dotSizes[size])}
        style={{ backgroundColor: client.color_tag }}
      />
      {showName && <span>{client.short_code}</span>}
    </span>
  )
}
