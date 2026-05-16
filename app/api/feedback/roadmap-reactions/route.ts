import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type Role = 'creator' | 'brand'
type Vote = 'up' | 'down' | 'none'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const REACTIONS_BUCKET = 'roadmap-reactions'

function sanitizeText(value: unknown) {
  return String(value || '').trim()
}

function isValidRole(value: unknown): value is Role {
  return value === 'creator' || value === 'brand'
}

function isValidVote(value: unknown): value is Vote {
  return value === 'up' || value === 'down' || value === 'none'
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)

    const cardId = sanitizeText(body?.cardId)
    const vote = body?.vote
    const role = body?.role
    const page = sanitizeText(body?.page) || 'home-roadmap'
    const emailRaw = sanitizeText(body?.email).toLowerCase()
    const email = emailRaw || null

    if (!cardId || cardId.length > 120) {
      return NextResponse.json({ error: 'Invalid card.' }, { status: 400 })
    }

    if (!isValidVote(vote)) {
      return NextResponse.json({ error: 'Invalid reaction.' }, { status: 400 })
    }

    if (role != null && !isValidRole(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email.' }, { status: 400 })
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ ok: true })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const payload = {
      id: randomUUID(),
      card_id: cardId,
      vote,
      role: isValidRole(role) ? role : null,
      email,
      page,
      submitted_at: new Date().toISOString(),
      user_agent: req.headers.get('user-agent') || null,
      raw_payload: body,
    }

    const { error: insertError } = await supabase
      .from('feedback_roadmap_reactions')
      .insert([
        {
          card_id: payload.card_id,
          vote: payload.vote,
          role: payload.role,
          email: payload.email,
          page: payload.page,
          submitted_at: payload.submitted_at,
          user_agent: payload.user_agent,
          raw_payload: payload.raw_payload,
        },
      ])

    if (!insertError) {
      return NextResponse.json({ ok: true })
    }

    await supabase.storage.createBucket(REACTIONS_BUCKET, {
      public: false,
      fileSizeLimit: 1024 * 1024,
    }).catch(() => undefined)

    const filePath = `${payload.page}/${payload.card_id}/${payload.id}.json`

    const { error: uploadError } = await supabase.storage
      .from(REACTIONS_BUCKET)
      .upload(filePath, JSON.stringify(payload, null, 2), {
        contentType: 'application/json',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Could not save reaction right now.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Could not save reaction right now.' }, { status: 500 })
  }
}
