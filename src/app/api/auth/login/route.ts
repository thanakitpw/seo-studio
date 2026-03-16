import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

function sessionToken() {
  const password = process.env.ADMIN_PASSWORD ?? ''
  const secret = process.env.AUTH_SECRET ?? 'seo-studio-secret'
  return createHash('sha256').update(password + secret).digest('hex')
}

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('seo-studio-session', sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 วัน
    path: '/',
  })
  return response
}
