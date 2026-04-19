import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  detectPortfolioPlatform,
  inferPortfolioThumbnail,
  inferPortfolioType,
} from '@/lib/portfolio-media'

export const runtime = 'nodejs'

const TOTAL_STEPS = 5

type Role = 'creator' | 'brand'

type RouteContext = { params: Promise<{ step: string }> }

type AuthUser = {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function clampStep(value: number) {
  if (!Number.isFinite(value)) return 1
  return Math.min(Math.max(Math.round(value), 1), TOTAL_STEPS)
}

function cleanText(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ')
}

function cleanOptional(value: unknown) {
  const text = cleanText(value)
  return text || null
}

function normalizeTag(value: string) {
  return cleanText(value).toLowerCase().replace(/\s+/g, '-')
}

function splitName(fullName: string) {
  const clean = cleanText(fullName)
  if (!clean) return { firstName: '', lastName: '' }

  const [firstName, ...rest] = clean.split(' ')
  return { firstName: firstName || '', lastName: rest.join(' ') }
}

function fallbackDisplayName(user: AuthUser) {
  const metadata = user.user_metadata || {}
  const metadataName = cleanText(metadata.full_name || metadata.name || metadata.display_name)
  if (metadataName) return metadataName
  const emailPrefix = cleanText((user.email || '').split('@')[0] || '')
  return emailPrefix || 'User'
}

function inferRole(user: AuthUser, usersRole: unknown, bodyRole: unknown): Role {
  const metadataRole = user.user_metadata?.role
  if (bodyRole === 'creator' || bodyRole === 'brand') return bodyRole
  if (usersRole === 'creator' || usersRole === 'brand') return usersRole
  if (metadataRole === 'creator' || metadataRole === 'brand') return metadataRole
  return 'creator'
}

function getMetadataStep(user: AuthUser) {
  const raw = Number(user.user_metadata?.onboarding_step || 1)
  return clampStep(raw)
}

function getMetadataOnboardingComplete(user: AuthUser) {
  return Boolean(user.user_metadata?.onboarding_complete)
}

async function getClients() {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

  const authClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const adminClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return { authClient, adminClient }
}

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) {
    return { error: NextResponse.json({ error: 'Missing auth token.' }, { status: 401 }) }
  }

  const { authClient, adminClient } = await getClients()
  const { data: authData, error: authError } = await authClient.auth.getUser(token)
  if (authError || !authData.user) {
    return { error: NextResponse.json({ error: 'Not authenticated.' }, { status: 401 }) }
  }

  return { user: authData.user as AuthUser, adminClient }
}

async function ensureUserRow(adminClient: any, user: AuthUser, role: Role) {
  const email = cleanText(user.email || '')

  const { data: existing } = await adminClient
    .from('users')
    .select('id, role, onboarding_complete, email')
    .eq('id', user.id)
    .maybeSingle()

  if (!existing) {
    const insertPayload: Record<string, unknown> = {
      id: user.id,
      role,
      email: email || null,
      onboarding_complete: false,
    }

    const { error } = await adminClient.from('users').insert(insertPayload)
    if (error) throw new Error(error.message)

    return {
      id: user.id,
      role,
      onboarding_complete: false,
      email,
    }
  }

  const patch: Record<string, unknown> = {}
  if (existing.role !== role) patch.role = role
  if (email && existing.email !== email) patch.email = email

  if (Object.keys(patch).length > 0) {
    const { error } = await adminClient.from('users').update(patch).eq('id', user.id)
    if (error) throw new Error(error.message)
  }

  return {
    id: existing.id,
    role,
    onboarding_complete: Boolean(existing.onboarding_complete),
    email: email || existing.email || '',
  }
}

