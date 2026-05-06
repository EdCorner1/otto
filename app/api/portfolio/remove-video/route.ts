import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PORTFOLIO_VIDEO_BUCKET, extractSupabasePublicPath } from '@/lib/portfolio-media'

export const runtime = 'nodejs'

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

async function getAuthUserIdFromToken(token: string) {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const authClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    if (!token) return NextResponse.json({ error: 'Missing auth token.' }, { status: 401 })

    const requesterId = await getAuthUserIdFromToken(token)
    if (!requesterId) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const body = (await request.json()) as { creatorId?: string; videoUrl?: string }
    const creatorId = String(body.creatorId || '').trim()
    const videoUrl = String(body.videoUrl || '').trim()

    if (!creatorId || !videoUrl) {
      return NextResponse.json({ error: 'Creator ID and video URL are required.' }, { status: 400 })
    }

    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: creator, error: creatorError } = await admin
      .from('creators')
      .select('id, user_id')
      .eq('id', creatorId)
      .single()

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found.' }, { status: 404 })
    }

    if (creator.user_id !== requesterId) {
      return NextResponse.json({ error: 'You can only remove videos from your own profile.' }, { status: 403 })
    }

    const filePath = extractSupabasePublicPath(videoUrl, PORTFOLIO_VIDEO_BUCKET)
    if (!filePath) {
      return NextResponse.json({ ok: true, removed: false })
    }

    const { error: removeError } = await admin.storage.from(PORTFOLIO_VIDEO_BUCKET).remove([filePath])
    if (removeError && !removeError.message.toLowerCase().includes('not found')) {
      return NextResponse.json({ error: removeError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, removed: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not remove video.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
