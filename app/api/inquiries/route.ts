import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing ${name}`)
  return v
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { creatorId, brandName, brandEmail, brandCompany, budget, timeline, message } = body

    if (!creatorId || !brandEmail || !isValidEmail(brandEmail)) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
    const admin = createClient(url, serviceKey)

    const { data: creator, error: creatorError } = await admin
      .from('creators')
      .select('id, user_id, display_name')
      .eq('id', creatorId)
      .maybeSingle()

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found.' }, { status: 404 })
    }

    const { data: inquiry, error: insertError } = await admin
      .from('inquiries')
      .insert({
        creator_id: creatorId,
        brand_name: String(brandName || '').trim(),
        brand_email: brandEmail.trim().toLowerCase(),
        brand_company: String(brandCompany || '').trim(),
        budget: String(budget || '').trim(),
        timeline: String(timeline || '').trim(),
        message: String(message || '').trim().slice(0, 1000),
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('inquiry insert error:', insertError)
      return NextResponse.json({ error: 'Could not submit inquiry.' }, { status: 500 })
    }

    const notifContent = `New inquiry from ${brandName || brandEmail}${brandCompany ? ` at ${brandCompany}` : ''}.`
    await admin.from('notifications').insert({
      user_id: creator.user_id,
      type: 'new_inquiry',
      content: notifContent,
      link_url: '/inquiries',
      read: false,
    })

    return NextResponse.json({ ok: true, inquiry }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

    const authClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const admin = createClient(url, serviceKey)

    const { data: authData, error: authError } = await authClient.auth.getUser(token)
    if (authError || !authData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: creator } = await admin
      .from('creators')
      .select('id')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (!creator) return NextResponse.json({ error: 'Not a creator.' }, { status: 403 })

    const { data: inquiries, error: fetchError } = await admin
      .from('inquiries')
      .select('*')
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: false })

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

    return NextResponse.json({ inquiries })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
