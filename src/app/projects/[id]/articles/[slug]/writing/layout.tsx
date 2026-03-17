export default function WritingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      {children}
    </div>
  )
}
