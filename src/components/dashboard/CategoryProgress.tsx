interface CategoryItem {
  name: string
  published: number
  total: number
}

interface CategoryProgressProps {
  categories: CategoryItem[]
}

export default function CategoryProgress({ categories }: CategoryProgressProps) {
  return (
    <div className="flex flex-col flex-1 rounded-xl gap-5 bg-white border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-900">
        หมวดหมู่
      </h2>
      <div className="flex flex-col gap-4">
        {categories.map((cat) => {
          const percent = cat.total > 0 ? Math.round((cat.published / cat.total) * 100) : 0
          return (
            <div key={cat.name} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  {cat.name}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {cat.published}/{cat.total}
                </span>
              </div>
              <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100 shrink-0">
                <div
                  className="h-1.5 rounded-full bg-[#6467F2]"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
