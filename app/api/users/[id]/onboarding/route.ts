import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type Role = 'creator' | 'brand'

type CreatorOnboardingProfile = {
  name?: string
  handle?: string
  main_platform?: string
  niche?: string
  audience_size?: string
  portfolio_links?: string[]
}

type BrandOnboardingProfile = {
  company_name?: string
  website?: string
  description?: string
  industry?: string
  first_job_brief?: string
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function cleanText(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ')
}

function normalizeTag(value: string) {
  return cleanText(value).toLowerCase().replace(/\s+/g, '-')
}

function inferType(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i.test(url) ? 'image' : 'video'
}

function inferThumbnail(url: string, platform: string) {
  if (platform === 'youtube') {
    const youtubeMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (youtubeMatch?.[1]) return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`
  }

  if (inferType(url) === 'image') return url
  return null
}

function fallbackName(user: { email?: string | null; user_metadata?: Record<string, unknown> | null }) {
  const metadataName = cleanText(user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.display_name)
  if (metadataName) return metadataName
  const emailPrefix = cleanText((user.email || '').split('@')[0] || '')
  return emailPrefix || 'User'
}

async function upsertCreatorProfile({
  adminClient,
  userId,
  user,
  profile,
}: {
  adminClient: any
  userId: string
  user: { email?: string | null; user_metadata?: Record<string, unknown> | null }
  profile: CreatorOnboardingProfile
}) {
  const displayName = cleanText(profile.name) || fallbackName(user)
  const handle = cleanText(profile.handle).replace(/^@+/, '')
  const mainPlatform = normalizeTag(profile.main_platform || 'other') || 'other'
  const niche = cleanText(profile.niche)
  const audienceSize = cleanText(profile.audience_size)
  const portfolioLinks = Array.isArray(profile.portfolio_links)
    ? profile.portfolio_links.map((link) => cleanText(link)).filter(Boolean).slice(0, 3)
    : []

  const generatedBio = niche
    ? `${niche} creator${profile.main_platform ? ` focused on ${cleanText(profile.main_platform)}` : ''}.`
    : null

  const { data: existingCreator } = await adminClient
    .from('creators')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  let creatorId = existingCreator?.id as string | undefined

  const creatorPayload = {
    user_id: userId,
    display_name: displayName,
    bio: generatedBio,
    availability: 'open' as const,
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

  const { data: existingTags } = await adminClient
    .from('creator_tags')
    .select('id, tag')
    .eq('creator_id', creatorId)

  const managedTagPrefixes = ['handle:', 'main_platform:', 'followers:', 'niche:']
  const managedTagIds = (existingTags || [])
    .filter((row: { tag: string }) => managedTagPrefixes.some((prefix) => row.tag.startsWith(prefix)))
    .map((row: { id: string }) => row.id)

  if (managedTagIds.length > 0) {
    const { error } = await adminClient.from('creator_tags').delete().in('id', managedTagIds)
    if (error) throw new Error(`Creator tag cleanup failed: ${error.message}`)
  }

  const tagPayload = [
    ...(handle ? [`handle:${handle}`] : []),
    ...(mainPlatform ? [`main_platform:${mainPlatform}`] : []),
    ...(audienceSize ? [`followers:${audienceSize}`] : []),
    ...(niche ? [`niche:${niche}`] : []),
  ].map((tag) => ({ creator_id: creatorId, tag }))

  if (tagPayload.length > 0) {
    const { error } = await adminClient.from('creator_tags').insert(tagPayload)
    if (error) throw new Error(`Creator tags save failed: ${error.message}`)
  }

  const { error: deletePortfolioError } = await adminClient.from('portfolio_items').delete().eq('creator_id', creatorId)
  if (deletePortfolioError) throw new Error(`Portfolio cleanup failed: ${deletePortfolioError.message}`)

  if (portfolioLinks.length > 0) {
    const portfolioPayload = portfolioLinks.map((url, index) => ({
      creator_id: creatorId,
      url,
      platform: mainPlatform,
      caption: null,
      type: inferType(url),
      thumbnail_url: inferThumbnail(url, mainPlatform),
      sort_order: index,
    }))

    const { error } = await adminClient.from('portfolio_items').insert(portfolioPayload)
    if (error) throw new Error(`Portfolio save failed: ${error.message}`)
  }
}

async function upsertBrandProfile({
  adminClient,
  userId,
  user,
  profile,
}: {
  adminClient: any
  userId: string
  user: { email?: string | null; user_metadata?: Record<string, unknown> | null }
  profile: BrandOnboardingProfile
}) {
  const companyName = cleanText(profile.company_name) || fallbackName(user)
  const website = cleanText(profile.website) || null
  const description = cleanText(profile.description) || null
  const industry = cleanText(profile.industry) || null

  const { data: existingBrand } = await adminClient
    .from('brands')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  const brandPayload = {
    user_id: userId,
    company_name: companyName,
    website,
    bio: description,
    industry,
  }

  if (existingBrand?.id) {
    const { error } = await adminClient.from('brands').update(brandPayload).eq('id', existingBrand.id)
    if (error) throw new Error(`Brand save failed: ${error.message}`)
  } else {
    const { error } = await adminClient.from('brands').insert([brandPayload])
    if (error) throw new Error(`Brand save failed: ${error.message}`)
  }
}

async function handleRequest(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { id } = await params
    if (user.id !== id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const role = body?.role as Role | undefined
    const onboardingProfile = body?.profile && typeof body.profile === 'object' ? body.profile : null

    if (role === 'creator') {
      await upsertCreatorProfile({
        adminClient,
        userId: user.id,
        user,
        profile: (onboardingProfile || {}) as CreatorOnboardingProfile,
      })
    }

    if (role === 'brand') {
      await upsertBrandProfile({
        adminClient,
        userId: user.id,
        user,
        profile: (onboardingProfile || {}) as BrandOnboardingProfile,
      })
    }

    const userUpdate: Record<string, unknown> = {
      onboarding_complete: true,
    }

    if (role === 'creator' || role === 'brand') {
      userUpdate.role = role
    }

    const { error: userError } = await adminClient
      .from('users')
      .update(userUpdate)
      .eq('id', user.id)

    if (userError) {
      throw new Error(`User update failed: ${userError.message}`)
    }

    const nextMetadata = {
      ...(user.user_metadata || {}),
      onboarding_complete: true,
      role: role === 'creator' || role === 'brand' ? role : user.user_metadata?.role,
      onboarding_profile: onboardingProfile,
    }

    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: nextMetadata,
    })

    if (authUpdateError) {
      throw new Error(`Auth metadata update failed: ${authUpdateError.message}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not complete onboarding.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleRequest(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleRequest(request, context)
}
