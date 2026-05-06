import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing ${name}`)
  return v
}

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

    const authClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const admin = createClient(url, serviceKey)

    const { data: authData } = await authClient.auth.getUser(token)
    if (!authData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: creator } = await admin.from('creators').select('id').eq('user_id', authData.user.id).maybeSingle()
    if (!creator) return NextResponse.json({ error: 'Not a creator.' }, { status: 403 })

    const { data: inquiry } = await admin
      .from('inquiries')
      .select('*')
      .eq('id', id)
      .eq('creator_id', creator.id)
      .single()

    if (!inquiry) return NextResponse.json({ error: 'Inquiry not found.' }, { status: 404 })

    return NextResponse.json({ inquiry })
  } catch (err) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

    const authClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const admin = createClient(url, serviceKey)

    const { data: authData } = await authClient.auth.getUser(token)
    if (!authData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: creator } = await admin.from('creators').select('id, display_name, user_id').eq('user_id', authData.user.id).maybeSingle()
    if (!creator) return NextResponse.json({ error: 'Not a creator.' }, { status: 403 })

    const { data: inquiry } = await admin
      .from('inquiries')
      .select('*')
      .eq('id', id)
      .eq('creator_id', creator.id)
      .single()

    if (!inquiry) return NextResponse.json({ error: 'Inquiry not found.' }, { status: 404 })

    const body = await request.json()
    const action = String(body.action || '')

    if (action === 'reply') {
      let dealId = inquiry.deal_id

      if (!dealId) {
        const { data: brand } = await admin
          .from('brands')
          .select('id, user_id')
          .eq('email', inquiry.brand_email)
          .maybeSingle()

        let brandId = brand?.id
        if (!brandId) {
          const { data: upserted } = await admin
            .from('brands')
            .upsert({
              company_name: inquiry.brand_company || inquiry.brand_name || inquiry.brand_email,
              email: inquiry.brand_email,
              user_id: null,
            }, { onConflict: 'email' })
            .select('id')
            .single()
          brandId = upserted?.id
        }

        if (!brandId) {
          return NextResponse.json({ error: 'Could not find or create brand.' }, { status: 500 })
        }

        const { data: newDeal } = await admin
          .from('deals')
          .insert({
            brand_id: brandId,
            creator_id: creator.id,
            status: 'application_sent',
            title: `Inquiry: ${inquiry.brand_company || inquiry.brand_name || 'Brand'}`,
            budget: inquiry.budget ? parseFloat(inquiry.budget.replace(/[^0-9.]/g, '')) || null : null,
          })
          .select('id')
          .single()

        dealId = newDeal?.id

        if (dealId) {
          await admin.from('inquiries').update({ deal_id: dealId }).eq('id', id)
        }
      }

      if (!dealId) {
        return NextResponse.json({ error: 'Could not create deal thread.' }, { status: 500 })
      }

      const replyMessage = String(body.message || inquiry.message || '').trim()
      await admin.from('messages').insert({
        deal_id: dealId,
        sender_id: authData.user.id,
        content: replyMessage,
      })

      await admin.from('inquiries').update({ status: 'replied' }).eq('id', id)

      const { data: brand } = await admin.from('brands').select('user_id').eq('email', inquiry.brand_email).maybeSingle()
      if (brand?.user_id) {
        await admin.from('notifications').insert({
          user_id: brand.user_id,
          type: 'new_message',
          content: `${creator.display_name} replied to your inquiry.`,
          link_url: `/messages/${dealId}`,
          read: false,
        })
      }

      return NextResponse.json({ ok: true, dealId })
    }

    if (action === 'decline') {
      await admin.from('inquiries').update({ status: 'declined' }).eq('id', id)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
