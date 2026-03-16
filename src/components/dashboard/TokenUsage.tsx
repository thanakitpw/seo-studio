interface TokenUsageProps {
  totalTokens: number
  totalArticles: number
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

// Approximate cost: Claude Sonnet input+output blended ~$3.50/1M tokens ≈ ฿120/1M
// Using ฿350/1M as a rough blended rate for the pipeline
const BAHT_PER_TOKEN = 350 / 1_000_000

export default function TokenUsage({ totalTokens, totalArticles }: TokenUsageProps) {
  const totalCost = Math.round(totalTokens * BAHT_PER_TOKEN)
  const avgTokens = totalArticles > 0 ? Math.round(totalTokens / totalArticles) : 0
  const avgCost = totalArticles > 0 ? Math.round(totalCost / totalArticles) : 0

  return (
    <div className="flex flex-col rounded-xl gap-5 bg-white border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-900">
        การใช้งาน Token
      </h2>
      <div className="flex gap-10">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400">
            Total Tokens
          </span>
          <span className="text-2xl font-bold text-slate-900 font-[Inter]">
            {formatTokens(totalTokens)}
          </span>
        </div>
        <div className="w-px bg-slate-200 shrink-0" />
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400">
            ค่าใช้จ่ายโดยประมาณ
          </span>
          <span className="text-2xl font-bold text-[#6467F2] font-[Inter]">
            ฿{totalCost.toLocaleString()}
          </span>
        </div>
        <div className="w-px bg-slate-200 shrink-0" />
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400">
            เฉลี่ยต่อบทความ
          </span>
          <span className="text-2xl font-bold text-slate-900 font-[Inter]">
            {formatTokens(avgTokens)} tokens (≈ ฿{avgCost})
          </span>
        </div>
      </div>
    </div>
  )
}
