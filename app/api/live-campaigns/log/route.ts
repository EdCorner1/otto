import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  computeLiveCampaignStats,
  dateKey,
  normalizeLogStatus,
  normalizePlatform,
  parseLiveCampaignMetadata,
  serializeLiveCampaignMetadata,
  sortLogsDesc,
} from '@/lib/live-campaigns'

export const runtime = 'nodejs'

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

async function getAuthContext(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return { error: 'Missing auth token.', status: 401 as const }

  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

  const authClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: authData, error: authError } = await authClient.auth.getUser(token)
  if (authError || !authData.user) {
    return { error: 'Not authenticated.', status: 401 as const }
  }

  const user = authData.user
  const { data: creatorRow } = await admin
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  return {
    admin,
    creatorId: creatorRow?.id || null,
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json().catch(() => null)
    const dealId = typeof body?.deal_id === 'string' ? body.deal_id.trim() : ''
    const platform = normalizePlatform(body?.platform)
    const videoUrl = typeof body?.video_url === 'string' ? body.video_url.trim() : ''
    const views = Number(body?.views || 0)
    const date = typeof body?.date === 'string' && body.date ? body.date : dateKey(new Date())
    const status = normalizeLogStatus(body?.status)
    const notes = {
      hook: typeof body?.notes?.hook === 'string' ? body.notes.hook.trim() : '',
      concept: typeof body?.notes?.concept === 'string' ? body.notes.concept.trim() : '',
      context: typeof body?.notes?.context === 'string' ? body.notes.context.trim() : '',
    }

    if (!dealId || !platform || !Number.isFinite(views) || (!videoUrl && !notes.hook && !notes.concept && !notes.context)) {
      return NextResponse.json({ error: 'deal_id, platform, date, a valid status, and either video_url or notes are required.' }, { status: 400 })
    }

    const { data: deal, error: dealError } = await auth.admin
      .from('deals')
      .select('id, creator_id, submitted_notes')
      .eq('id', dealId)
      .maybeSingle()

    if (dealError) {
      return NextResponse.json({ error: dealError.message }, { status: 500 })
    }

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 })
    }

    if (auth.creatorId && deal.creator_id !== auth.creatorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const metadata = parseLiveCampaignMetadata(deal.submitted_notes)
    if (!metadata) {
      return NextResponse.json({ error: 'This deal is not configured as a live campaign.' }, { status: 400 })
    }

    const nextLog = {
      id: crypto.randomUUID(),
      platform,
      video_url: videoUrl,
      views: Math.max(0, Math.round(views)),
      date,
      created_at: new Date().toISOString(),
      status,
      notes,
    }

    const nextMetadata = {
      ...metadata,
      logs: sortLogsDesc([...metadata.logs, nextLog]),
    }

    const { error: updateError } = await auth.admin
      .from('deals')
      .update({ submitted_notes: serializeLiveCampaignMetadata(nextMetadata) })
      .eq('id', deal.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      log: nextLog,
      stats: computeLiveCampaignStats(nextMetadata),
      logs: nextMetadata.logs,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not log campaign content.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
