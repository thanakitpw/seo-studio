import Link from 'next/link'

// Mock data — จะเปลี่ยนเป็น fetch จาก /api/projects ภายหลัง
const mockProjects = [
  {
    id: '1',
    name: 'Best Solutions',
    initials: 'BS',
    avatarColor: 'bg-[#6467f2]',
    domain: 'bestsolutions.co.th',
    status: 'active' as const,
    keywords: 75,
    published: 12,
    drafts: 8,
    updatedAt: '2 ชม. ก่อน',
  },
  {
    id: '2',
    name: 'Client A',
    initials: 'CA',
    avatarColor: 'bg-[#f59e0b]',
    domain: 'clienta.com',
    status: 'active' as const,
    keywords: 42,
    published: 6,
    drafts: 3,
    updatedAt: '1 วัน ก่อน',
  },
]

export default function ProjectsPage() {
  const projectCount = mockProjects.length

  return (
    <div className="min-h-screen bg-[#f6f6f8] p-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Title + Badge */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">โปรเจคของฉัน</h1>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
            {projectCount}
          </span>
        </div>

        {/* Right: Search + Create Button */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
              search
            </span>
            <input
              type="text"
              placeholder="ค้นหาโปรเจค..."
              className="h-10 w-64 rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#6467f2] focus:outline-none focus:ring-1 focus:ring-[#6467f2]"
            />
          </div>
          <Link
            href="/projects/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#6467f2] px-4 text-sm font-medium text-white transition hover:bg-[#5457e5]"
          >
            <span className="text-lg leading-none">+</span>
            สร้างโปรเจค
          </Link>
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Project Cards */}
        {mockProjects.map((project) => (
          <div
            key={project.id}
            className="rounded-xl border border-slate-200 bg-white p-6 transition hover:shadow-sm"
          >
            {/* Card Header */}
            <div className="relative mb-6 flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${project.avatarColor}`}
              >
                {project.initials}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-slate-900">
                  {project.name}
                </h3>
                <p className="truncate text-sm text-slate-500">
                  {project.domain}
                </p>
              </div>
              {/* Active indicator */}
              {project.status === 'active' && (
                <span className="absolute right-0 top-0 h-3 w-3 rounded-full bg-emerald-400" />
              )}
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-slate-700">
                  {project.keywords}
                </p>
                <p className="mt-1 text-xs text-slate-500">คำหลัก</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-600">
                  {project.published}
                </p>
                <p className="mt-1 text-xs text-slate-500">เผยแพร่</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-500">
                  {project.drafts}
                </p>
                <p className="mt-1 text-xs text-slate-500">ร่าง</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400">
                อัพเดทล่าสุด {project.updatedAt}
              </p>
              <Link
                href={`/projects/${project.id}/dashboard`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                เปิดโปรเจค
                <span className="text-xs">&gt;</span>
              </Link>
            </div>
          </div>
        ))}

        {/* New Project Card (dashed) */}
        <Link
          href="/projects/new"
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 transition hover:border-slate-400 hover:shadow-sm"
        >
          <span className="material-symbols-outlined mb-3 text-5xl text-slate-400">
            add
          </span>
          <p className="text-base font-semibold text-slate-700">
            สร้างโปรเจคใหม่
          </p>
          <p className="mt-1 text-sm text-slate-400">
            เชื่อมต่อกับเว็บไซต์ลูกค้า
          </p>
        </Link>
      </div>
    </div>
  )
}
