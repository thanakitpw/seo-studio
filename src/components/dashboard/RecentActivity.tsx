import type { KeywordStatus } from '@/types'

interface ActivityItem {
  title: string
  status: KeywordStatus
  updated_at: string
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

const statusConfig: Record<string, { label: string; dotColor: string }> = {
  published: { label: 'เผยแพร่แล้ว', dotColor: 'bg-emerald-500' },
  draft: { label: 'บันทึกร่าง', dotColor: 'bg-amber-500' },
  review: { label: 'รอตรวจสอบ', dotColor: 'bg-amber-500' },
  'brief-ready': { label: 'สร้าง Brief', dotColor: 'bg-[#6467F2]' },
  'generating-brief': { label: 'กำลังสร้าง Brief', dotColor: 'bg-[#6467F2]' },
  'generating-article': { label: 'กำลังสร้างบทความ', dotColor: 'bg-[#6467F2]' },
  pending: { label: 'รอดำเนินการ', dotColor: 'bg-slate-400' },
}

function getRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'เมื่อสักครู่'
  if (diffMin < 60) return `${diffMin} นาทีก่อน`
  if (diffHr < 24) return `${diffHr} ชม. ก่อน`
  if (diffDay < 30) return `${diffDay} วันก่อน`
  return `${Math.floor(diffDay / 30)} เดือนก่อน`
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="flex flex-col rounded-xl bg-white border border-slate-200 p-6 min-h-0">
      <h2 className="text-base font-semibold text-slate-900 shrink-0 mb-4">
        กิจกรรมล่าสุด
      </h2>
      <div className="flex flex-col gap-3.5 overflow-y-auto flex-1">
        {activities.length === 0 && (
          <p className="text-sm text-slate-400">ยังไม่มีกิจกรรม</p>
        )}
        {activities.map((item, i) => {
          const config = statusConfig[item.status] ?? statusConfig.pending
          return (
            <div key={i} className="flex items-center gap-2.5">
              <div className={`shrink-0 rounded-full size-2 ${config.dotColor}`} />
              <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                <span className="text-sm font-semibold text-slate-900 truncate">
                  {item.title}
                </span>
                <span className="text-xs text-slate-400">
                  {config.label}
                </span>
              </div>
              <span className="text-xs text-slate-400 shrink-0">
                {getRelativeTime(item.updated_at)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
