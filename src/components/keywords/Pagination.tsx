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
      <span className="text-sm text-slate-500">
        แสดง {start}-{end} จาก {total}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'flex h-[30px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600',
            'hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          ก่อนหน้า
        </button>

        {getPageNumbers().map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium',
                p === page
                  ? 'bg-primary text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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
            'flex h-[30px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600',
            'hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          ถัดไป
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
