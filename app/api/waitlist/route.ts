import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type Role = 'creator' | 'brand'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_AUDIENCE_ID = process.env.RESEND_OTTO_WAITLIST_AUDIENCE_ID // Creator Waitlist audience
const RESEND_API_BASE = 'https://api.resend.com'

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

    // Add to Resend audience — store role in first_name field for segmentation
    // "Creator" or "Brand" prefix lets us identify the segment in Resend
    if (RESEND_API_KEY && RESEND_AUDIENCE_ID) {
      try {
        await fetch(`${RESEND_API_BASE}/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            // Prefix with role so we can segment in Resend without separate audiences
            first_name: `${role.charAt(0).toUpperCase() + role.slice(1)}`,
            unsubscribed: false,
          }),
        })
      } catch {
        // Non-fatal — waitlist is already in Supabase
      }
    }

    // Redirect URL is sent back so the client can navigate to the welcome page
    const redirectUrl = role === 'creator' ? '/creators/welcome' : '/brands/welcome'
    return NextResponse.json({ ok: true, redirectUrl })
  } catch {
    return NextResponse.json({ error: 'Could not join the waitlist right now.' }, { status: 500 })
  }
}
