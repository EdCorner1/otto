import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  buildJobDeliverables,
  buildJobDescription,
  computeLiveCampaignStats,
  createLiveCampaignMetadata,
  ED_LIVE_CAMPAIGN_SEEDS,
  makeBrandEmail,
  parseLiveCampaignMetadata,
  serializeLiveCampaignMetadata,
  sortLogsDesc,
} from '@/lib/live-campaigns'

export const runtime = 'nodejs'

type Role = 'brand' | 'creator'

type LiveCampaignDealRow = {
  id: string
  creator_id: string
  brand_id: string
  job_id: string
  amount: number | string | null
  status: string | null
  created_at: string
  updated_at: string
  submitted_notes: string | null
  brands: { company_name?: string | null; logo_url?: string | null } | Array<{ company_name?: string | null; logo_url?: string | null }> | null
  jobs: { title?: string | null } | Array<{ title?: string | null }> | null
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null
  return value || null
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
  const [{ data: creatorRow }, { data: brandRow }, { data: userRow }] = await Promise.all([
    admin.from('creators').select('id').eq('user_id', user.id).maybeSingle(),
    admin.from('brands').select('id').eq('user_id', user.id).maybeSingle(),
    admin.from('users').select('role').eq('id', user.id).maybeSingle(),
  ])

  let role = (user.user_metadata?.role as Role | undefined) || (userRow?.role as Role | undefined) || null
  if (!role) {
    if (creatorRow?.id && !brandRow?.id) role = 'creator'
    else if (brandRow?.id && !creatorRow?.id) role = 'brand'
    else role = 'creator'
  }

  return {
    admin,
    user,
    role,
    creatorId: creatorRow?.id || null,
    brandId: brandRow?.id || null,
    isEd: (user.email || '').toLowerCase().trim() === 'edcorner1@gmail.com',
  }
}

async function ensureUserRow(admin: any, user: { id: string; email?: string | null }) {
  const email = user.email || 'edcorner1@gmail.com'

  const { data: existing } = await admin
    .from('users')
    .select('id, email, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!existing) {
    const { error } = await admin.from('users').insert({ id: user.id, email, role: 'creator' })
    if (error) throw new Error(error.message)
  } else if (existing.email !== email || existing.role !== 'creator') {
    const { error } = await admin.from('users').update({ email, role: 'creator' }).eq('id', user.id)
    if (error) throw new Error(error.message)
  }
}

async function ensureCreatorRow(
  admin: any,
  user: {
    id: string
    user_metadata?: {
      full_name?: string
      name?: string
      avatar_url?: string
      picture?: string
    }
  },
) {
  const fallbackName = user.user_metadata?.full_name || user.user_metadata?.name || 'Ed Corner'
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null

  const { data: existing } = await admin
    .from('creators')
    .select('id, display_name, avatar_url, bio, location, timezone, availability')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    const updates: Record<string, unknown> = {}
    if (!existing.display_name) updates.display_name = fallbackName
    if (!existing.avatar_url && avatarUrl) updates.avatar_url = avatarUrl
    if (!existing.bio) updates.bio = 'Tech UGC creator building practical creator systems.'
    if (!existing.location) updates.location = 'New York'
    if (!existing.timezone) updates.timezone = 'America/New_York'
    if (!existing.availability) updates.availability = 'open'

    if (Object.keys(updates).length > 0) {
      const { error } = await admin.from('creators').update(updates).eq('id', existing.id)
      if (error) throw new Error(error.message)
    }

    return existing.id
  }

  const { data, error } = await admin.from('creators').insert({
    user_id: user.id,
    display_name: fallbackName,
    avatar_url: avatarUrl,
    bio: 'Tech UGC creator building practical creator systems.',
    location: 'New York',
    timezone: 'America/New_York',
    availability: 'open',
  }).select('id').single()

  if (error) throw new Error(error.message)
  return data.id
}

async function ensureBrand(admin: any, seed: (typeof ED_LIVE_CAMPAIGN_SEEDS)[number]) {
  const email = makeBrandEmail(seed)

  const { data: userRow } = await admin
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  let brandUserId = userRow?.id || null
  if (!brandUserId) {
    const { data, error } = await admin
      .from('users')
      .insert({ email, role: 'brand' })
      .select('id')
      .single()

    if (error) throw new Error(error.message)
    brandUserId = data.id
  }

  const { data: existingBrand } = await admin
    .from('brands')
    .select('id')
    .eq('user_id', brandUserId)
    .maybeSingle()

  const existingBrandId = typeof existingBrand?.id === 'string' ? existingBrand.id : null
  if (existingBrandId) return existingBrandId

  const { data: brand, error: brandError } = await admin
    .from('brands')
    .insert({
      user_id: brandUserId,
      company_name: seed.clientName,
      website: seed.website,
      bio: `${seed.clientName} live campaign account for creator deal tracking.`,
      industry: seed.industry,
    })
    .select('id')
    .single()

  if (brandError) throw new Error(brandError.message)
  return brand.id
}

async function ensureJob(admin: any, brandId: string, seed: (typeof ED_LIVE_CAMPAIGN_SEEDS)[number]) {
  const title = `${seed.clientName} live campaign retainer`

  const { data: existing } = await admin
    .from('jobs')
    .select('id')
    .eq('brand_id', brandId)
    .eq('title', title)
    .maybeSingle()

  const payload: Record<string, unknown> = {
    brand_id: brandId,
    title,
    description: buildJobDescription(seed),
    deliverables: buildJobDeliverables(seed),
    platforms: seed.platforms,
    budget_min: seed.monthlyRate,
    budget_max: seed.monthlyRate,
    deadline: seed.startDate,
    status: 'filled',
  }

  const existingJobId = typeof existing?.id === 'string' ? existing.id : null

  if (existingJobId) {
    const { error } = await admin.from('jobs').update(payload).eq('id', existingJobId)
    if (error) throw new Error(error.message)
    return existingJobId
  }

  const { data, error } = await admin.from('jobs').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  return data.id
}

