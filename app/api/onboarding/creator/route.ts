import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MAX_PORTFOLIO_VIDEOS, MIN_PORTFOLIO_VIDEOS } from '@/lib/portfolio-media'

export const runtime = 'nodejs'

type PortfolioItemInput = {
  type: 'video' | 'image'
  url: string
  caption?: string | null
  category?: string | null
}

type CreatorPayload = {
  display_name: string
  headline: string
  bio: string
  location?: string | null
  hourly_rate?: string | number | null
  website: string
  avatar_url?: string | null
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function normalizeCsv(input: unknown, prefix: string, limit = 12) {
  if (typeof input !== 'string') return []
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit)
    .map((item) => `${prefix}:${item}`)
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
    const body = await request.json()

    const creator = (body?.creator || {}) as CreatorPayload
    const socials = Array.isArray(body?.socials) ? body.socials : []
    const portfolioItems = (Array.isArray(body?.portfolioItems) ? body.portfolioItems : []) as PortfolioItemInput[]
    const skillsCsv = body?.skillsCsv
    const experienceSummary = body?.experienceSummary
    const hobbiesCsv = body?.hobbiesCsv

    const primarySocialCount = socials.filter((s: { platform?: string; url?: string }) =>
      ['tiktok', 'instagram', 'youtube'].includes(String(s.platform)) && String(s.url || '').trim()
    ).length

    if (!creator.display_name?.trim() || !creator.headline?.trim() || !creator.bio?.trim() || !creator.website?.trim()) {
      return NextResponse.json({ error: 'Missing required creator fields.' }, { status: 400 })
    }

    if (primarySocialCount < 1) {
      return NextResponse.json({ error: 'Add at least one TikTok, Instagram, or YouTube link.' }, { status: 400 })
    }

    if (portfolioItems.length < MIN_PORTFOLIO_VIDEOS || portfolioItems.length > MAX_PORTFOLIO_VIDEOS) {
      return NextResponse.json({ error: `Add between ${MIN_PORTFOLIO_VIDEOS} and ${MAX_PORTFOLIO_VIDEOS} portfolio videos.` }, { status: 400 })
    }

    const { data: existingCreator } = await adminClient
      .from('creators')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    let creatorId = existingCreator?.id as string | undefined

    const creatorPayload = {
      user_id: user.id,
      display_name: creator.display_name.trim(),
      headline: creator.headline.trim(),
      bio: creator.bio.trim(),
      location: creator.location?.trim() || null,
      hourly_rate: creator.hourly_rate ? Number(creator.hourly_rate) : null,
      website: creator.website.trim(),
      avatar_url: creator.avatar_url || null,
      availability: 'open',
    }

    if (creatorId) {
      const { error } = await adminClient.from('creators').update(creatorPayload).eq('id', creatorId)
      if (error) throw new Error(`Creator save failed: ${error.message}`)
    } else {
      const { data, error } = await adminClient.from('creators').insert([creatorPayload]).select('id').single()
      if (error || !data) throw new Error(`Creator save failed: ${error?.message || 'Unknown error'}`)
      creatorId = data.id
    }

    if (!creatorId) throw new Error('Creator profile id missing.')

    await adminClient.from('creator_tags').delete().eq('creator_id', creatorId)
    await adminClient.from('creator_socials').delete().eq('creator_id', creatorId)
    await adminClient.from('portfolio_items').delete().eq('creator_id', creatorId)

    const tagPayload = [
      ...normalizeCsv(skillsCsv, 'skill'),
      ...(typeof experienceSummary === 'string' && experienceSummary.trim() ? [`exp:${experienceSummary.trim()}`] : []),
      ...normalizeCsv(hobbiesCsv, 'hobby'),
    ].map((tag) => ({ creator_id: creatorId, tag }))

    if (tagPayload.length > 0) {
      const { error } = await adminClient.from('creator_tags').insert(tagPayload)
      if (error) throw new Error(`Creator tags save failed: ${error.message}`)
    }

    const socialPayload = [
      ...socials
        .filter((social: { platform?: string; url?: string }) => String(social?.url || '').trim())
        .map((social: { platform?: string; url?: string }) => ({
          creator_id: creatorId,
          platform: String(social.platform),
          url: String(social.url).trim(),
        })),
      { creator_id: creatorId, platform: 'website', url: creator.website.trim() },
    ]

    const { error: socialsError } = await adminClient.from('creator_socials').insert(socialPayload)
    if (socialsError) throw new Error(`Creator socials save failed: ${socialsError.message}`)

    const portfolioPayload = portfolioItems.map((item, index) => ({
      creator_id: creatorId,
      type: item.type,
      url: item.url,
      caption: item.caption?.trim() || null,
      sort_order: index,
      category: item.category || null,
    }))

    const { error: portfolioError } = await adminClient.from('portfolio_items').insert(portfolioPayload)
    if (portfolioError) throw new Error(`Portfolio save failed: ${portfolioError.message}`)

    const { error: userError } = await adminClient.from('users').update({ role: 'creator' }).eq('id', user.id)
    if (userError) throw new Error(`User role update failed: ${userError.message}`)

    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata || {}),
        role: 'creator',
        display_name: creator.display_name.trim(),
      },
    })
    if (authUpdateError) throw new Error(`Auth metadata update failed: ${authUpdateError.message}`)

    return NextResponse.json({ ok: true, creatorId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not finish creator onboarding.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
