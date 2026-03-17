'use client'

import { cn } from '@/lib/utils'

interface AiAssistButtonProps {
  onClick: () => void
  loading?: boolean
}

export function AiAssistButton({ onClick, loading = false }: AiAssistButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title="AI ช่วยสร้าง"
      className={cn(
        'inline-flex items-center justify-center size-6 rounded-md transition-colors',
        'text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        'disabled:pointer-events-none disabled:opacity-50'
      )}
    >
      <span
        className={cn(
          'material-symbols-outlined text-[18px]',
          loading && 'animate-spin'
        )}
      >
        {loading ? 'progress_activity' : 'auto_awesome'}
      </span>
    </button>
  )
}
