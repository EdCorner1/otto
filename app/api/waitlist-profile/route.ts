import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type Role = 'creator' | 'brand'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const WAITLIST_PROFILE_BUCKET = 'waitlist-profiles'

function isValidRole(value: unknown): value is Role {
  return value === 'creator' || value === 'brand'
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function safeEmailFileName(email: string) {
  return email.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '-').replace('@', '__at__')
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
      return NextResponse.json({ error: 'Waitlist profile storage is not configured yet.' }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const payload = {
      email,
      role,
      submitted_at: new Date().toISOString(),
      answers: Object.fromEntries(
        Object.entries(body || {}).filter(([key]) => !['email', 'role'].includes(key))
      ),
    }

    const { error: waitlistError } = await supabase
      .from('waitlist')
      .upsert([{ email, role }], { onConflict: 'email' })

    if (waitlistError) {
      return NextResponse.json({ error: 'Could not save the waitlist profile right now.' }, { status: 500 })
    }

    await supabase.storage.createBucket(WAITLIST_PROFILE_BUCKET, {
      public: false,
      fileSizeLimit: 1024 * 1024,
    }).catch(() => undefined)

    const filePath = `${role}/${safeEmailFileName(email)}.json`
    const { error: uploadError } = await supabase.storage
      .from(WAITLIST_PROFILE_BUCKET)
      .upload(filePath, JSON.stringify(payload, null, 2), {
        contentType: 'application/json',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Could not save the waitlist profile right now.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Could not save the waitlist profile right now.' }, { status: 500 })
  }
}
