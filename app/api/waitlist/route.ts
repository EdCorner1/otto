import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const SEGMENT_NAMES = {
  creator: 'OttoUGC Creators',
  brand: 'OttoUGC Brands',
} as const

type Role = keyof typeof SEGMENT_NAMES

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

function isValidRole(value: unknown): value is Role {
  return value === 'creator' || value === 'brand'
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function ensureSegment(role: Role) {
  if (!resend) return null

  const targetName = SEGMENT_NAMES[role]
  const listed = await resend.segments.list({ limit: 100 })

  if (listed.error) {
    throw new Error(listed.error.message || 'Could not list Resend segments')
  }

  const existing = listed.data?.data?.find((segment) => segment.name === targetName)
  if (existing) return existing.id

  const created = await resend.segments.create({ name: targetName })
  if (created.error || !created.data?.id) {
    throw new Error(created.error?.message || 'Could not create Resend segment')
  }

  return created.data.id
}

async function syncToResend(email: string, role: Role) {
  if (!resend) return { ok: false, reason: 'missing_resend_key' as const }

  const segmentId = await ensureSegment(role)
  if (!segmentId) return { ok: false, reason: 'missing_segment' as const }

  const created = await resend.contacts.create({
    email,
    unsubscribed: false,
    properties: {
      role,
      source: 'otto-ugc-waitlist-hero',
    },
    segments: [{ id: segmentId }],
  })

  if (!created.error) {
    return { ok: true as const }
  }

  const added = await resend.contacts.segments.add({ email, segmentId })
  if (added.error) {
    throw new Error(added.error.message || 'Could not add contact to segment')
  }

  await resend.contacts.update({
    email,
    unsubscribed: false,
    properties: {
      role,
      source: 'otto-ugc-waitlist-hero',
    },
  })

  return { ok: true as const }
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

    let dbOk = false
    let resendOk = false

    if (supabase) {
      const { error } = await supabase
        .from('waitlist')
        .upsert([{ email, role }], { onConflict: 'email' })

      dbOk = !error
    }

    try {
      const resendResult = await syncToResend(email, role)
      resendOk = resendResult.ok
    } catch {
      resendOk = false
    }

    if (!dbOk && !resendOk) {
      return NextResponse.json(
        { error: 'Could not join the waitlist right now. Try again in a minute.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, resendConfigured: !!RESEND_API_KEY })
  } catch {
    return NextResponse.json(
      { error: 'Could not join the waitlist right now. Try again in a minute.' },
      { status: 500 }
    )
  }
}
