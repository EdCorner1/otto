import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type Role = 'creator' | 'brand'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const FEEDBACK_BUCKET = 'roadmap-feedback'

function isValidRole(value: unknown): value is Role {
  return value === 'creator' || value === 'brand'
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function sanitizeText(value: unknown) {
  return String(value || '').trim()
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)

    const idea = sanitizeText(body?.idea)
    const role = body?.role
    const page = sanitizeText(body?.page) || 'unknown'
    const emailRaw = sanitizeText(body?.email).toLowerCase()
    const email = emailRaw || null

    if (!idea || idea.length < 6) {
      return NextResponse.json({ error: 'Please add a little more detail.' }, { status: 400 })
    }

    if (idea.length > 1000) {
      return NextResponse.json({ error: 'Please keep ideas under 1000 characters.' }, { status: 400 })
    }

    if (role != null && !isValidRole(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Feedback storage is not configured yet.' }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const payload = {
      id: randomUUID(),
      idea,
      role: isValidRole(role) ? role : null,
      email,
      page,
      submitted_at: new Date().toISOString(),
      user_agent: req.headers.get('user-agent') || null,
      raw_payload: body,
    }

    const { error: insertError } = await supabase
      .from('feedback_ideas')
      .insert([
        {
          idea: payload.idea,
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

    await supabase.storage.createBucket(FEEDBACK_BUCKET, {
      public: false,
      fileSizeLimit: 1024 * 1024,
    }).catch(() => undefined)

    const filePath = `${payload.page}/${payload.id}.json`

    const { error: uploadError } = await supabase.storage
      .from(FEEDBACK_BUCKET)
      .upload(filePath, JSON.stringify(payload, null, 2), {
        contentType: 'application/json',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Could not save your idea right now.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Could not save your idea right now.' }, { status: 500 })
  }
}
