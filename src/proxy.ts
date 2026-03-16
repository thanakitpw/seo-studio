import { createHash } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'

function sessionToken() {
  const password = process.env.ADMIN_PASSWORD ?? ''
  const secret = process.env.AUTH_SECRET ?? 'seo-studio-secret'
  return createHash('sha256').update(password + secret).digest('hex')
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths — ไม่ต้อง auth
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  const cookie = request.cookies.get('seo-studio-session')
  const isAuthenticated = cookie?.value === sessionToken()

  if (!isAuthenticated) {
    // API routes return 401 JSON instead of redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
