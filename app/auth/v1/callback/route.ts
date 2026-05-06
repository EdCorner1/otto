import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const canonicalOrigin = configuredOrigin.includes('edcorner.co.uk')
    ? 'https://ottougc.com'
    : configuredOrigin
  const url = new URL('/auth/callback', canonicalOrigin)
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value)
  })
  return NextResponse.redirect(url)
}
