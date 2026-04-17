import { NextRequest, NextResponse } from 'next/server'
import { getEdAuthContext } from '@/lib/ed-server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data, error } = await auth.admin
    .from('clients')
    .select('id, name, brand_color, logo_url, created_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ clients: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json().catch(() => null)
  const name = String(body?.name || '').trim()
  const brandColor = String(body?.brand_color || '#ccff00').trim()
  const logoUrlRaw = String(body?.logo_url || '').trim()

  if (!name) {
    return NextResponse.json({ error: 'Client name is required.' }, { status: 400 })
  }

  const { data, error } = await auth.admin
    .from('clients')
    .insert({
      name,
      brand_color: brandColor,
      logo_url: logoUrlRaw || null,
    })
    .select('id, name, brand_color, logo_url, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ client: data }, { status: 201 })
}
