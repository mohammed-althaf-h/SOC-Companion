import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function severityClass(severity: string) {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'info': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  }
}

export function severityColor(severity: string) {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'text-red-500';
    case 'high': return 'text-orange-500';
    case 'medium': return 'text-yellow-500';
    case 'low': return 'text-blue-500';
    case 'info': return 'text-slate-500';
    default: return 'text-slate-500';
  }
}

export function statusClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'new': return 'border-blue-500/30 text-blue-500 bg-blue-500/5';
    case 'in_progress': return 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5';
    case 'pending': return 'border-orange-500/30 text-orange-500 bg-orange-500/5';
    case 'closed': return 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5';
    case 'resolved': return 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5';
    default: return 'border-slate-500/30 text-slate-500 bg-slate-500/5';
  }
}

export function statusLabel(status: string) {
  return status?.replace(/_/g, ' ') || 'Unknown';
}

export function categoryLabel(category: string) {
  return category?.replace(/_/g, ' ') || 'Unknown';
}

export function formatDateTime(date: string | Date | undefined | null) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

export function formatDateTimeLocal(date: string | Date | undefined | null) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