async function ensureCreatorRow(adminClient: any, user: AuthUser, displayName?: string, avatarUrl?: string | null) {
  const { data: existing } = await adminClient
    .from('creators')
    .select('id, display_name, avatar_url')
    .eq('user_id', user.id)
    .maybeSingle()

  const fallbackName = displayName || fallbackDisplayName(user)
  const fallbackAvatar = cleanOptional(avatarUrl || user.user_metadata?.avatar_url || user.user_metadata?.picture)

  if (existing?.id) {
    const patch: Record<string, unknown> = {}
    if (fallbackName && !existing.display_name) patch.display_name = fallbackName
    if (fallbackAvatar && !existing.avatar_url) patch.avatar_url = fallbackAvatar

    if (Object.keys(patch).length > 0) {
      const { error } = await adminClient.from('creators').update(patch).eq('id', existing.id)
      if (error) throw new Error(error.message)
    }

    return existing.id as string
  }

  const { data, error } = await adminClient
    .from('creators')
    .insert({
      user_id: user.id,
      display_name: fallbackName,
      avatar_url: fallbackAvatar,
      availability: 'open',
    })
    .select('id')
    .single()

  if (error || !data?.id) throw new Error(error?.message || 'Could not create creator profile.')
  return data.id as string
}

async function ensureBrandRow(adminClient: any, user: AuthUser, companyName?: string) {
  const { data: existing } = await adminClient
    .from('brands')
    .select('id, company_name')
    .eq('user_id', user.id)
    .maybeSingle()

  const fallbackCompany = cleanText(companyName || '') || fallbackDisplayName(user)

  if (existing?.id) {
    if (!existing.company_name && fallbackCompany) {
      const { error } = await adminClient.from('brands').update({ company_name: fallbackCompany }).eq('id', existing.id)
      if (error) throw new Error(error.message)
    }

    return existing.id as string
  }

  const { data, error } = await adminClient
    .from('brands')
    .insert({
      user_id: user.id,
      company_name: fallbackCompany,
    })
    .select('id')
    .single()

  if (error || !data?.id) throw new Error(error?.message || 'Could not create brand profile.')
  return data.id as string
}

async function updateAuthMetadata(adminClient: any, user: AuthUser, patch: Record<string, unknown>) {
  const nextMetadata = {
    ...(user.user_metadata || {}),
    ...patch,
  }

  const { error } = await adminClient.auth.admin.updateUserById(user.id, {
    user_metadata: nextMetadata,
  })

  if (error) throw new Error(error.message)
}

async function getCurrentRows(adminClient: any, userId: string) {
  const [creatorRow, brandRow, userRow] = await Promise.all([
    adminClient.from('creators').select('id, display_name, avatar_url, bio').eq('user_id', userId).maybeSingle(),
    adminClient.from('brands').select('id, company_name, bio, industry, website, logo_url').eq('user_id', userId).maybeSingle(),
    adminClient.from('users').select('id, role, onboarding_complete').eq('id', userId).maybeSingle(),
  ])

  return {
    creator: creatorRow.data,
    brand: brandRow.data,
    user: userRow.data,
  }
}

async function getCreatorSnapshot(adminClient: any, creatorId: string) {
  const [tagsQuery, portfolioQuery] = await Promise.all([
    adminClient.from('creator_tags').select('tag').eq('creator_id', creatorId),
    adminClient
      .from('portfolio_items')
      .select('url, platform, caption, thumbnail_url, sort_order, created_at')
      .eq('creator_id', creatorId)
      .order('sort_order', { ascending: true }),
  ])

  const tags = (tagsQuery.data || []) as Array<{ tag?: string | null }>
  const portfolio = (portfolioQuery.data || []) as Array<{
    url: string
    platform: string | null
    caption: string | null
    thumbnail_url: string | null
    sort_order: number | null
    created_at: string
  }>

  const readSingle = (prefix: string) =>
    tags.find((entry) => (entry.tag || '').startsWith(prefix))?.tag?.replace(prefix, '').trim() || ''

  const nicheTags = tags
    .map((entry) => entry.tag || '')
    .filter((tag) => tag.startsWith('niche:'))
    .map((tag) => tag.replace('niche:', '').trim())
    .filter(Boolean)

  return {
    handle: readSingle('handle:'),
    mainPlatform: readSingle('main_platform:'),
    followerRange: readSingle('followers:'),
    nicheTags,
    portfolioItems: portfolio.slice(0, 6).map((item) => ({
      url: item.url,
      platform: item.platform || '',
      caption: item.caption || '',
      thumbnailUrl: item.thumbnail_url,
    })),
  }
}

