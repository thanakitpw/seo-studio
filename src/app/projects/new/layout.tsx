export default function NewProjectLayout({
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
