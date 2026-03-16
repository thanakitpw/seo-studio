import { cn } from '@/lib/utils'

interface StatCard {
  label: string
  value: number
  unit: string
  color: 'neutral' | 'emerald' | 'amber' | 'muted'
}

interface StatsCardsProps {
  totalKeywords: number
  publishedArticles: number
  draftArticles: number
  pendingKeywords: number
}

const colorMap = {
  neutral: {
    label: 'text-slate-400',
    value: 'text-slate-900',
  },
  emerald: {
    label: 'text-emerald-500',
    value: 'text-emerald-500',
  },
  amber: {
    label: 'text-amber-500',
    value: 'text-amber-500',
  },
  muted: {
    label: 'text-slate-400',
    value: 'text-slate-900',
  },
}

export default function StatsCards({
  totalKeywords,
  publishedArticles,
  draftArticles,
  pendingKeywords,
}: StatsCardsProps) {
  const cards: StatCard[] = [
    { label: 'ทั้งหมด', value: totalKeywords, unit: 'คำหลัก', color: 'neutral' },
    { label: 'เผยแพร่แล้ว', value: publishedArticles, unit: 'บทความ', color: 'emerald' },
    { label: 'ร่างอยู่', value: draftArticles, unit: 'บทความ', color: 'amber' },
    { label: 'รอดำเนินการ', value: pendingKeywords, unit: 'คำหลัก', color: 'muted' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex flex-col rounded-xl gap-1 bg-white border border-slate-200 p-5"
        >
          <div className={cn('text-xs font-medium', colorMap[card.color].label)}>
            {card.label}
          </div>
          <div className={cn('text-[28px] font-bold leading-tight font-[Inter]', colorMap[card.color].value)}>
            {card.value}
          </div>
          <div className="text-xs text-slate-400">
            {card.unit}
          </div>
        </div>
      ))}
    </div>
  )
}
