import { NextRequest, NextResponse } from 'next/server'
import { getEdAuthContext } from '@/lib/ed-server'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await context.params

  const { data, error } = await auth.admin
    .from('campaign_team')
    .select('id, campaign_id, user_id, name, role, added_at')
    .eq('campaign_id', id)
    .order('added_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ team: data || [] })
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await context.params
  const body = await request.json().catch(() => null)

  const userIdRaw = body?.user_id
  const userId = typeof userIdRaw === 'string' ? userIdRaw.trim() : null
  const name = String(body?.name || '').trim()
  const role = String(body?.role || '').trim()

  if (!name || !role) {
    return NextResponse.json({ error: 'name and role are required.' }, { status: 400 })
  }

  const { data, error } = await auth.admin
    .from('campaign_team')
    .insert({
      campaign_id: id,
      user_id: userId || null,
      name,
      role,
    })
    .select('id, campaign_id, user_id, name, role, added_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ team_member: data }, { status: 201 })
}
