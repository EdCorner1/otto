import { NextRequest, NextResponse } from 'next/server'
import { getEdAuthContext, parsePlatforms, parseStatus } from '@/lib/ed-server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')?.trim()

  let query = auth.admin
    .from('campaigns')
    .select('id, client_id, name, start_date, end_date, status, platforms, notes, created_at, clients(id, name, brand_color)')
    .order('created_at', { ascending: false })

  if (clientId) {
    query = query.eq('client_id', clientId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ campaigns: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json().catch(() => null)

  const clientId = String(body?.client_id || '').trim()
  const name = String(body?.name || '').trim()
  const startDate = String(body?.start_date || '').trim()
  const endDate = String(body?.end_date || '').trim()
  const notes = String(body?.notes || '').trim()
  const status = parseStatus(body?.status)
  const platforms = parsePlatforms(body?.platforms)

  if (!clientId || !name || !startDate || !status) {
    return NextResponse.json({ error: 'client_id, name, start_date, and valid status are required.' }, { status: 400 })
  }

  const { data, error } = await auth.admin
    .from('campaigns')
    .insert({
      client_id: clientId,
      name,
      start_date: startDate,
      end_date: endDate || null,
      status,
      platforms,
      notes: notes || null,
    })
    .select('id, client_id, name, start_date, end_date, status, platforms, notes, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ campaign: data }, { status: 201 })
}
