'use client'

import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: PaginationProps) {
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, 'ellipsis', totalPages)
      } else if (page >= totalPages - 2) {
        pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages)
      }
    }
    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between py-4">
      <span className="text-sm text-muted-foreground">
        แสดง {start}-{end} จาก {total}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-border bg-white px-3 text-sm text-muted-foreground',
            'transition-colors hover:bg-muted hover:text-foreground',
            'disabled:cursor-not-allowed disabled:opacity-40'
          )}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
          ก่อนหน้า
        </button>

        {getPageNumbers().map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-sm font-medium transition-colors',
                p === page
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-border bg-white px-3 text-sm text-muted-foreground',
            'transition-colors hover:bg-muted hover:text-foreground',
            'disabled:cursor-not-allowed disabled:opacity-40'
          )}
        >
          ถัดไป
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
        </button>
      </div>
    </div>
  )
}
