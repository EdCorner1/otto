import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type Role = 'creator' | 'brand'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function isValidRole(value: unknown): value is Role {
  return value === 'creator' || value === 'brand'
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const role = body?.role
    const email = String(body?.email || '').trim().toLowerCase()

    if (!isValidRole(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Waitlist is not configured yet.' }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { error } = await supabase
      .from('waitlist')
      .upsert([{ email, role }], { onConflict: 'email' })

    if (error) {
      return NextResponse.json({ error: 'Could not join the waitlist right now.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Could not join the waitlist right now.' }, { status: 500 })
  }
}
