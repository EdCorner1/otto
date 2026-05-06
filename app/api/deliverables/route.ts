import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/server/notifications'

export const runtime = 'nodejs'

type Role = 'brand' | 'creator'
type DeliverableStatus = 'submitted' | 'approved' | 'revision_requested'

type DealRow = {
  id: string
  brand_id: string | null
  creator_id: string | null
  status?: string | null
}

type DeliverableRow = {
  id: string
  deal_id: string
  creator_id: string
  title: string
  drive_link: string
  notes: string | null
  status: DeliverableStatus
  created_at: string
}

type Deliverable = {
  id: string
  deal_id: string
  creator_id: string
  title: string
  drive_link: string
  notes: string | null
  status: DeliverableStatus
  submitted_at: string
  created_at: string
}

type DeliverableEventPayload = {
  id: string
  deal_id: string
  creator_id: string
  title: string
  drive_link: string
  notes: string | null
  status: DeliverableStatus
  submitted_at: string
}

type DeliverableReviewPayload = {
  deliverable_id: string
  status: DeliverableStatus
  reviewed_at: string
}

type AdminClient = SupabaseClient

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function canAccessDeal(deal: DealRow, role: Role, brandId: string | null, creatorId: string | null) {
  if (role === 'brand') return !!brandId && deal.brand_id === brandId
  return !!creatorId && deal.creator_id === creatorId
}

function isDeliverableStatus(value: string): value is DeliverableStatus {
  return value === 'submitted' || value === 'approved' || value === 'revision_requested'
}

function parseSystemEvent<T>(content: string, type: string): T | null {
  const match = content.match(/^\[SYSTEM:([^\]]+)\]\s*/)
  if (!match || match[1]?.trim() !== type) return null

  const raw = content.replace(/^\[SYSTEM:[^\]]+\]\s*/, '').trim()
  if (!raw) return null

  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function normalizeTableDeliverable(row: DeliverableRow): Deliverable {
  return {
    id: row.id,
    deal_id: row.deal_id,
    creator_id: row.creator_id,
    title: row.title,
    drive_link: row.drive_link,
    notes: row.notes,
    status: row.status,
    submitted_at: row.created_at,
    created_at: row.created_at,
  }
}

function deriveDeliverablesFromMessages(
  messages: Array<{ id: string; content: string; created_at: string }>,
): Deliverable[] {
  const deliverables = new Map<string, Deliverable>()

  for (const message of messages) {
    const submission = parseSystemEvent<DeliverableEventPayload>(message.content, 'deliverable')
    if (submission && isDeliverableStatus(submission.status)) {
      deliverables.set(submission.id, {
        id: submission.id,
        deal_id: submission.deal_id,
        creator_id: submission.creator_id,
        title: submission.title,
        drive_link: submission.drive_link,
        notes: submission.notes ?? null,
        status: submission.status,
        submitted_at: submission.submitted_at || message.created_at,
        created_at: message.created_at,
      })
      continue
    }

    const review = parseSystemEvent<DeliverableReviewPayload>(message.content, 'deliverable_review')
    if (review && isDeliverableStatus(review.status)) {
      const existing = deliverables.get(review.deliverable_id)
      if (existing) {
        deliverables.set(review.deliverable_id, {
          ...existing,
          status: review.status,
        })
      }
    }
  }

  return [...deliverables.values()].sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
  )
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
    admin.from('brands').select('id, company_name, user_id').eq('user_id', user.id).maybeSingle(),
    admin.from('creators').select('id, display_name, user_id').eq('user_id', user.id).maybeSingle(),
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

async function getDealOrError(admin: AdminClient, dealId: string) {
  const { data: deal, error } = await admin
    .from('deals')
    .select('id, brand_id, creator_id, status')
    .eq('id', dealId)
    .single()

  if (error || !deal) {
    return { error: 'Deal not found.', status: 404 as const }
  }

  return { deal: deal as DealRow }
}

async function hasDeliverablesTable(admin: AdminClient) {
  const { error } = await admin.from('deliverables').select('id').limit(1)
  if (!error) return true
  if (error.code === 'PGRST205' || /Could not find the table/i.test(error.message)) return false
  throw new Error(error.message)
}

