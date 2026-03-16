import { NextResponse } from 'next/server'

// GET /api/keywords/template — download CSV template
export async function GET() {
  const csv = `Title,Primary Keyword,Cluster,Content Type,Priority
ตัวอย่างบทความ,ตัวอย่าง keyword,หมวดหมู่,Blog,High`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="keywords-template.csv"',
    },
  })
}