function buildProgressResponse(input: {
  role: Role
  currentStep: number
  nextStep: number
  onboardingComplete: boolean
  creatorId?: string | null
  brandId?: string | null
  redirectTo?: string
  skipped?: boolean
  profile?: Record<string, unknown>
}) {
  const nextStep = clampStep(input.nextStep)
  const progress = Math.round((nextStep / TOTAL_STEPS) * 100)

  return NextResponse.json({
    ok: true,
    role: input.role,
    currentStep: clampStep(input.currentStep),
    nextStep,
    totalSteps: TOTAL_STEPS,
    progress,
    onboardingComplete: input.onboardingComplete,
    creatorId: input.creatorId || null,
    brandId: input.brandId || null,
    redirectTo: input.redirectTo || null,
    skipped: Boolean(input.skipped),
    profile: input.profile || null,
  })
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) return auth.error

    const { adminClient, user } = auth
    const rows = await getCurrentRows(adminClient, user.id)

    const role = inferRole(user, rows.user?.role, null)
    const creatorId = rows.creator?.id || null
    const brandId = rows.brand?.id || null

    const metadataStep = getMetadataStep(user)
    const dbComplete = Boolean(rows.user?.onboarding_complete)
    const metadataComplete = getMetadataOnboardingComplete(user)
    const onboardingComplete = dbComplete || metadataComplete

    const serverStep = onboardingComplete ? TOTAL_STEPS : metadataStep

    const metadata = user.user_metadata || {}
    const fullName = cleanText(metadata.display_name || metadata.full_name || metadata.name || fallbackDisplayName(user))
    const { firstName, lastName } = splitName(fullName)

    const creatorSnapshot = creatorId ? await getCreatorSnapshot(adminClient, creatorId) : null

    const profile = {
      firstName: cleanText(metadata.first_name || firstName),
      lastName: cleanText(metadata.last_name || lastName),
      email: cleanText(user.email || ''),
      avatarUrl: cleanOptional(metadata.avatar_url || metadata.picture || rows.creator?.avatar_url),
      handle: cleanText(metadata.handle || creatorSnapshot?.handle || ''),
      role,
      bio: cleanText(rows.creator?.bio || metadata.bio),
      nicheTags: Array.isArray(metadata.niche_tags) ? metadata.niche_tags : creatorSnapshot?.nicheTags || [],
      mainPlatform: cleanText(metadata.main_platform || creatorSnapshot?.mainPlatform || ''),
      followerRange: cleanText(metadata.follower_range || creatorSnapshot?.followerRange || ''),
      portfolioItems: Array.isArray(metadata.portfolio_items) && metadata.portfolio_items.length > 0
        ? metadata.portfolio_items
        : creatorSnapshot?.portfolioItems || [],
      companyName: cleanText(rows.brand?.company_name || metadata.company_name),
      companyDescription: cleanText(rows.brand?.bio || metadata.company_description),
      industry: cleanText(rows.brand?.industry || metadata.industry),
      website: cleanText(rows.brand?.website || metadata.website),
      logoUrl: cleanOptional(rows.brand?.logo_url || metadata.logo_url),
      brandDestination: cleanText(metadata.brand_destination) === '/jobs/new' ? '/jobs/new' : '/dashboard',
    }

    const redirectTo = onboardingComplete
      ? role === 'brand'
        ? '/dashboard'
        : '/dashboard'
      : null

    return buildProgressResponse({
      role,
      currentStep: serverStep,
      nextStep: serverStep,
      onboardingComplete,
      creatorId,
      brandId,
      redirectTo: redirectTo || undefined,
      profile,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load onboarding progress.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) return auth.error

    const { step: rawStep } = await context.params
    const requestedStep = clampStep(Number(rawStep || 1))

    const { adminClient, user } = auth
    const body = await request.json().catch(() => ({}))

    const rowsBefore = await getCurrentRows(adminClient, user.id)
    const role = inferRole(user, rowsBefore.user?.role, body?.role)

    const metadataStep = getMetadataStep(user)
    const onboardingComplete = Boolean(rowsBefore.user?.onboarding_complete) || getMetadataOnboardingComplete(user)
    const currentStep = onboardingComplete ? TOTAL_STEPS : metadataStep

    if (onboardingComplete) {
      return buildProgressResponse({
        role,
        currentStep,
        nextStep: TOTAL_STEPS,
        onboardingComplete: true,
        creatorId: rowsBefore.creator?.id,
        brandId: rowsBefore.brand?.id,
        redirectTo: '/dashboard',
      })
    }

    if (requestedStep < currentStep) {
      return buildProgressResponse({
        role,
        currentStep,
        nextStep: currentStep,
        onboardingComplete: false,
        creatorId: rowsBefore.creator?.id,
        brandId: rowsBefore.brand?.id,
        skipped: true,
      })
    }

    let nextStep = currentStep
    let creatorId = rowsBefore.creator?.id || null
    let brandId = rowsBefore.brand?.id || null
    let redirectTo: string | undefined

    if (requestedStep === 1) {
      await ensureUserRow(adminClient, user, role)

      if (role === 'creator') {
        creatorId = await ensureCreatorRow(adminClient, user)
      } else {
        brandId = await ensureBrandRow(adminClient, user)
      }

      nextStep = Math.max(currentStep, 2)
    }

    if (requestedStep === 2) {
      await ensureUserRow(adminClient, user, role)

      const firstName = cleanText(body?.firstName)
      const lastName = cleanText(body?.lastName)
      const email = cleanText(body?.email || user.email || '')
      const avatarUrl = cleanOptional(body?.avatarUrl)
      const handle = cleanText(body?.handle).replace(/^@+/, '')
      const displayName = cleanText(`${firstName} ${lastName}`) || fallbackDisplayName(user)

      const userPatch: Record<string, unknown> = {}
      if (email) userPatch.email = email

      if (Object.keys(userPatch).length > 0) {
        const { error } = await adminClient.from('users').update(userPatch).eq('id', user.id)
        if (error) throw new Error(error.message)
      }

      if (role === 'creator') {
        creatorId = await ensureCreatorRow(adminClient, user, displayName, avatarUrl)
        const { error } = await adminClient
          .from('creators')
          .update({ display_name: displayName, avatar_url: avatarUrl })
          .eq('id', creatorId)
        if (error) throw new Error(error.message)
      } else {
        brandId = await ensureBrandRow(adminClient, user, displayName)
      }

      nextStep = Math.max(currentStep, 3)

      await updateAuthMetadata(adminClient, user, {
        role,
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        email,
        avatar_url: avatarUrl,
        handle,
      })
    }

    if (requestedStep === 3) {
      await ensureUserRow(adminClient, user, role)

      if (role === 'creator') {
        creatorId = await ensureCreatorRow(adminClient, user)

        const bio = cleanText(body?.bio).slice(0, 280)
        const mainPlatform = normalizeTag(body?.mainPlatform || 'tiktok')
        const followerRange = cleanText(body?.followerRange)
        const handle = cleanText(body?.handle || user.user_metadata?.handle).replace(/^@+/, '')
        const nicheTags = Array.isArray(body?.nicheTags)
          ? body.nicheTags.map((tag: unknown) => cleanText(tag)).filter(Boolean).slice(0, 10)
          : []

        const { error: creatorUpdateError } = await adminClient
          .from('creators')
          .update({ bio })
          .eq('id', creatorId)

        if (creatorUpdateError) throw new Error(creatorUpdateError.message)

        const { data: existingTags } = await adminClient
          .from('creator_tags')
          .select('id, tag')
          .eq('creator_id', creatorId)

        const managedPrefixes = ['handle:', 'main_platform:', 'followers:', 'niche:']
        const managedTagIds = (existingTags || [])
          .filter((row: { tag: string }) => managedPrefixes.some((prefix) => row.tag.startsWith(prefix)))
          .map((row: { id: string }) => row.id)

        if (managedTagIds.length > 0) {
          const { error } = await adminClient.from('creator_tags').delete().in('id', managedTagIds)
          if (error) throw new Error(error.message)
        }

        const tagsToInsert = [
          ...(handle ? [`handle:${handle}`] : []),
          ...(mainPlatform ? [`main_platform:${mainPlatform}`] : []),
          ...(followerRange ? [`followers:${followerRange}`] : []),
          ...nicheTags.map((tag: string) => `niche:${tag}`),
        ].map((tag) => ({ creator_id: creatorId, tag }))

        if (tagsToInsert.length > 0) {
          const { error } = await adminClient.from('creator_tags').insert(tagsToInsert)
          if (error) throw new Error(error.message)
        }

        await updateAuthMetadata(adminClient, user, {
          bio,
          main_platform: mainPlatform,
          follower_range: followerRange,
          niche_tags: nicheTags,
          handle,
        })
      } else {
        brandId = await ensureBrandRow(adminClient, user, body?.companyName)

        const companyName = cleanText(body?.companyName) || fallbackDisplayName(user)
        const companyDescription = cleanOptional(body?.companyDescription)
        const industry = cleanOptional(body?.industry)
        const website = cleanOptional(body?.website)

        const { error } = await adminClient
          .from('brands')
          .update({
            company_name: companyName,
            bio: companyDescription,
            industry,
            website,
          })
          .eq('id', brandId)

        if (error) throw new Error(error.message)

        await updateAuthMetadata(adminClient, user, {
          company_name: companyName,
          company_description: companyDescription,
          industry,
          website,
        })
      }

      nextStep = Math.max(currentStep, 4)
    }

    if (requestedStep === 4) {
      await ensureUserRow(adminClient, user, role)

      if (role === 'creator') {
        creatorId = await ensureCreatorRow(adminClient, user)

        const portfolioItems = Array.isArray(body?.portfolioItems)
          ? body.portfolioItems
              .map((item: unknown) => {
                const row = item as { url?: string; platform?: string; caption?: string }
                const url = cleanText(row?.url)
                const platform = detectPortfolioPlatform(url, row?.platform || body?.mainPlatform)
                const caption = cleanOptional(row?.caption)
                return { url, platform, caption }
              })
              .filter((item: { url: string }) => Boolean(item.url))
              .slice(0, 6)
          : []

        const { error: deleteError } = await adminClient
          .from('portfolio_items')
          .delete()
          .eq('creator_id', creatorId)
        if (deleteError) throw new Error(deleteError.message)

        if (portfolioItems.length > 0) {
          const payload = portfolioItems.map((item: { url: string; platform: string; caption: string | null }, index: number) => ({
            creator_id: creatorId,
            url: item.url,
            platform: item.platform,
            caption: item.caption,
            type: inferPortfolioType(item.url),
            thumbnail_url: inferPortfolioThumbnail(item.url, item.platform),
            sort_order: index,
          }))

          const { error } = await adminClient.from('portfolio_items').insert(payload)
          if (error) throw new Error(error.message)
        }

        await updateAuthMetadata(adminClient, user, {
          portfolio_items: portfolioItems,
        })
      } else {
        brandId = await ensureBrandRow(adminClient, user)
        const destination = cleanText(body?.brandDestination) === '/jobs/new' ? '/jobs/new' : '/dashboard'

        await updateAuthMetadata(adminClient, user, {
          brand_destination: destination,
        })
      }

      nextStep = Math.max(currentStep, 5)
    }

    if (requestedStep === 5) {
      await ensureUserRow(adminClient, user, role)

      if (role === 'creator') creatorId = await ensureCreatorRow(adminClient, user)
      if (role === 'brand') brandId = await ensureBrandRow(adminClient, user)

      const userPatch: Record<string, unknown> = {
        role,
        onboarding_complete: true,
      }

      const { error: userUpdateError } = await adminClient
        .from('users')
        .update(userPatch)
        .eq('id', user.id)

      if (userUpdateError) throw new Error(userUpdateError.message)

      const displayHandle = cleanText(body?.handle || user.user_metadata?.handle).replace(/^@+/, '')
      const profilePath = creatorId ? `/creators/${creatorId}` : '/dashboard'

      redirectTo = role === 'brand'
        ? cleanText(body?.brandDestination) === '/jobs/new'
          ? '/jobs/new?onboarding=brand'
          : '/dashboard?onboarding=brand'
        : `/dashboard?onboarding=creator&profile=${encodeURIComponent(`https://ottougc.com${profilePath}`)}&handle=${encodeURIComponent(displayHandle)}`

      nextStep = TOTAL_STEPS

      await updateAuthMetadata(adminClient, user, {
        role,
        onboarding_complete: true,
        onboarding_step: TOTAL_STEPS,
      })

      return buildProgressResponse({
        role,
        currentStep,
        nextStep,
        onboardingComplete: true,
        creatorId,
        brandId,
        redirectTo,
      })
    }

    await updateAuthMetadata(adminClient, user, {
      role,
      onboarding_complete: false,
      onboarding_step: nextStep,
    })

    return buildProgressResponse({
      role,
      currentStep,
      nextStep,
      onboardingComplete: false,
      creatorId,
      brandId,
      redirectTo,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save onboarding step.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