async function fetchDeliverablesForDeal(admin: AdminClient, dealId: string) {
  if (await hasDeliverablesTable(admin)) {
    const { data, error } = await admin
      .from('deliverables')
      .select('id, deal_id, creator_id, title, drive_link, notes, status, created_at')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return {
      storage: 'table' as const,
      deliverables: ((data || []) as DeliverableRow[]).map(normalizeTableDeliverable),
    }
  }

  const { data, error } = await admin
    .from('messages')
    .select('id, content, created_at')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: true })
    .limit(500)

  if (error) throw new Error(error.message)

  return {
    storage: 'messages_fallback' as const,
    deliverables: deriveDeliverablesFromMessages(data || []),
  }
}

async function insertSystemMessage(admin: AdminClient, dealId: string, senderId: string, senderName: string, type: string, payload: unknown) {
  await admin.from('messages').insert({
    deal_id: dealId,
    sender_id: senderId,
    content: `[SYSTEM:${type}] ${JSON.stringify(payload)}`,
  })
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const dealId = request.nextUrl.searchParams.get('deal_id')?.trim() || ''
    if (!dealId) {
      return NextResponse.json({ error: 'deal_id is required.' }, { status: 400 })
    }

    const dealResult = await getDealOrError(auth.admin, dealId)
    if ('error' in dealResult) {
      return NextResponse.json({ error: dealResult.error }, { status: dealResult.status })
    }

    if (!canAccessDeal(dealResult.deal, auth.role, auth.brandId, auth.creatorId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await fetchDeliverablesForDeal(auth.admin, dealId)

    return NextResponse.json({
      deal_id: dealId,
      storage: result.storage,
      deliverables: result.deliverables,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not fetch deliverables.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    if (auth.role !== 'creator' || !auth.creatorId) {
      return NextResponse.json({ error: 'Only creators can submit deliverables.' }, { status: 403 })
    }

    const body = await request.json()
    const dealId = String(body?.deal_id || '').trim()
    const creatorId = String(body?.creator_id || '').trim()
    const driveLink = String(body?.drive_link || '').trim()
    const rawTitle = String(body?.title || '').trim()
    const title = rawTitle || 'Video deliverable'
    const notes = String(body?.notes || '').trim() || null
    const submittedAt = String(body?.submitted_at || '').trim() || new Date().toISOString()

    if (!dealId || !creatorId || !driveLink) {
      return NextResponse.json({ error: 'deal_id, creator_id, and drive_link are required.' }, { status: 400 })
    }

    if (creatorId !== auth.creatorId) {
      return NextResponse.json({ error: 'creator_id does not match the authenticated creator.' }, { status: 403 })
    }

    try {
      new URL(driveLink)
    } catch {
      return NextResponse.json({ error: 'drive_link must be a valid URL.' }, { status: 400 })
    }

    const dealResult = await getDealOrError(auth.admin, dealId)
    if ('error' in dealResult) {
      return NextResponse.json({ error: dealResult.error }, { status: dealResult.status })
    }

    const deal = dealResult.deal
    if (!canAccessDeal(deal, auth.role, auth.brandId, auth.creatorId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let deliverable: Deliverable
    let storage: 'table' | 'messages_fallback'

    if (await hasDeliverablesTable(auth.admin)) {
      const { data, error } = await auth.admin
        .from('deliverables')
        .insert({
          deal_id: dealId,
          creator_id: creatorId,
          title,
          drive_link: driveLink,
          notes,
          status: 'submitted',
          created_at: submittedAt,
        })
        .select('id, deal_id, creator_id, title, drive_link, notes, status, created_at')
        .single()

      if (error || !data) {
        return NextResponse.json({ error: error?.message || 'Could not save deliverable.' }, { status: 500 })
      }

      deliverable = normalizeTableDeliverable(data as DeliverableRow)
      storage = 'table'
    } else {
      const generatedId = crypto.randomUUID()
      deliverable = {
        id: generatedId,
        deal_id: dealId,
        creator_id: creatorId,
        title,
        drive_link: driveLink,
        notes,
        status: 'submitted',
        submitted_at: submittedAt,
        created_at: new Date().toISOString(),
      }

      await insertSystemMessage(auth.admin, dealId, auth.user.id, auth.senderName, 'deliverable', {
        id: generatedId,
        deal_id: dealId,
        creator_id: creatorId,
        title,
        drive_link: driveLink,
        notes,
        status: 'submitted',
        submitted_at: submittedAt,
      } satisfies DeliverableEventPayload)

      storage = 'messages_fallback'
    }

    await auth.admin
      .from('deals')
      .update({ status: 'submitted', submitted_url: driveLink, submitted_notes: notes })
      .eq('id', dealId)

    if (deal.brand_id) {
      const { data: brandRow } = await auth.admin.from('brands').select('user_id').eq('id', deal.brand_id).maybeSingle()
      if (brandRow?.user_id) {
        await createNotification(auth.admin, {
          userId: brandRow.user_id,
          type: 'review_requested',
          content: `${auth.senderName} submitted a new deliverable: ${title}.`,
          linkUrl: `/deals/${dealId}`,
        })
      }
    }

    return NextResponse.json({ deliverable, storage }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save deliverable.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    if (auth.role !== 'brand' || !auth.brandId) {
      return NextResponse.json({ error: 'Only brands can review deliverables.' }, { status: 403 })
    }

    const body = await request.json()
    const dealId = String(body?.deal_id || '').trim()
    const deliverableId = String(body?.deliverable_id || '').trim()
    const nextStatus = String(body?.status || '').trim()

    if (!dealId || !deliverableId || !isDeliverableStatus(nextStatus) || nextStatus === 'submitted') {
      return NextResponse.json({ error: 'deal_id, deliverable_id, and a valid review status are required.' }, { status: 400 })
    }

    const dealResult = await getDealOrError(auth.admin, dealId)
    if ('error' in dealResult) {
      return NextResponse.json({ error: dealResult.error }, { status: dealResult.status })
    }

    const deal = dealResult.deal
    if (!canAccessDeal(deal, auth.role, auth.brandId, auth.creatorId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let reviewedDeliverable: Deliverable | null = null
    let storage: 'table' | 'messages_fallback'

    if (await hasDeliverablesTable(auth.admin)) {
      const { data, error } = await auth.admin
        .from('deliverables')
        .update({ status: nextStatus })
        .eq('id', deliverableId)
        .eq('deal_id', dealId)
        .select('id, deal_id, creator_id, title, drive_link, notes, status, created_at')
        .single()

      if (error || !data) {
        return NextResponse.json({ error: error?.message || 'Deliverable not found.' }, { status: 404 })
      }

      reviewedDeliverable = normalizeTableDeliverable(data as DeliverableRow)
      storage = 'table'
    } else {
      const allDeliverables = await fetchDeliverablesForDeal(auth.admin, dealId)
      const existing = allDeliverables.deliverables.find((item) => item.id === deliverableId)
      if (!existing) {
        return NextResponse.json({ error: 'Deliverable not found.' }, { status: 404 })
      }

      await insertSystemMessage(auth.admin, dealId, auth.user.id, auth.senderName, 'deliverable_review', {
        deliverable_id: deliverableId,
        status: nextStatus,
        reviewed_at: new Date().toISOString(),
      } satisfies DeliverableReviewPayload)

      reviewedDeliverable = { ...existing, status: nextStatus }
      storage = 'messages_fallback'
    }

    const refreshed = await fetchDeliverablesForDeal(auth.admin, dealId)
    const allApproved = refreshed.deliverables.length > 0 && refreshed.deliverables.every((item) => item.status === 'approved')

    if (nextStatus === 'revision_requested') {
      await auth.admin.from('deals').update({ status: 'in_progress' }).eq('id', dealId)
    } else if (allApproved) {
      await auth.admin.from('deals').update({ status: 'reviewed' }).eq('id', dealId)
    }

    if (deal.creator_id) {
      const { data: creatorRow } = await auth.admin.from('creators').select('user_id').eq('id', deal.creator_id).maybeSingle()
      if (creatorRow?.user_id) {
        await createNotification(auth.admin, {
          userId: creatorRow.user_id,
          type: 'deal_update',
          content:
            nextStatus === 'approved'
              ? `${auth.senderName} approved deliverable "${reviewedDeliverable?.title || 'Video deliverable'}".`
              : `${auth.senderName} requested a revision for "${reviewedDeliverable?.title || 'Video deliverable'}".`,
          linkUrl: `/deals/${dealId}`,
        })
      }
    }

    return NextResponse.json({
      deliverable: reviewedDeliverable,
      deal_status: nextStatus === 'revision_requested' ? 'in_progress' : allApproved ? 'reviewed' : deal.status,
      storage,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not review deliverable.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
