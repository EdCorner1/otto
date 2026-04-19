import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const DEFAULT_ALLOWED_EMAILS = ['edcorner1@gmail.com']

function getAllowedEmails() {
  const fromEnv = process.env.OTTO_PLATFORM_ALLOWED_EMAILS
    ?.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  return fromEnv?.length ? fromEnv : DEFAULT_ALLOWED_EMAILS
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''

  if (host === 'otto.edcorner.co.uk' || host === 'www.ottougc.com') {
    const redirectUrl = new URL(request.url)
    redirectUrl.protocol = 'https:'
    redirectUrl.host = 'ottougc.com'
    return NextResponse.redirect(redirectUrl, 308)
  }

  const publicExactRoutes = [
    '/',
    '/login',
    '/signup',
    '/creators/welcome',
    '/brands/welcome',
  ]

  const publicPrefixes = [
    '/auth/callback',
    '/auth/v1',
    '/blog',
    '/resources',
    '/explore',
    '/api/waitlist',
    '/api/creators/handle',
  ]

  const reservedPrefixes = [
    '/dashboard',
    '/messages',
    '/notifications',
    '/profile',
    '/jobs',
    '/live-campaigns',
    '/search',
    '/settings',
    '/explore',
    '/creators',
    '/brands',
    '/blog',
    '/resources',
    '/platform',
    '/login',
    '/signup',
    '/onboarding',
    '/ops',
    '/ed',
    '/auth',
    '/api',
  ]

  const looksLikePublicHandle =
    /^\/[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(pathname) &&
    !reservedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

  const isPublic =
    publicExactRoutes.includes(pathname) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    looksLikePublicHandle

  if (isPublic) {
    return NextResponse.next()
  }

  // All other routes require auth
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  const allowedEmails = getAllowedEmails()
  const email = (user.email || '').toLowerCase()

  if (!allowedEmails.includes(email)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  // Only run middleware on non-static, non-api routes
  // Next.js runs this matcher against every pathname
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)).*)',
  ],
}
