import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type Role = 'brand' | 'creator'

type ActivityItem = {
  id: string
  type: 'deal' | 'application' | 'message' | 'notification'
  title: string
  description: string
  created_at: string
  href: string
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function asMoney(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function startOfMonthIso() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return start.toISOString()
}

function isSettledStatus(status: string) {
  return ['paid', 'complete'].includes(status)
}

function isPendingStatus(status: string) {
  return ['proposed', 'application_sent', 'under_review', 'offered', 'accepted', 'in_progress', 'submitted', 'reviewed', 'approved'].includes(status)
}

function isActiveDealStatus(status: string) {
  return !['complete', 'archived', 'cancelled', 'declined'].includes(status)
}

function normalizeRole(input: unknown): Role | null {
  return input === 'brand' || input === 'creator' ? input : null
}

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] || null : value
}

type MessageActivityRow = {
  id: string
  deal_id: string
  sender_id: string | null
  content: string | null
  created_at: string
}

async function hydrateMessageActivity(admin: any, rows: MessageActivityRow[]) {
  const senderIds = Array.from(new Set(rows.map((row) => row.sender_id).filter(Boolean))) as string[]

  if (!senderIds.length) {
    return rows.map((row) => ({
      ...row,
      sender_name: 'teammate',
    }))
  }

  const [{ data: users }, { data: brands }, { data: creators }] = await Promise.all([
    admin.from('users').select('id, email').in('id', senderIds),
    admin.from('brands').select('user_id, company_name').in('user_id', senderIds),
    admin.from('creators').select('user_id, display_name').in('user_id', senderIds),
  ])

  const nameByUserId = new Map<string, string>()

  for (const user of users || []) {
    if (user?.id) nameByUserId.set(user.id, user.email?.split('@')[0] || 'teammate')
  }
  for (const brand of brands || []) {
    if (brand?.user_id && brand.company_name) nameByUserId.set(brand.user_id, brand.company_name)
  }
  for (const creator of creators || []) {
    if (creator?.user_id && creator.display_name) nameByUserId.set(creator.user_id, creator.display_name)
  }

  return rows.map((row) => ({
    ...row,
    sender_name: row.sender_id ? (nameByUserId.get(row.sender_id) || 'teammate') : 'teammate',
  }))
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

  const [{ data: userRow }, { data: brandRow }, { data: creatorRow }] = await Promise.all([
    admin.from('users').select('role').eq('id', user.id).maybeSingle(),
    admin.from('brands').select('id, user_id, company_name').eq('user_id', user.id).maybeSingle(),
    admin
      .from('creators')
      .select('id, user_id, display_name, avatar_url, niche, skills, creator_tags(tag), creator_socials(platform)')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  let role = normalizeRole(user.user_metadata?.role) || normalizeRole(userRow?.role)
  if (!role) role = brandRow?.id ? 'brand' : 'creator'

  return {
    admin,
    user,
    role,
    brand: brandRow,
    creator: creatorRow,
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const monthStart = startOfMonthIso()
    const fallbackName =
      auth.user.user_metadata?.full_name ||
      auth.user.email?.split('@')[0] ||
      'there'

    const welcomeName = auth.role === 'brand'
      ? auth.brand?.company_name || fallbackName
      : auth.creator?.display_name || fallbackName

    const { data: notifications } = await auth.admin
      .from('notifications')
      .select('id, type, content, created_at, link_url')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (auth.role === 'creator') {
      if (!auth.creator?.id) {
        return NextResponse.json({
          role: 'creator',
          welcomeName,
          creator: {
            activeDeals: { count: 0, items: [] },
            applications: { count: 0, items: [] },
            opportunities: { count: 0, items: [] },
            earnings: { total: 0, thisMonth: 0, pending: 0 },
            activity: (notifications || []).slice(0, 5).map((item) => ({
              id: `notification-${item.id}`,
              type: 'notification',
              title: 'Notification',
              description: item.content || 'New update',
              created_at: item.created_at,
              href: item.link_url || '/notifications',
            } satisfies ActivityItem)),
          },
        })
      }

      const creatorId = auth.creator.id

      const [{ data: deals }, { data: applications }, { data: openJobs }] = await Promise.all([
        auth.admin
          .from('deals')
          .select('id, status, budget, amount, created_at, jobs(id, title), brands(company_name)')
          .eq('creator_id', creatorId)
          .order('created_at', { ascending: false })
          .limit(40),
        auth.admin
          .from('applications')
          .select('id, status, created_at, job_id, jobs(id, title, brands(company_name))')
          .eq('creator_id', creatorId)
          .order('created_at', { ascending: false })
          .limit(30),
        auth.admin
          .from('jobs')
          .select('id, title, status, budget_range, timeline, platforms, category, created_at, brands(company_name)')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(40),
      ])

      const dealRows = deals || []
      const applicationRows = applications || []
      const openJobRows = openJobs || []

      const profileTokens = new Set<string>()
      const skillValues = Array.isArray(auth.creator.skills) ? auth.creator.skills : []
      skillValues.forEach((skill) => {
        if (typeof skill === 'string' && skill.trim()) profileTokens.add(skill.toLowerCase().trim())
      })
      if (typeof auth.creator.niche === 'string' && auth.creator.niche.trim()) {
        profileTokens.add(auth.creator.niche.toLowerCase().trim())
      }
      const tagValues = Array.isArray(auth.creator.creator_tags) ? auth.creator.creator_tags : []
      tagValues.forEach((tagRow) => {
        const tag = typeof tagRow?.tag === 'string' ? tagRow.tag : ''
        if (!tag) return
        if (tag.startsWith('niche:')) profileTokens.add(tag.replace('niche:', '').trim().toLowerCase())
        if (tag.startsWith('skill:')) profileTokens.add(tag.replace('skill:', '').trim().toLowerCase())
      })
      const socialValues = Array.isArray(auth.creator.creator_socials) ? auth.creator.creator_socials : []
      socialValues.forEach((socialRow) => {
        const platform = typeof socialRow?.platform === 'string' ? socialRow.platform : ''
        if (platform) profileTokens.add(platform.toLowerCase().trim())
      })

      const scoredOpportunities = openJobRows
        .map((job) => {
          const haystack = [
            typeof job.title === 'string' ? job.title : '',
            typeof job.category === 'string' ? job.category : '',
            ...(Array.isArray(job.platforms) ? job.platforms.filter((p): p is string => typeof p === 'string') : []),
          ].join(' ').toLowerCase()

          let score = 0
          profileTokens.forEach((token) => {
            if (token && haystack.includes(token)) score += 1
          })

          return { job, score }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((item) => item.job)

      const creatorDeals = dealRows
        .filter((deal) => isActiveDealStatus(String(deal.status || '')))
        .slice(0, 5)
        .map((deal) => {
          const job = relationOne(deal.jobs)
          const brand = relationOne(deal.brands)
          return {
            id: deal.id,
            title: job?.title || 'Untitled deal',
            brandName: brand?.company_name || 'Brand',
            status: deal.status,
            value: deal.budget ?? deal.amount ?? null,
          }
        })

      const creatorApplications = applicationRows.slice(0, 5).map((application) => {
        const job = relationOne(application.jobs)
        const brand = relationOne(job?.brands)

        return {
          id: application.id,
          jobId: application.job_id,
          jobTitle: job?.title || 'Untitled brief',
          brandName: brand?.company_name || 'Brand',
          appliedAt: application.created_at,
          status: application.status,
        }
      })

      const creatorOpportunities = scoredOpportunities.map((job) => {
        const brand = relationOne(job.brands)

        return {
          id: job.id,
          title: job.title,
          brandName: brand?.company_name || 'Brand',
          budgetRange: job.budget_range,
          timeline: job.timeline,
        }
      })

      const totalEarned = dealRows.reduce((sum, deal) => {
        if (!isSettledStatus(String(deal.status || ''))) return sum
        return sum + asMoney(deal.budget ?? deal.amount)
      }, 0)

      const earnedThisMonth = dealRows.reduce((sum, deal) => {
        if (!isSettledStatus(String(deal.status || ''))) return sum
        if (String(deal.created_at || '') < monthStart) return sum
        return sum + asMoney(deal.budget ?? deal.amount)
      }, 0)

      const pendingPayment = dealRows.reduce((sum, deal) => {
        if (!isPendingStatus(String(deal.status || ''))) return sum
        return sum + asMoney(deal.budget ?? deal.amount)
      }, 0)

      const dealIds = dealRows.map((deal) => deal.id)
      const { data: messageRows } = dealIds.length
        ? await auth.admin
          .from('messages')
          .select('id, deal_id, sender_id, content, created_at')
          .in('deal_id', dealIds)
          .order('created_at', { ascending: false })
          .limit(20)
        : { data: [] as MessageActivityRow[] }

      const messages = await hydrateMessageActivity(auth.admin, (messageRows || []) as MessageActivityRow[])

      const activity: ActivityItem[] = [
        ...(dealRows.slice(0, 8).map((deal) => {
          const job = relationOne(deal.jobs)
          const brand = relationOne(deal.brands)

          return {
            id: `deal-${deal.id}`,
            type: 'deal',
            title: `Deal ${String(deal.status || 'updated').replace(/_/g, ' ')}`,
            description: `${job?.title || 'Untitled deal'} · ${brand?.company_name || 'Brand'}`,
            created_at: deal.created_at,
            href: `/deals/${deal.id}`,
          } satisfies ActivityItem
        })),
        ...(messages || []).map((msg) => ({
          id: `message-${msg.id}`,
          type: 'message',
          title: `New message from ${msg.sender_name || 'teammate'}`,
          description: (msg.content || 'New message').slice(0, 90),
          created_at: msg.created_at,
          href: `/deals/${msg.deal_id}`,
        }) satisfies ActivityItem),
        ...((notifications || []).map((item) => ({
          id: `notification-${item.id}`,
          type: 'notification',
          title: 'Notification',
          description: item.content || 'New update',
          created_at: item.created_at,
          href: item.link_url || '/notifications',
        }) satisfies ActivityItem)),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

      return NextResponse.json({
        role: 'creator',
        welcomeName,
        creator: {
          activeDeals: { count: creatorDeals.length, items: creatorDeals },
          applications: { count: applicationRows.length, items: creatorApplications },
          opportunities: { count: creatorOpportunities.length, items: creatorOpportunities },
          earnings: {
            total: totalEarned,
            thisMonth: earnedThisMonth,
            pending: pendingPayment,
          },
          activity,
        },
      })
    }

    if (!auth.brand?.id) {
      return NextResponse.json({
        role: 'brand',
        welcomeName,
        brand: {
          activeBriefs: { count: 0, items: [] },
          applicationsToReview: { count: 0, items: [] },
          spend: { total: 0, thisMonth: 0 },
          activity: (notifications || []).slice(0, 5).map((item) => ({
            id: `notification-${item.id}`,
            type: 'notification',
            title: 'Notification',
            description: item.content || 'New update',
            created_at: item.created_at,
            href: item.link_url || '/notifications',
          } satisfies ActivityItem)),
        },
      })
    }

    const brandId = auth.brand.id

    const [{ data: jobs }, { data: deals }] = await Promise.all([
      auth.admin
        .from('jobs')
        .select('id, title, status, created_at, applications(id)')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(40),
      auth.admin
        .from('deals')
        .select('id, status, budget, amount, created_at, jobs(id, title), creators(id, display_name, avatar_url)')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(40),
    ])

    const jobRows = jobs || []
    const dealRows = deals || []
    const jobIds = jobRows.map((job) => job.id)

    const { data: applications } = jobIds.length
      ? await auth.admin
        .from('applications')
        .select('id, status, message, created_at, job_id, creator_id, creators(id, display_name, avatar_url), jobs(id, title)')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })
        .limit(40)
      : {
        data: [] as Array<{
          id: string
          status: string
          message: string | null
          created_at: string
          job_id: string
          creator_id: string
          creators: { id: string; display_name: string; avatar_url: string | null } | null
          jobs: { id: string; title: string } | null
        }>,
      }

    const brandJobs = jobRows
      .filter((job) => ['open', 'filled'].includes(String(job.status || '')))
      .slice(0, 5)
      .map((job) => ({
        id: job.id,
        title: job.title,
        status: job.status,
        applicationCount: Array.isArray(job.applications) ? job.applications.length : 0,
      }))

    const reviewItems = (applications || [])
      .filter((application) => String(application.status || '') === 'pending')
      .slice(0, 5)
      .map((application) => {
        const creator = relationOne(application.creators)
        const job = relationOne(application.jobs)

        return {
          id: application.id,
          jobId: application.job_id,
          creatorId: application.creator_id,
          creatorName: creator?.display_name || 'Creator',
          creatorAvatar: creator?.avatar_url || null,
          jobTitle: job?.title || 'Untitled brief',
          pitchSnippet: (application.message || '').slice(0, 120),
        }
      })

    const totalSpent = dealRows.reduce((sum, deal) => {
      if (!isSettledStatus(String(deal.status || ''))) return sum
      return sum + asMoney(deal.budget ?? deal.amount)
    }, 0)

    const spentThisMonth = dealRows.reduce((sum, deal) => {
      if (!isSettledStatus(String(deal.status || ''))) return sum
      if (String(deal.created_at || '') < monthStart) return sum
      return sum + asMoney(deal.budget ?? deal.amount)
    }, 0)

    const dealIds = dealRows.map((deal) => deal.id)
    const { data: messageRows } = dealIds.length
      ? await auth.admin
        .from('messages')
        .select('id, deal_id, sender_id, content, created_at')
        .in('deal_id', dealIds)
        .order('created_at', { ascending: false })
        .limit(20)
      : { data: [] as MessageActivityRow[] }

    const messages = await hydrateMessageActivity(auth.admin, (messageRows || []) as MessageActivityRow[])

    const activity: ActivityItem[] = [
      ...(dealRows.slice(0, 8).map((deal) => {
        const job = relationOne(deal.jobs)
        const creator = relationOne(deal.creators)

        return {
          id: `deal-${deal.id}`,
          type: 'deal',
          title: `Deal ${String(deal.status || 'updated').replace(/_/g, ' ')}`,
          description: `${job?.title || 'Untitled deal'} · ${creator?.display_name || 'Creator'}`,
          created_at: deal.created_at,
          href: `/deals/${deal.id}`,
        } satisfies ActivityItem
      })),
      ...((applications || []).slice(0, 8).map((application) => {
        const creator = relationOne(application.creators)
        const job = relationOne(application.jobs)

        return {
          id: `application-${application.id}`,
          type: 'application',
          title: 'New application',
          description: `${creator?.display_name || 'Creator'} · ${job?.title || 'Untitled brief'}`,
          created_at: application.created_at,
          href: `/jobs/${application.job_id}/manage`,
        } satisfies ActivityItem
      })),
      ...(messages || []).map((msg) => ({
        id: `message-${msg.id}`,
        type: 'message',
        title: `New message from ${msg.sender_name || 'teammate'}`,
        description: (msg.content || 'New message').slice(0, 90),
        created_at: msg.created_at,
        href: `/deals/${msg.deal_id}`,
      }) satisfies ActivityItem),
      ...((notifications || []).map((item) => ({
        id: `notification-${item.id}`,
        type: 'notification',
        title: 'Notification',
        description: item.content || 'New update',
        created_at: item.created_at,
        href: item.link_url || '/notifications',
      }) satisfies ActivityItem)),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

    return NextResponse.json({
      role: 'brand',
      welcomeName,
      brand: {
        activeBriefs: { count: brandJobs.length, items: brandJobs },
        applicationsToReview: {
          count: (applications || []).filter((application) => String(application.status || '') === 'pending').length,
          items: reviewItems,
        },
        spend: {
          total: totalSpent,
          thisMonth: spentThisMonth,
        },
        activity,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load dashboard.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
