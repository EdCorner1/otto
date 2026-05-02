import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const canonicalOrigin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const url = new URL('/auth/callback', canonicalOrigin)
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value)
  })
  return NextResponse.redirect(url)
}
