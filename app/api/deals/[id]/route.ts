import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type Role = 'brand' | 'creator'
type RouteContext = { params: Promise<{ id: string }> }

type DealRow = {
  id: string
  job_id: string | null
  brand_id: string | null
  creator_id: string | null
  status: string
  budget?: number | null
  amount?: number | null
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function statusRank(status: string) {
  const order = [
    'application_sent',
    'under_review',
    'offered',
    'accepted',
    'in_progress',
    'submitted',
    'reviewed',
    'paid',
    'complete',
  ]
  const idx = order.indexOf(status)
  return idx === -1 ? -1 : idx
}

function canAccessDeal(deal: DealRow, role: Role, brandId: string | null, creatorId: string | null) {
  if (role === 'brand') return !!brandId && deal.brand_id === brandId
  return !!creatorId && deal.creator_id === creatorId
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
  const [{ data: brandRow }, { data: creatorRow }, { data: userRow }] = await Promise.all([
    admin.from('brands').select('id, company_name').eq('user_id', user.id).maybeSingle(),
    admin.from('creators').select('id, display_name').eq('user_id', user.id).maybeSingle(),
    admin.from('users').select('role').eq('id', user.id).maybeSingle(),
  ])

  let role = (user.user_metadata?.role as Role | undefined) || (userRow?.role as Role | undefined)
  if (!role) {
    if (brandRow?.id && !creatorRow?.id) role = 'brand'
    else role = 'creator'
  }

  return {
    admin,
    user,
    role,
    brandId: brandRow?.id || null,
    creatorId: creatorRow?.id || null,
    senderName: role === 'brand' ? (brandRow?.company_name || 'Brand') : (creatorRow?.display_name || 'Creator'),
  }
}

async function insertSystemMessage(admin: any, dealId: string, senderId: string, senderName: string, type: string, text: string) {
  await admin.from('messages').insert({
    deal_id: dealId,
    sender_id: senderId,
    sender_name: senderName,
    content: `[SYSTEM:${type}] ${text}`,
  })
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const auth = await getAuthContext(request)

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { data: deal, error } = await auth.admin
      .from('deals')
      .select('*, jobs(id, title, description), brands(id, company_name), creators(id, display_name, avatar_url)')
      .eq('id', id)
      .single()

    if (error || !deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 })
    }

    if (!canAccessDeal(deal as DealRow, auth.role, auth.brandId, auth.creatorId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let applications: unknown[] = []
    if (auth.role === 'brand' && deal.job_id) {
      const { data: apps } = await auth.admin
        .from('applications')
        .select('id, status, message, proposed_rate, created_at, creator_id, creators(id, display_name, avatar_url, headline)')
        .eq('job_id', deal.job_id)
        .order('created_at', { ascending: true })
      applications = apps || []
    }

    return NextResponse.json({
      role: auth.role,
      deal: {
        ...deal,
        value: deal.budget ?? deal.amount ?? null,
      },
      applications,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not fetch deal.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const auth = await getAuthContext(request)

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { data: deal, error: dealError } = await auth.admin
      .from('deals')
      .select('id, job_id, brand_id, creator_id, status, budget, amount')
      .eq('id', id)
      .single()

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 })
    }

    if (!canAccessDeal(deal as DealRow, auth.role, auth.brandId, auth.creatorId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const action = String(body?.action || '')

    if (action === 'brand_accept_application') {
      if (auth.role !== 'brand') {
        return NextResponse.json({ error: 'Only brands can accept applications.' }, { status: 403 })
      }

      const applicationId = String(body?.applicationId || '')
      if (!applicationId || !deal.job_id) {
        return NextResponse.json({ error: 'Missing application id.' }, { status: 400 })
      }

      const { data: application, error: appError } = await auth.admin
        .from('applications')
        .select('id, creator_id, proposed_rate, creators(display_name)')
        .eq('id', applicationId)
        .eq('job_id', deal.job_id)
        .single()

      if (appError || !application) {
        return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
      }

      const updatePayload: Record<string, unknown> = {
        creator_id: application.creator_id,
        status: 'offered',
      }

      if (application.proposed_rate != null) {
        updatePayload.budget = application.proposed_rate
      }

      const { error: updateDealError } = await auth.admin.from('deals').update(updatePayload).eq('id', id)
      if (updateDealError) {
        return NextResponse.json({ error: updateDealError.message }, { status: 500 })
      }

      await auth.admin.from('applications').update({ status: 'rejected' }).eq('job_id', deal.job_id).neq('id', applicationId)
      await auth.admin.from('applications').update({ status: 'accepted' }).eq('id', applicationId)

      const creatorName = (application.creators as { display_name?: string } | null)?.display_name || 'creator'
      await insertSystemMessage(auth.admin, id, auth.user.id, auth.senderName, 'offer', `Offer extended to ${creatorName}.`)

      return NextResponse.json({ ok: true, status: 'offered' })
    }

    if (action === 'creator_offer_response') {
      if (auth.role !== 'creator') {
        return NextResponse.json({ error: 'Only creators can respond to offers.' }, { status: 403 })
      }

      const response = String(body?.response || '')
      if (!['accept', 'decline'].includes(response)) {
        return NextResponse.json({ error: 'Invalid response.' }, { status: 400 })
      }

      const nextStatus = response === 'accept' ? 'accepted' : 'archived'
      const { error: updateError } = await auth.admin.from('deals').update({ status: nextStatus }).eq('id', id)
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      await insertSystemMessage(
        auth.admin,
        id,
        auth.user.id,
        auth.senderName,
        'offer_response',
        response === 'accept' ? 'Offer accepted.' : 'Offer declined.'
      )

      return NextResponse.json({ ok: true, status: nextStatus })
    }

    if (action === 'add_brief') {
      if (auth.role !== 'brand') {
        return NextResponse.json({ error: 'Only brands can add briefs.' }, { status: 403 })
      }

      const text = String(body?.text || '').trim()
      const assetUrl = String(body?.assetUrl || '').trim()
      if (!text && !assetUrl) {
        return NextResponse.json({ error: 'Add brief text or an asset URL.' }, { status: 400 })
      }

      const payload = [text, assetUrl ? `Asset: ${assetUrl}` : ''].filter(Boolean).join('\n')
      await insertSystemMessage(auth.admin, id, auth.user.id, auth.senderName, 'brief', payload)

      if (statusRank(deal.status) < statusRank('in_progress')) {
        await auth.admin.from('deals').update({ status: 'in_progress' }).eq('id', id)
      }

      return NextResponse.json({ ok: true })
    }

    if (action === 'add_creator_asset') {
      if (auth.role !== 'creator') {
        return NextResponse.json({ error: 'Only creators can add work assets.' }, { status: 403 })
      }

      const text = String(body?.text || '').trim()
      const assetUrl = String(body?.assetUrl || '').trim()
      if (!text && !assetUrl) {
        return NextResponse.json({ error: 'Add details or an asset URL.' }, { status: 400 })
      }

      const payload = [text, assetUrl ? `Asset: ${assetUrl}` : ''].filter(Boolean).join('\n')
      await insertSystemMessage(auth.admin, id, auth.user.id, auth.senderName, 'asset', payload)

      if (statusRank(deal.status) < statusRank('in_progress')) {
        await auth.admin.from('deals').update({ status: 'in_progress' }).eq('id', id)
      }

      return NextResponse.json({ ok: true })
    }

    if (action === 'mark_submitted') {
      if (auth.role !== 'creator') {
        return NextResponse.json({ error: 'Only creators can submit work.' }, { status: 403 })
      }

      const submissionUrl = String(body?.submissionUrl || '').trim() || null
      const submissionNotes = String(body?.submissionNotes || '').trim() || null

      const { error: updateError } = await auth.admin
        .from('deals')
        .update({ status: 'submitted', submitted_url: submissionUrl, submitted_notes: submissionNotes })
        .eq('id', id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      await insertSystemMessage(
        auth.admin,
        id,
        auth.user.id,
        auth.senderName,
        'submission',
        [submissionUrl ? `Submitted: ${submissionUrl}` : '', submissionNotes || 'Work submitted.'].filter(Boolean).join('\n')
      )

      return NextResponse.json({ ok: true, status: 'submitted' })
    }

    if (action === 'mark_reviewed') {
      if (auth.role !== 'brand') {
        return NextResponse.json({ error: 'Only brands can review submissions.' }, { status: 403 })
      }

      const { error: updateError } = await auth.admin.from('deals').update({ status: 'reviewed' }).eq('id', id)
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      await insertSystemMessage(auth.admin, id, auth.user.id, auth.senderName, 'review', 'Submission reviewed and approved.')
      return NextResponse.json({ ok: true, status: 'reviewed' })
    }

    if (action === 'mark_paid') {
      if (auth.role !== 'brand') {
        return NextResponse.json({ error: 'Only brands can mark deals paid.' }, { status: 403 })
      }

      const { error: updateError } = await auth.admin.from('deals').update({ status: 'paid' }).eq('id', id)
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      await insertSystemMessage(auth.admin, id, auth.user.id, auth.senderName, 'payment', 'Payment marked as sent.')
      return NextResponse.json({ ok: true, status: 'paid' })
    }

    if (action === 'mark_complete') {
      if (auth.role !== 'brand') {
        return NextResponse.json({ error: 'Only brands can close deals.' }, { status: 403 })
      }

      const { error: updateError } = await auth.admin.from('deals').update({ status: 'complete' }).eq('id', id)
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      await insertSystemMessage(auth.admin, id, auth.user.id, auth.senderName, 'complete', 'Deal marked complete.')
      return NextResponse.json({ ok: true, status: 'complete' })
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update deal.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
