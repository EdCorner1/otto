import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json(
    { error: 'Mux uploads are disabled. Use Cloudflare direct uploads.' },
    { status: 410 },
  )
}
