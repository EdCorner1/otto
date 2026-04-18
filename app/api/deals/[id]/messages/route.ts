import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/server/notifications'

export const runtime = 'nodejs'

type Role = 'brand' | 'creator'
type RouteContext = { params: Promise<{ id: string }> }

type DealRow = {
  id: string
  brand_id: string | null
  creator_id: string | null
  jobs?: { title?: string | null } | Array<{ title?: string | null }> | null
}

type RawMessageRow = {
  id: string
  sender_id: string
  content: string
  created_at: string
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
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
    admin.from('users').select('role, email').eq('id', user.id).maybeSingle(),
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
    senderName:
      role === 'brand'
        ? (brandRow?.company_name || userRow?.email?.split('@')[0] || 'Brand')
        : (creatorRow?.display_name || userRow?.email?.split('@')[0] || 'Creator'),
  }
}

async function resolveSenderNames(admin: any, messages: RawMessageRow[]) {
  const senderIds = Array.from(new Set(messages.map((message) => message.sender_id).filter(Boolean)))
  if (!senderIds.length) return []

  const [{ data: users }, { data: brands }, { data: creators }] = await Promise.all([
    admin.from('users').select('id, email').in('id', senderIds),
    admin.from('brands').select('user_id, company_name').in('user_id', senderIds),
    admin.from('creators').select('user_id, display_name').in('user_id', senderIds),
  ])

  const userNames = new Map<string, string>()

  for (const row of users || []) {
    if (row?.id) {
      userNames.set(row.id, row.email?.split('@')[0] || 'User')
    }
  }

  for (const row of brands || []) {
    if (row?.user_id && row.company_name) {
      userNames.set(row.user_id, row.company_name)
    }
  }

  for (const row of creators || []) {
    if (row?.user_id && row.display_name) {
      userNames.set(row.user_id, row.display_name)
    }
  }

  return messages.map((message) => ({
    ...message,
    sender_name: userNames.get(message.sender_id) || 'User',
  }))
}

function getJobTitle(deal: DealRow) {
  if (Array.isArray(deal.jobs)) return deal.jobs[0]?.title || null
  return deal.jobs?.title || null
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const auth = await getAuthContext(request)

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { data: deal, error: dealError } = await auth.admin
      .from('deals')
      .select('id, brand_id, creator_id')
      .eq('id', id)
      .single()

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 })
    }

    if (!canAccessDeal(deal as DealRow, auth.role, auth.brandId, auth.creatorId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: messages, error } = await auth.admin
      .from('messages')
      .select('id, sender_id, content, created_at')
      .eq('deal_id', id)
      .order('created_at', { ascending: true })
      .limit(300)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const hydratedMessages = await resolveSenderNames(auth.admin, (messages || []) as RawMessageRow[])
    return NextResponse.json({ messages: hydratedMessages })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not fetch messages.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const auth = await getAuthContext(request)

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { data: deal, error: dealError } = await auth.admin
      .from('deals')
      .select('id, brand_id, creator_id, jobs(title)')
      .eq('id', id)
      .single()

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 })
    }

    if (!canAccessDeal(deal as DealRow, auth.role, auth.brandId, auth.creatorId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const content = String(body?.content || '').trim()

    if (!content) {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 })
    }

    if (content.length > 4000) {
      return NextResponse.json({ error: 'Message is too long.' }, { status: 400 })
    }

    const { data: inserted, error } = await auth.admin
      .from('messages')
      .insert({
        deal_id: id,
        sender_id: auth.user.id,
        content,
      })
      .select('id, sender_id, content, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const message = {
      ...(inserted as RawMessageRow),
      sender_name: auth.senderName,
    }

    const recipientProfileId = auth.role === 'brand' ? deal.creator_id : deal.brand_id
    const recipientTable = auth.role === 'brand' ? 'creators' : 'brands'

    if (recipientProfileId) {
      const { data: recipientRow } = await auth.admin
        .from(recipientTable)
        .select('user_id')
        .eq('id', recipientProfileId)
        .maybeSingle()

      if (recipientRow?.user_id) {
        const title = getJobTitle(deal as DealRow)
        await createNotification(auth.admin, {
          userId: recipientRow.user_id,
          type: 'new_message',
          content: `${auth.senderName}: ${content.slice(0, 120)}${content.length > 120 ? '…' : ''}${title ? ` (${title})` : ''}`,
          linkUrl: `/deals/${id}`,
        })
      }
    }

    return NextResponse.json({ message })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not send message.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