async function seedEdLiveCampaignDeals(auth: Awaited<ReturnType<typeof getAuthContext>>) {
  if ('error' in auth || !auth.isEd) return auth

  await ensureUserRow(auth.admin, auth.user)
  const creatorId = auth.creatorId || await ensureCreatorRow(auth.admin, auth.user)

  for (const seed of ED_LIVE_CAMPAIGN_SEEDS) {
    const brandId = await ensureBrand(auth.admin, seed)
    const jobId = await ensureJob(auth.admin, brandId, seed)

    const { data: existingDeal } = await auth.admin
      .from('deals')
      .select('id, submitted_notes')
      .eq('creator_id', creatorId)
      .eq('brand_id', brandId)
      .eq('job_id', jobId)
      .maybeSingle()

    const existingMetadata = parseLiveCampaignMetadata(existingDeal?.submitted_notes)
    const metadata = existingMetadata || createLiveCampaignMetadata(seed)
    const amount = seed.monthlyRate
    const platformFee = Number((amount * 0.1).toFixed(2))
    const creatorPayout = Number((amount - platformFee).toFixed(2))

    const payload: Record<string, unknown> = {
      job_id: jobId,
      creator_id: creatorId,
      brand_id: brandId,
      amount,
      platform_fee: platformFee,
      creator_payout: creatorPayout,
      status: 'in_progress',
      submitted_notes: serializeLiveCampaignMetadata(metadata),
    }

    const existingDealId = typeof existingDeal?.id === 'string' ? existingDeal.id : null

    if (existingDealId) {
      const { error } = await auth.admin.from('deals').update(payload).eq('id', existingDealId)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await auth.admin.from('deals').insert(payload)
      if (error) throw new Error(error.message)
    }
  }

  return { ...auth, creatorId }
}

function buildResponse(rows: LiveCampaignDealRow[]) {
  const campaigns = rows
    .map((deal) => {
      const metadata = parseLiveCampaignMetadata(deal.submitted_notes)
      if (!metadata) return null

      const logs = sortLogsDesc(metadata.logs)
      const stats = computeLiveCampaignStats({ ...metadata, logs })
      const brand = relationOne(deal.brands)
      const job = relationOne(deal.jobs)

      return {
        id: deal.id,
        brand_id: deal.brand_id,
        creator_id: deal.creator_id,
        job_id: deal.job_id,
        title: job?.title || `${metadata.client_name} live campaign`,
        client_name: metadata.client_name,
        avatar_url: brand?.logo_url || null,
        amount: Number(deal.amount || metadata.monthly_rate || 0),
        status: String(deal.status || 'in_progress'),
        start_date: metadata.start_date,
        contract_days: metadata.contract_days,
        daily_target: metadata.daily_target,
        monthly_rate: metadata.monthly_rate,
        platforms: metadata.platforms,
        days_active: stats.daysActive,
        videos_today: stats.videosToday,
        videos_this_week: stats.videosThisWeek,
        videos_this_month: stats.videosThisMonth,
        views_this_month: stats.viewsThisMonth,
        total_videos: stats.totalVideos,
        total_views: stats.totalViews,
        earned_prorated: stats.earnedProrated,
        monthly_target_to_date: stats.monthlyTargetToDate,
        progress_percent: stats.progressPercent,
        campaign_status: stats.status,
        logs,
        created_at: deal.created_at,
        updated_at: deal.updated_at,
      }
    })
    .filter((campaign): campaign is NonNullable<typeof campaign> => Boolean(campaign))
    .sort((a, b) => a.client_name.localeCompare(b.client_name))

  const allLogs = campaigns
    .flatMap((campaign) => campaign.logs.map((log) => ({ ...log, deal_id: campaign.id, client_name: campaign.client_name })))
    .sort((a, b) => {
      const byDate = b.date.localeCompare(a.date)
      if (byDate !== 0) return byDate
      return b.created_at.localeCompare(a.created_at)
    })

  const summary = campaigns.reduce((acc, campaign) => {
    acc.total_clients += 1
    acc.total_videos_posted += campaign.total_videos
    acc.total_views += campaign.views_this_month
    acc.total_earned += campaign.earned_prorated
    return acc
  }, {
    total_clients: 0,
    total_videos_posted: 0,
    total_views: 0,
    total_earned: 0,
  })

  return {
    summary,
    campaigns,
    content_log: allLogs,
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const resolvedAuth = await seedEdLiveCampaignDeals(auth)
    if ('error' in resolvedAuth) {
      return NextResponse.json({ error: resolvedAuth.error }, { status: resolvedAuth.status })
    }

    const query = resolvedAuth.admin
      .from('deals')
      .select('id, creator_id, brand_id, job_id, amount, status, created_at, updated_at, submitted_notes, brands(company_name, logo_url), jobs(title)')
      .order('created_at', { ascending: false })

    const scopedQuery = resolvedAuth.role === 'brand'
      ? resolvedAuth.brandId
        ? query.eq('brand_id', resolvedAuth.brandId)
        : query.limit(0)
      : resolvedAuth.creatorId
        ? query.eq('creator_id', resolvedAuth.creatorId)
        : query.limit(0)

    const { data, error } = await scopedQuery
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(buildResponse((data || []) as LiveCampaignDealRow[]))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load live campaigns.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
