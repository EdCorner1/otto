import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type Scope = 'all' | 'jobs' | 'creators' | 'brands'

type UserRow = {
  id: string
  role?: string | null
  name?: string | null
  full_name?: string | null
  display_name?: string | null
  username?: string | null
  handle?: string | null
  user_metadata?: Record<string, unknown> | null
}

type CreatorRow = {
  id: string
  user_id: string
  display_name: string | null
  headline: string | null
  creator_socials?: Array<{ platform: string | null }> | null
  creator_tags?: Array<{ tag: string | null }> | null
}

type BrandRow = {
  id: string
  user_id: string
  company_name: string | null
  industry: string | null
}

type JobRow = {
  id: string
  title: string | null
  description: string | null
  budget_range: string | null
  timeline: string | null
  deadline: string | null
  platforms: string[] | null
  brand_id: string | null
  brands?: { company_name?: string | null } | null
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function normalize(value: string | null | undefined) {
  return (value || '').trim().toLowerCase()
}

function parseScope(raw: string | null): Scope {
  const normalized = normalize(raw)
  if (normalized === 'jobs' || normalized === 'creators' || normalized === 'brands') return normalized
  return 'all'
}

function includesQuery(query: string, ...fields: Array<string | null | undefined>) {
  const haystack = fields.map((field) => normalize(field)).join(' ')
  return haystack.includes(query)
}

function getUserName(user: UserRow) {
  const metadata = (user.user_metadata || {}) as Record<string, unknown>
  const metadataName = typeof metadata.full_name === 'string'
    ? metadata.full_name
    : typeof metadata.name === 'string'
      ? metadata.name
      : ''

  return user.name || user.full_name || user.display_name || metadataName || ''
}

function getUserHandle(user: UserRow) {
  const metadata = (user.user_metadata || {}) as Record<string, unknown>
  const metadataHandle = typeof metadata.handle === 'string'
    ? metadata.handle
    : typeof metadata.username === 'string'
      ? metadata.username
      : ''

  return user.handle || user.username || metadataHandle || ''
}

function parseCreatorMeta(tags: Array<{ tag: string | null }> | null | undefined) {
  const safeTags = (tags || []).map((entry) => entry.tag || '').filter(Boolean)

  const readSingle = (prefixes: string[]) => {
    for (const prefix of prefixes) {
      const match = safeTags.find((tag) => tag.toLowerCase().startsWith(prefix))
      if (match) return match.slice(prefix.length).trim()
    }
    return ''
  }

  const readMulti = (prefixes: string[]) => {
    const values = safeTags
      .flatMap((tag) => {
        const normalizedTag = tag.toLowerCase()
        const prefix = prefixes.find((candidate) => normalizedTag.startsWith(candidate))
        if (!prefix) return [] as string[]
        const value = tag.slice(prefix.length).trim()
        return value ? [value] : []
      })
      .filter(Boolean)

    return Array.from(new Set(values))
  }

  return {
    handle: readSingle(['handle:']),
    mainPlatform: readSingle(['main_platform:', 'platform:']),
    followerRange: readSingle(['followers:', 'follower_range:', 'reach:']),
    niches: readMulti(['niche:']),
  }
}

async function fetchUsersByRole(admin: any, role: 'creator' | 'brand') {
  const { data, error } = await admin
    .from('users')
    .select('*')
    .eq('role', role)
    .limit(400)

  if (error) throw new Error(error.message)
  return (data || []) as UserRow[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = normalize(searchParams.get('q'))
    const scope = parseScope(searchParams.get('scope'))

    if (!query) {
      return NextResponse.json({
        query: '',
        scope,
        counts: { jobs: 0, creators: 0, brands: 0, total: 0 },
        results: { jobs: [], creators: [], brands: [] },
      })
    }

    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const response = {
      query,
      scope,
      counts: { jobs: 0, creators: 0, brands: 0, total: 0 },
      results: {
        jobs: [] as Array<{
          id: string
          title: string
          brandName: string
          budgetRange: string
          deadline: string | null
          timeline: string | null
          platforms: string[]
        }>,
        creators: [] as Array<{
          id: string
          name: string
          handle: string
          platform: string
          followerRange: string
          niche: string
        }>,
        brands: [] as Array<{
          id: string
          name: string
          industry: string
          activeBriefCount: number
        }>,
      },
    }

    const perTypeLimit = scope === 'all' ? 8 : 24

    if (scope === 'all' || scope === 'jobs') {
      const { data: jobsData, error: jobsError } = await admin
        .from('jobs')
        .select('id, title, description, budget_range, timeline, deadline, platforms, brand_id, brands(company_name)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(180)

      if (jobsError) throw new Error(jobsError.message)

      const matchedJobs = ((jobsData as JobRow[]) || [])
        .filter((job) => includesQuery(query, job.title, job.description, job.brands?.company_name))
        .slice(0, perTypeLimit)
        .map((job) => ({
          id: job.id,
          title: job.title || 'Untitled brief',
          brandName: job.brands?.company_name || 'Brand',
          budgetRange: job.budget_range || 'Budget TBD',
          deadline: job.deadline,
          timeline: job.timeline,
          platforms: (job.platforms || []).filter(Boolean),
        }))

      response.results.jobs = matchedJobs
      response.counts.jobs = matchedJobs.length
    }

    if (scope === 'all' || scope === 'creators') {
      const creatorUsers = await fetchUsersByRole(admin, 'creator')
      const creatorIds = creatorUsers.map((user) => user.id)
      const creatorUsersById = new Map(creatorUsers.map((user) => [user.id, user]))

      if (creatorIds.length) {
        const { data: creatorsData, error: creatorsError } = await admin
          .from('creators')
          .select('id, user_id, display_name, headline, creator_socials(platform), creator_tags(tag)')
          .in('user_id', creatorIds)
          .order('created_at', { ascending: false })
          .limit(300)

        if (creatorsError) throw new Error(creatorsError.message)

        const matchedCreators = ((creatorsData as CreatorRow[]) || [])
          .filter((creator) => {
            const user = creatorUsersById.get(creator.user_id)
            const userName = user ? getUserName(user) : ''
            const userHandle = user ? getUserHandle(user) : ''
            const meta = parseCreatorMeta(creator.creator_tags)

            return includesQuery(
              query,
              creator.display_name,
              creator.headline,
              userName,
              userHandle,
              meta.handle,
              meta.mainPlatform,
              meta.followerRange,
              meta.niches.join(' '),
            )
          })
          .slice(0, perTypeLimit)
          .map((creator) => {
            const user = creatorUsersById.get(creator.user_id)
            const meta = parseCreatorMeta(creator.creator_tags)
            const firstPlatform = (creator.creator_socials || []).map((row) => row.platform || '').find(Boolean) || ''

            return {
              id: creator.id,
              name: creator.display_name || getUserName(user || { id: '' }) || 'Creator',
              handle: meta.handle || getUserHandle(user || { id: '' }) || '',
              platform: meta.mainPlatform || firstPlatform || 'N/A',
              followerRange: meta.followerRange || 'N/A',
              niche: meta.niches[0] || 'General',
            }
          })

        response.results.creators = matchedCreators
        response.counts.creators = matchedCreators.length
      }
    }

    if (scope === 'all' || scope === 'brands') {
      const brandUsers = await fetchUsersByRole(admin, 'brand')
      const brandUserIds = brandUsers.map((user) => user.id)
      const brandUsersById = new Map(brandUsers.map((user) => [user.id, user]))

      if (brandUserIds.length) {
        const [{ data: brandsData, error: brandsError }, { data: activeJobsData, error: jobsError }] = await Promise.all([
          admin
            .from('brands')
            .select('id, user_id, company_name, industry')
            .in('user_id', brandUserIds)
            .order('company_name', { ascending: true })
            .limit(300),
          admin
            .from('jobs')
            .select('brand_id')
            .eq('status', 'open'),
        ])

        if (brandsError) throw new Error(brandsError.message)
        if (jobsError) throw new Error(jobsError.message)

        const activeCounts = ((activeJobsData as Array<{ brand_id: string | null }>) || []).reduce<Record<string, number>>((acc, row) => {
          if (!row.brand_id) return acc
          acc[row.brand_id] = (acc[row.brand_id] || 0) + 1
          return acc
        }, {})

        const matchedBrands = ((brandsData as BrandRow[]) || [])
          .filter((brand) => {
            const user = brandUsersById.get(brand.user_id)
            return includesQuery(query, brand.company_name, brand.industry, user ? getUserName(user) : '', user ? getUserHandle(user) : '')
          })
          .slice(0, perTypeLimit)
          .map((brand) => ({
            id: brand.id,
            name: brand.company_name || getUserName(brandUsersById.get(brand.user_id) || { id: '' }) || 'Brand',
            industry: brand.industry || 'Uncategorized',
            activeBriefCount: activeCounts[brand.id] || 0,
          }))

        response.results.brands = matchedBrands
        response.counts.brands = matchedBrands.length
      }
    }

    response.counts.total = response.counts.jobs + response.counts.creators + response.counts.brands

    return NextResponse.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not run search.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
