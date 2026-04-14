import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const OPENCLAW_GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const SEGMENT_NAMES = {
  creator: 'OttoUGC Creators',
  brand: 'OttoUGC Brands',
} as const

type Role = keyof typeof SEGMENT_NAMES

type GatewayResponse<T> = {
  data: T | null
  error: { message?: string; name?: string; statusCode?: number | null } | null
}

type Segment = { id: string; name: string }

type ListSegmentsResponse = {
  object: 'list'
  data: Segment[]
  has_more: boolean
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null

function isValidRole(value: unknown): value is Role {
  return value === 'creator' || value === 'brand'
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function gateway<T = unknown>(path: string, options: RequestInit = {}): Promise<GatewayResponse<T>> {
  if (!OPENCLAW_GATEWAY_TOKEN) {
    return {
      data: null,
      error: { message: 'Missing Otto gateway token.' },
    }
  }

  const res = await fetch(`https://gateway.maton.ai${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${OPENCLAW_GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    return {
      data: null,
      error: json?.error || json || { message: res.statusText, statusCode: res.status },
    }
  }

  return {
    data: (json?.data ?? json) as T,
    error: null,
  }
}

async function ensureSegment(role: Role) {
  const targetName = SEGMENT_NAMES[role]

  const listed = await gateway<ListSegmentsResponse>('/resend/segments?limit=100', {
    method: 'GET',
  })

  if (listed.error) {
    throw new Error(listed.error.message || 'Could not list Resend segments')
  }

  const existing = listed.data?.data?.find((segment) => segment.name === targetName)
  if (existing) return existing.id

  const created = await gateway<{ id: string }>('/resend/segments', {
    method: 'POST',
    body: JSON.stringify({ name: targetName }),
  })

  if (created.error || !created.data?.id) {
    throw new Error(created.error?.message || 'Could not create Resend segment')
  }

  return created.data.id
}

async function syncToResend(email: string, role: Role) {
  if (!OPENCLAW_GATEWAY_TOKEN) return { ok: false as const, reason: 'missing_gateway_token' as const }

  const segmentId = await ensureSegment(role)

  const created = await gateway('/resend/contacts', {
    method: 'POST',
    body: JSON.stringify({
      email,
      unsubscribed: false,
      properties: {
        role,
        source: 'otto-ugc-waitlist-hero',
      },
      segments: [{ id: segmentId }],
    }),
  })

  if (!created.error) {
    return { ok: true as const }
  }

  const added = await gateway(`/resend/contacts/${encodeURIComponent(email)}/segments/${segmentId}`, {
    method: 'POST',
  })

  if (added.error) {
    throw new Error(added.error.message || 'Could not add contact to segment')
  }

  await gateway(`/resend/contacts/${encodeURIComponent(email)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      unsubscribed: false,
      properties: {
        role,
        source: 'otto-ugc-waitlist-hero',
      },
    }),
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

    return NextResponse.json({ ok: true, resendConfigured: !!OPENCLAW_GATEWAY_TOKEN })
  } catch {
    return NextResponse.json(
      { error: 'Could not join the waitlist right now. Try again in a minute.' },
      { status: 500 }
    )
  }
}
