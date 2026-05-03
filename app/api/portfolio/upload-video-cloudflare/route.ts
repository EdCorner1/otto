import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  return NextResponse.json(
    { error: 'Legacy Cloudflare upload route is disabled. Use /api/portfolio/create-direct-upload.' },
    { status: 410 },
  )
}
