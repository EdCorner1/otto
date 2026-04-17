import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/server/notifications'

export const runtime = 'nodejs'

type ApplicationPayload = {
  jobId?: string
  portfolioLinks?: string[]
  pitchMessage?: string
  proposedRate?: number | null
  availabilityDate?: string | null
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function normalizeLinks(input: unknown) {
  if (!Array.isArray(input)) return []
  return input
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, 8)
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    if (!token) {
      return NextResponse.json({ error: 'Missing auth token.' }, { status: 401 })
    }

    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

    const authClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: authData, error: authError } = await authClient.auth.getUser(token)

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
    }

    const user = authData.user
    const body = (await request.json()) as ApplicationPayload

    const jobId = body.jobId?.trim()
    const pitchMessage = body.pitchMessage?.trim()
    const portfolioLinks = normalizeLinks(body.portfolioLinks)
    const proposedRate = typeof body.proposedRate === 'number' && Number.isFinite(body.proposedRate)
      ? body.proposedRate
      : null
    const availabilityDate = typeof body.availabilityDate === 'string' && body.availabilityDate.trim()
      ? body.availabilityDate.trim()
      : null

    if (!jobId) {
      return NextResponse.json({ error: 'Missing job id.' }, { status: 400 })
    }

    if (!pitchMessage) {
      return NextResponse.json({ error: 'Pitch message is required.' }, { status: 400 })
    }

    if (portfolioLinks.length === 0) {
      return NextResponse.json({ error: 'Add at least one portfolio link.' }, { status: 400 })
    }

    const { data: creatorData } = await adminClient.from('creators').select('id').eq('user_id', user.id).single()

    if (!creatorData?.id) {
      return NextResponse.json({ error: 'Complete creator onboarding before applying.' }, { status: 403 })
    }

    const { data: existing } = await adminClient
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('creator_id', creatorData.id)
      .maybeSingle()

    if (existing?.id) {
      return NextResponse.json({ error: 'You already applied to this brief.' }, { status: 409 })
    }

    const { data: jobData } = await adminClient
      .from('jobs')
      .select('id, status, title, brand_id')
      .eq('id', jobId)
      .eq('status', 'open')
      .maybeSingle()

    if (!jobData?.id) {
      return NextResponse.json({ error: 'This brief is no longer open.' }, { status: 400 })
    }

    const enrichedMessage = [
      pitchMessage,
      '',
      'Portfolio links:',
      ...portfolioLinks.map((link) => `- ${link}`),
      availabilityDate ? `Availability date: ${availabilityDate}` : 'Availability date: Flexible',
    ].join('\n')

    const { data: inserted, error: insertError } = await adminClient
      .from('applications')
      .insert({
        job_id: jobId,
        creator_id: creatorData.id,
        message: enrichedMessage,
        proposed_rate: proposedRate,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'You already applied to this brief.' }, { status: 409 })
      }
      throw new Error(insertError.message)
    }

    const [{ data: brandRow }, { data: creatorRow }] = await Promise.all([
      adminClient.from('brands').select('user_id').eq('id', jobData.brand_id).maybeSingle(),
      adminClient.from('creators').select('display_name').eq('id', creatorData.id).maybeSingle(),
    ])

    if (brandRow?.user_id) {
      await createNotification(adminClient, {
        userId: brandRow.user_id,
        type: 'new_application',
        content: `${creatorRow?.display_name || 'A creator'} applied to ${jobData.title ? `"${jobData.title}"` : 'your brief'}.`,
        linkUrl: `/jobs/${jobId}/manage`,
      })
    }

    return NextResponse.json({ ok: true, id: inserted.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not submit application.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
