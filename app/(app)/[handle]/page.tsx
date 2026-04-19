import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import PortfolioPageClient from './PortfolioPageClient'
import { getPublicCreatorPortfolioByHandle } from '@/lib/public-creator-portfolio'

const RESERVED_HANDLES = new Set([
  'dashboard',
  'messages',
  'notifications',
  'profile',
  'jobs',
  'live-campaigns',
  'search',
  'settings',
  'explore',
  'creators',
  'brands',
  'blog',
  'resources',
  'platform',
  'login',
  'signup',
  'onboarding',
  'ops',
  'ed',
  'auth',
  'api',
])

type RouteContext = { params: Promise<{ handle: string }> }

function normalizeHandle(value: string) {
  return value.trim().replace(/^@+/, '').toLowerCase()
}

function buildCanonicalUrl(handle: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://ottougc.com'
  return `${base.replace(/\/$/, '')}/${handle}`
}

async function getCurrentUserId() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.id || null
}

export async function generateMetadata({ params }: RouteContext): Promise<Metadata> {
  const { handle } = await params
  const normalizedHandle = normalizeHandle(handle)

  if (!normalizedHandle || RESERVED_HANDLES.has(normalizedHandle)) {
    return {}
  }

  const portfolio = await getPublicCreatorPortfolioByHandle(normalizedHandle)
  if (!portfolio) {
    return {
      title: 'Creator not found',
      robots: { index: false, follow: false },
    }
  }

  const canonical = buildCanonicalUrl(portfolio.handle)
  const description = (portfolio.bio || `${portfolio.fullName} on Otto`).slice(0, 160)

  return {
    title: `${portfolio.fullName} — Creator Portfolio`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'profile',
      url: canonical,
      title: `${portfolio.fullName} — Creator Portfolio`,
      description,
      images: portfolio.avatarUrl ? [{ url: portfolio.avatarUrl, alt: portfolio.fullName }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${portfolio.fullName} — Creator Portfolio`,
      description,
      images: portfolio.avatarUrl ? [portfolio.avatarUrl] : undefined,
    },
  }
}

export default async function PublicCreatorPortfolioPage({ params }: RouteContext) {
  const { handle } = await params
  const normalizedHandle = normalizeHandle(handle)

  if (!normalizedHandle || RESERVED_HANDLES.has(normalizedHandle)) {
    notFound()
  }

  const portfolio = await getPublicCreatorPortfolioByHandle(normalizedHandle)
  if (!portfolio) {
    notFound()
  }

  const currentUserId = await getCurrentUserId()
  const isOwner = currentUserId === portfolio.userId

  return <PortfolioPageClient portfolio={portfolio} isOwner={isOwner} />
}
