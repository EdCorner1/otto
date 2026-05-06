'use client'

import Link from 'next/link'
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Trash2,
  Upload,
  ShieldCheck,
  Timer,
  UserCircle2,
  Users,
  Video,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import {
  detectPortfolioPlatform,
  inferPortfolioThumbnail,
  isDirectVideoUrl,
  isRealPortfolioVideoUrl,
  MAX_PORTFOLIO_VIDEOS,
  MIN_PORTFOLIO_VIDEOS,
  MAX_VIDEO_SIZE_BYTES,
} from '@/lib/portfolio-media'

const TOTAL_STEPS = 5
const ONBOARDING_STORAGE_KEY = 'otto:onboarding:current-step'
const ONBOARDING_DRAFT_STORAGE_KEY = 'otto:onboarding:draft'
const MAX_PORTFOLIO_ITEMS = MAX_PORTFOLIO_VIDEOS
const MIN_PORTFOLIO_ITEMS = MIN_PORTFOLIO_VIDEOS
const MAX_BIO_LENGTH = 280
const MAX_VIDEO_SIZE = MAX_VIDEO_SIZE_BYTES

type Role = 'creator' | 'brand'

type PortfolioItem = {
  url: string
  platform: string
  caption: string
  thumbnailUrl?: string | null
}

type OnboardingDraft = {
  role: Role
  firstName: string
  lastName: string
  email: string
  avatarUrl: string
  handle: string
  bio: string
  nicheTags: string[]
  mainPlatform: string
  followerRange: string
  portfolioItems: PortfolioItem[]
  companyName: string
  companyDescription: string
  industry: string
  website: string
  brandDestination: '/dashboard' | '/jobs/new'
}

type ProgressResponse = {
  ok?: boolean
  error?: string
  role: Role
  currentStep: number
  nextStep: number
  totalSteps: number
  progress: number
  onboardingComplete: boolean
  creatorId: string | null
  brandId: string | null
  redirectTo: string | null
  skipped?: boolean
  profile?: Partial<OnboardingDraft>
}

const STEPS = [
  'Welcome',
  'Basic Info',
  'About You',
  'Portfolio',
  'Preview',
] as const

const MAIN_PLATFORMS = ['TikTok', 'Instagram', 'YouTube']
const FOLLOWER_RANGES = ['< 1K', '1K – 10K', '10K – 50K', '50K – 250K', '250K – 500K', '500K +']
const NICHE_OPTIONS = [
  'AI Tools & Products',
  'Tech & Gadgets',
  'Health & Fitness',
  'Travel',
  'Finance & Fintech',
  'Gaming',
  'Food & Lifestyle',
  'Fashion & Beauty',
  'Business & Startups',
  'Education',
] as const

function Header() {
  return (
    <header className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-[#e8e8e4] bg-white/85 px-5 py-3.5 shadow-lg shadow-black/[0.06] backdrop-blur-md">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-lg font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>Otto</span>
          <span className="h-2 w-2 rounded-full bg-[#ccff00]" />
        </Link>
        <span className="text-sm text-[#6b6b6b]">Onboarding</span>
      </div>
    </header>
  )
}

function stepTitle(step: number) {
  return STEPS[Math.min(Math.max(step - 1, 0), TOTAL_STEPS - 1)]
}

function normalizePlatformValue(value: string) {
  const normalized = value.trim().toLowerCase()
  if (normalized.includes('youtube')) return 'youtube'
  if (normalized.includes('instagram')) return 'instagram'
  if (normalized.includes('tiktok')) return 'tiktok'
  return normalized || 'tiktok'
}

function hasMinimumViablePortfolio(items: PortfolioItem[]) {
  return items.filter((item) => isRealPortfolioVideoUrl(item.url || '')).length >= MIN_PORTFOLIO_ITEMS
}

function normalizeOnboardingError(message: string, fallback: string) {
  const clean = (message || '').trim()
  if (!clean) return fallback
  if (clean.toLowerCase().includes('missing auth token') || clean.toLowerCase().includes('not authenticated')) {
    return 'Your session expired. Please sign in again.'
  }
  return clean
}

function blankDraft(): OnboardingDraft {
  return {
    role: 'creator',
    firstName: '',
    lastName: '',
    email: '',
    avatarUrl: '',
    handle: '',
    bio: '',
    nicheTags: [],
    mainPlatform: 'TikTok',
    followerRange: '',
    portfolioItems: [],
    companyName: '',
    companyDescription: '',
    industry: '',
    website: '',
    brandDestination: '/dashboard',
  }
}

function mergeDraft(base: OnboardingDraft, incoming?: Partial<OnboardingDraft> | null): OnboardingDraft {
  if (!incoming) return base

  return {
    ...base,
    ...incoming,
    role: incoming.role === 'brand' ? 'brand' : incoming.role === 'creator' ? 'creator' : base.role,
    nicheTags: Array.isArray(incoming.nicheTags)
      ? incoming.nicheTags.filter((tag): tag is string => typeof tag === 'string').slice(0, 10)
      : base.nicheTags,
    portfolioItems: Array.isArray(incoming.portfolioItems)
      ? incoming.portfolioItems
          .map((item) => ({
            url: String(item?.url || '').trim(),
            platform: String(item?.platform || '').trim(),
            caption: String(item?.caption || '').trim(),
            thumbnailUrl: typeof item?.thumbnailUrl === 'string' ? item.thumbnailUrl : null,
          }))
          .filter((item) => item.url)
          .slice(0, MAX_PORTFOLIO_ITEMS)
      : base.portfolioItems,
    brandDestination: incoming.brandDestination === '/jobs/new' ? '/jobs/new' : base.brandDestination,
  }
}

function ProgressBar({ step }: { step: number }) {
  const pct = Math.round((step / TOTAL_STEPS) * 100)

  return (
    <div className="mb-8 rounded-[28px] border border-[#e8e8e4] bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a9a9a]">Step {step} of {TOTAL_STEPS}</p>
          <h1 className="mt-1 text-[clamp(28px,5vw,38px)] leading-none text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
            {stepTitle(step)}
          </h1>
        </div>
        <div className="rounded-full bg-[#f5f5f2] px-3 py-1.5 text-xs font-semibold text-[#363535]">
          {pct}% complete
        </div>
      </div>
      <div className="h-2.5 w-full rounded-full bg-[#efefe9]">
        <div className="h-full rounded-full bg-[#ccff00] transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function PreviewPortfolioCard({ item }: { item: PortfolioItem }) {
  const thumbnail = item.thumbnailUrl || inferPortfolioThumbnail(item.url, item.platform)
  const isDirectVideo = isDirectVideoUrl(item.url)

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8e8e4] bg-white shadow-sm">
      <div className="relative aspect-[9/16] bg-[#111111]">
        {isDirectVideo ? (
          <video src={item.url} controls className="h-full w-full object-cover" />
        ) : thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt={item.caption || 'Portfolio video'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/70">Video sample</div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white">
          {item.platform || 'video'}
        </div>
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium text-[#363535]">{item.caption || 'Portfolio sample'}</p>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const portfolioInputRef = useRef<HTMLInputElement | null>(null)

  const [booting, setBooting] = useState(true)
  const [userId, setUserId] = useState('')
  const [creatorId, setCreatorId] = useState<string | null>(null)
  const [brandId, setBrandId] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<OnboardingDraft>(blankDraft())
  const [loadingMessage, setLoadingMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [portfolioUploading, setPortfolioUploading] = useState(false)
  const [error, setError] = useState('')

  const requestedRole = useMemo<Role>(() => {
    const raw = (searchParams.get('role') || searchParams.get('type') || '').trim().toLowerCase()
    return raw === 'brand' ? 'brand' : 'creator'
  }, [searchParams])

  const role = draft.role
  const creatorProfileUrl = creatorId ? `/creators/${creatorId}` : ''

  const persistLocalDraft = useCallback((nextDraft: OnboardingDraft, nextStep: number) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(nextDraft))
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, String(nextStep))
  }, [])

  const updateDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraft((prev) => {
      const next = mergeDraft(prev, patch)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(next))
      }
      return next
    })
  }, [])

  const saveStep = useCallback(async (targetStep: number, payload: Record<string, unknown> = {}) => {
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    if (!accessToken) {
      const redirectTo = encodeURIComponent(`/onboarding?role=${role}`)
      router.replace(`/login?redirectTo=${redirectTo}`)
      throw new Error('Your session expired. Please sign in again to continue onboarding.')
    }

    const response = await fetch(`/api/onboarding/step/${targetStep}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ role, ...payload }),
    })

    const result = (await response.json()) as ProgressResponse
    if (!response.ok || result.error) {
      throw new Error(result.error || 'Could not save onboarding progress.')
    }

    if (result.creatorId) setCreatorId(result.creatorId)
    if (result.brandId) setBrandId(result.brandId)

    return result
  }, [role, router, supabase])

  useEffect(() => {
    const boot = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser()
        const user = authData.user

        if (!user) {
          const redirectTo = encodeURIComponent(`/onboarding?role=${requestedRole}`)
          router.replace(`/login?redirectTo=${redirectTo}`)
          return
        }

        setUserId(user.id)

        const localDraft = typeof window !== 'undefined' ? window.localStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY) : null
        const localStep = typeof window !== 'undefined' ? Number(window.localStorage.getItem(ONBOARDING_STORAGE_KEY) || '1') : 1
        const parsedLocalDraft = localDraft ? JSON.parse(localDraft) as Partial<OnboardingDraft> : null

        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        if (!accessToken) {
          const redirectTo = encodeURIComponent(`/onboarding?role=${requestedRole}`)
          router.replace(`/login?redirectTo=${redirectTo}`)
          return
        }

        const response = await fetch('/api/onboarding/step/1', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        })

        const result = (await response.json()) as ProgressResponse
        if (!response.ok || result.error) {
          throw new Error(result.error || 'Could not load onboarding.')
        }

        if (result.onboardingComplete) {
          router.replace(result.redirectTo || '/dashboard')
          return
        }

        const serverDraft = mergeDraft(blankDraft(), result.profile)
        const localDraftWithRequestedRole = mergeDraft(blankDraft(), {
          ...(parsedLocalDraft || {}),
          role: parsedLocalDraft?.role || requestedRole,
        })
        const merged = mergeDraft(serverDraft, localDraftWithRequestedRole)
        const resumedStep = Math.min(TOTAL_STEPS, Math.max(result.nextStep || 1, localStep || 1))

        setDraft(merged)
        setCreatorId(result.creatorId)
        setBrandId(result.brandId)
        setStep(resumedStep)
        persistLocalDraft(merged, resumedStep)
      } catch (err) {
        setError(normalizeOnboardingError(err instanceof Error ? err.message : '', 'Could not load onboarding.'))
      } finally {
        setBooting(false)
      }
    }

    void boot()
  }, [persistLocalDraft, requestedRole, router, supabase])

  const creatorPreviewName = `${draft.firstName} ${draft.lastName}`.trim() || 'Your name'
  const creatorHandle = draft.handle.trim().replace(/^@+/, '') || 'your-handle'
  const viablePortfolioCount = useMemo(
    () => draft.portfolioItems.filter((item) => isRealPortfolioVideoUrl(item.url || '')).length,
    [draft.portfolioItems]
  )
  const canGoNext = useMemo(() => {
    if (step === 1) return Boolean(role)
    if (step === 2) {
      if (role === 'brand') return Boolean(draft.firstName.trim() && draft.lastName.trim() && draft.email.trim())
      return Boolean(draft.firstName.trim() && draft.lastName.trim() && draft.email.trim())
    }
    if (step === 3) {
      if (role === 'brand') return Boolean(draft.companyName.trim() && draft.companyDescription.trim())
      return Boolean(draft.bio.trim() && draft.nicheTags.length > 0 && draft.mainPlatform && draft.followerRange)
    }
    if (step === 4) {
      if (role === 'brand') return true
      return hasMinimumViablePortfolio(draft.portfolioItems)
    }
    return true
  }, [draft, role, step])

  const handleRoleContinue = async () => {
    setSubmitting(true)
    setError('')
    setLoadingMessage('Setting up your account…')

    try {
      const result = await saveStep(1)
      const nextStep = result.nextStep || 2
      setStep(nextStep)
      persistLocalDraft(draft, nextStep)
    } catch (err) {
      setError(normalizeOnboardingError(err instanceof Error ? err.message : '', 'Could not save step.'))
    } finally {
      setLoadingMessage('')
      setSubmitting(false)
    }
  }

  const handleNext = async () => {
    if (!canGoNext) return

    setSubmitting(true)
    setError('')

    try {
      if (step === 2) {
        setLoadingMessage('Saving your profile…')
        const result = await saveStep(2, {
          firstName: draft.firstName,
          lastName: draft.lastName,
          email: draft.email,
          avatarUrl: draft.avatarUrl,
          handle: draft.handle,
        })
        setStep(result.nextStep)
        persistLocalDraft(draft, result.nextStep)
        return
      }

      if (step === 3) {
        setLoadingMessage(role === 'brand' ? 'Saving your brand details…' : 'Saving your creator details…')
        const result = await saveStep(3, role === 'brand'
          ? {
              companyName: draft.companyName,
              companyDescription: draft.companyDescription,
              industry: draft.industry,
              website: draft.website,
            }
          : {
              bio: draft.bio,
              nicheTags: draft.nicheTags,
              mainPlatform: draft.mainPlatform,
              followerRange: draft.followerRange,
              handle: draft.handle,
            })
        setStep(result.nextStep)
        persistLocalDraft(draft, result.nextStep)
        return
      }

      if (step === 4) {
        setLoadingMessage(role === 'brand' ? 'Saving your destination…' : 'Saving your portfolio…')
        const result = await saveStep(4, role === 'brand'
          ? { brandDestination: draft.brandDestination }
          : {
              mainPlatform: draft.mainPlatform,
              portfolioItems: draft.portfolioItems.map((item) => ({
                url: item.url,
                platform: item.platform,
                caption: item.caption,
              })),
            })
        setStep(result.nextStep)
        persistLocalDraft(draft, result.nextStep)
        return
      }

      if (step === 5) {
        setLoadingMessage('Finishing onboarding…')
        const result = await saveStep(5, {
          handle: draft.handle,
          brandDestination: draft.brandDestination,
        })

        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(ONBOARDING_STORAGE_KEY)
          window.localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY)
        }

        router.push(result.redirectTo || '/dashboard')
      }
    } catch (err) {
      setError(normalizeOnboardingError(err instanceof Error ? err.message : '', 'Could not save step.'))
    } finally {
      setLoadingMessage('')
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    if (step <= 1 || submitting) return
    const nextStep = step - 1
    setStep(nextStep)
    persistLocalDraft(draft, nextStep)
  }

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !creatorId) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, WebP, GIF, or AVIF image.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile photos must be 5MB or smaller.')
      return
    }

    setAvatarUploading(true)
    setError('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('You need to sign in again before uploading.')

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/creators/${creatorId}/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })

      const result = (await response.json()) as { error?: string; avatarUrl?: string | null }
      if (!response.ok || !result.avatarUrl) {
        throw new Error(result.error || 'Could not upload profile photo.')
      }

      updateDraft({ avatarUrl: result.avatarUrl })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload profile photo.')
    } finally {
      setAvatarUploading(false)
    }
  }

  const uploadPortfolioVideo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !creatorId) return

    if (draft.portfolioItems.length >= MAX_PORTFOLIO_ITEMS) {
      setError(`You can add up to ${MAX_PORTFOLIO_ITEMS} portfolio videos.`)
      return
    }

    if (file.size > MAX_VIDEO_SIZE) {
      setError('Videos must be 100MB or smaller.')
      return
    }

    setPortfolioUploading(true)
    setError('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('You need to sign in again before uploading.')

      const uploadUrlResponse = await fetch('/api/portfolio/create-direct-upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      })

      const result = (await uploadUrlResponse.json()) as {
        error?: string
        uploadUrl?: string
        videoUrl?: string
        title?: string
        platform?: string
        thumbnailUrl?: string | null
      }

      if (!uploadUrlResponse.ok || !result.uploadUrl || !result.videoUrl) {
        throw new Error(result.error || 'Could not prepare video upload.')
      }

      const cloudflareUpload = await fetch(result.uploadUrl, {
        method: 'POST',
        body: (() => {
          const directFormData = new FormData()
          directFormData.append('file', file)
          return directFormData
        })(),
      })

      if (!cloudflareUpload.ok) {
        throw new Error('Cloudflare could not accept the video upload. Try a shorter MP4 or MOV file.')
      }

      updateDraft({
        portfolioItems: [
          ...draft.portfolioItems,
          {
            url: result.videoUrl,
            platform: result.platform || detectPortfolioPlatform(result.videoUrl, draft.mainPlatform),
            caption: result.title || file.name.replace(/\.[^.]+$/, ''),
            thumbnailUrl: result.thumbnailUrl || null,
          },
        ],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload video.')
    } finally {
      setPortfolioUploading(false)
    }
  }

  const removePortfolioItem = async (index: number) => {
    const item = draft.portfolioItems[index]
    if (!item) return

    const nextItems = draft.portfolioItems.filter((_, currentIndex) => currentIndex !== index)
    updateDraft({ portfolioItems: nextItems })

    if (!creatorId || !isDirectVideoUrl(item.url)) return

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) return

      await fetch('/api/portfolio/remove-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ creatorId, videoUrl: item.url }),
      })
    } catch {
      // Best-effort cleanup only.
    }
  }

  if (booting) {
    return <div className="min-h-screen bg-[#fafaf9]" />
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1c1e]">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-5 pb-12 pt-28 sm:px-8 onboarding-compact">
        <div className={`grid gap-6 lg:items-start ${role === 'creator' && step === 5 ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr)_380px]'}`}>
          <section>
            <ProgressBar step={step} />

            {error && (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="rounded-[30px] border border-[#e8e8e4] bg-white p-6 shadow-sm sm:p-8">
              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <p className="section-label mb-2">Welcome to Otto</p>
                    <h2 className="text-[clamp(34px,6vw,54px)] leading-none text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.05em' }}>
                      What kind of account do you want?
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm text-[#6b6b6b]">
                      Pick the setup that matches what you&apos;re here to do. You can change details later, but this shapes the experience from day one.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => updateDraft({ role: 'creator' })}
                      className={`rounded-[28px] border p-6 text-left transition-all ${role === 'creator' ? 'border-[#ccff00] bg-[#f7ffd4] shadow-[0_20px_50px_rgba(204,255,0,0.18)]' : 'border-[#e8e8e4] bg-white hover:border-[#c8c8c2] hover:-translate-y-0.5'}`}
                    >
                      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1c1c1e] text-white">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>Creator</h3>
                          <p className="mt-2 text-sm text-[#6b6b6b]">Build your profile, upload your work, and start getting in front of brands.</p>
                        </div>
                        {role === 'creator' && <Check className="h-5 w-5 text-[#1c1c1e]" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateDraft({ role: 'brand' })}
                      className={`rounded-[28px] border p-6 text-left transition-all ${role === 'brand' ? 'border-[#ccff00] bg-[#f7ffd4] shadow-[0_20px_50px_rgba(204,255,0,0.18)]' : 'border-[#e8e8e4] bg-white hover:border-[#c8c8c2] hover:-translate-y-0.5'}`}
                    >
                      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1c1c1e] text-white">
                        <BriefcaseBusiness className="h-5 w-5" />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>Brand</h3>
                          <p className="mt-2 text-sm text-[#6b6b6b]">Set up your company, land in the dashboard fast, and post your first job when you&apos;re ready.</p>
                        </div>
                        {role === 'brand' && <Check className="h-5 w-5 text-[#1c1c1e]" />}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div>
                    <p className="section-label mb-2">Basic Info</p>
                    <h2 className="text-[clamp(30px,5vw,46px)] leading-none text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
                      Let&apos;s make this feel real.
                    </h2>
                    <p className="mt-4 text-sm text-[#6b6b6b]">
                      Add the basics brands will expect right away. We&apos;ll save them before you move on.
                    </p>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[140px_minmax(0,1fr)]">
                    <div className="space-y-3">
                      <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-[28px] border border-[#e8e8e4] bg-[#f4f4ef] text-[#6b6b6b]">
                        {draft.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={draft.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <UserCircle2 className="h-12 w-12" />
                        )}
                      </div>

                      {role === 'creator' && (
                        <>
                          <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                            className="hidden"
                            onChange={uploadAvatar}
                            disabled={avatarUploading || submitting}
                          />
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={!creatorId || avatarUploading || submitting}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm font-medium text-[#1c1c1e] transition hover:border-[#ccff00] disabled:opacity-50"
                          >
                            {avatarUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {avatarUploading ? 'Uploading…' : draft.avatarUrl ? 'Change photo' : 'Upload photo'}
                          </button>
                        </>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[#363535]">First name</label>
                        <input
                          value={draft.firstName}
                          onChange={(event) => updateDraft({ firstName: event.target.value })}
                          placeholder="Ed"
                          className="w-full rounded-2xl border border-[#e8e8e4] px-4 py-3 outline-none transition focus:border-[#ccff00]"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[#363535]">Last name</label>
                        <input
                          value={draft.lastName}
                          onChange={(event) => updateDraft({ lastName: event.target.value })}
                          placeholder="Corner"
                          className="w-full rounded-2xl border border-[#e8e8e4] px-4 py-3 outline-none transition focus:border-[#ccff00]"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-[#363535]">Email</label>
                        <input
                          type="email"
                          value={draft.email}
                          onChange={(event) => updateDraft({ email: event.target.value })}
                          placeholder="you@company.com"
                          className="w-full rounded-2xl border border-[#e8e8e4] px-4 py-3 outline-none transition focus:border-[#ccff00]"
                        />
                      </div>
                      {role === 'creator' && (
                        <div className="sm:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-[#363535]">Profile handle</label>
                          <input
                            value={draft.handle}
                            onChange={(event) => updateDraft({ handle: event.target.value })}
                            placeholder="your-handle"
                            className="w-full rounded-2xl border border-[#e8e8e4] px-4 py-3 outline-none transition focus:border-[#ccff00]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && role === 'creator' && (
                <div className="space-y-8">
                  <div>
                    <p className="section-label mb-2">About You</p>
                    <h2 className="text-[clamp(30px,5vw,46px)] leading-none text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
                      Give brands a quick read on you.
                    </h2>
                    <p className="mt-4 text-sm text-[#6b6b6b]">
                      This is the part that helps Otto route better fits and makes your profile feel sharp from day one.
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="block text-sm font-medium text-[#363535]">Bio</label>
                      <span className="text-xs text-[#8a8a86]">{draft.bio.length}/{MAX_BIO_LENGTH}</span>
                    </div>
                    <textarea
                      value={draft.bio}
                      maxLength={MAX_BIO_LENGTH}
                      onChange={(event) => updateDraft({ bio: event.target.value })}
                      rows={5}
                      placeholder="I create sharp, useful content about AI tools, apps, and workflows that actually save time."
                      className="w-full rounded-[24px] border border-[#e8e8e4] px-4 py-3 outline-none transition focus:border-[#ccff00]"
                    />
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-medium text-[#363535]">Niche tags</label>
                    <div className="flex flex-wrap gap-3">
                      {NICHE_OPTIONS.map((tag) => {
                        const active = draft.nicheTags.includes(tag)
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => updateDraft({
                              nicheTags: active
                                ? draft.nicheTags.filter((entry) => entry !== tag)
                                : [...draft.nicheTags, tag].slice(0, 10),
                            })}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${active ? 'border-[#ccff00] bg-[#ccff00] text-[#1c1c1e]' : 'border-[#e8e8e4] bg-white text-[#4f4f4f] hover:border-[#c8c8c2]'}`}
                          >
                            {tag}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#363535]">Main platform</label>
                      <select
                        value={draft.mainPlatform}
                        onChange={(event) => updateDraft({ mainPlatform: event.target.value })}
                        className="w-full rounded-2xl border border-[#e8e8e4] px-4 py-3 outline-none transition focus:border-[#ccff00]"
                      >
                        {MAIN_PLATFORMS.map((platform) => (
                          <option key={platform} value={platform}>{platform}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#363535]">Follower count range</label>
                      <select
                        value={draft.followerRange}
                        onChange={(event) => updateDraft({ followerRange: event.target.value })}
                        className="w-full rounded-2xl border border-[#e8e8e4] px-4 py-3 outline-none transition focus:border-[#ccff00]"
                      >
                        <option value="">Select range</option>
                        {FOLLOWER_RANGES.map((range) => (
                          <option key={range} value={range}>{range}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && role === 'brand' && (
                <div className="space-y-8">
                  <div>
                    <p className="section-label mb-2">About Your Brand</p>
                    <h2 className="text-[clamp(30px,5vw,46px)] leading-none text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
                      Give Otto the context it needs.
                    </h2>
                    <p className="mt-4 text-sm text-[#6b6b6b]">
                      We&apos;ll use this to shape your dashboard and tee you up to post your first brief faster.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#363535]">Company name</label>
                      <input
                        value={draft.companyName}
                        onChange={(event) => updateDraft({ companyName: event.target.value })}
                        placeholder="Otto"
                        className="w-full rounded-2xl border border-[#e8e8e4] px-4 py-3 outline-none transition focus:border-[#ccff00]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#363535]">What do you do?</label>
                      <textarea
                        value={draft.companyDescription}
                        onChange={(event) => updateDraft({ companyDescription: event.target.value })}
                        rows={5}
                        placeholder="We help brands hire practical UGC creators for AI, SaaS, and tech products."
                        className="w-full rounded-[24px] border border-[#e8e8e4] px-4 py-3 outline-none transition focus:border-[#ccff00]"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[#363535]">Industry</label>
                        <input
                          value={draft.industry}
                          onChange={(event) => updateDraft({ industry: event.target.value })}
                          placeholder="AI / SaaS"
                          className="w-full rounded-2xl border border-[#e8e8e4] px-4 py-3 outline-none transition focus:border-[#ccff00]"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[#363535]">Website</label>
                        <input
                          value={draft.website}
                          onChange={(event) => updateDraft({ website: event.target.value })}
                          placeholder="https://ottougc.com"
                          className="w-full rounded-2xl border border-[#e8e8e4] px-4 py-3 outline-none transition focus:border-[#ccff00]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && role === 'creator' && (
                <div className="space-y-8">
                  <div>
                    <p className="section-label mb-2">Portfolio</p>
                    <h2 className="text-[clamp(30px,5vw,46px)] leading-none text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
                      Add the work you want brands to remember.
                    </h2>
                    <p className="mt-4 text-sm text-[#6b6b6b]">
                      Add at least {MIN_PORTFOLIO_ITEMS} valid portfolio videos to continue. You can upload up to {MAX_PORTFOLIO_ITEMS}. These videos shape first impressions on your public profile.
                    </p>
                  </div>

                  <div className="grid gap-3 rounded-[24px] border border-[#e8e8e4] bg-[#fcfcfa] p-4 sm:grid-cols-3">
                    {[
                      { icon: CheckCircle2, title: 'Clear opening', body: 'Hook in the first 2 seconds so brands instantly get the concept.' },
                      { icon: Timer, title: 'Tight pacing', body: 'Keep edits clean and fast so the product story lands quickly.' },
                      { icon: ShieldCheck, title: 'Proof of fit', body: 'Show range across product types and styles, not one repeated format.' },
                    ].map((item) => {
                      const Icon = item.icon
                      return (
                        <div key={item.title} className="rounded-2xl border border-[#ecece7] bg-white px-4 py-3">
                          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a8a86]">
                            <Icon className="h-3.5 w-3.5" />
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm text-[#4f4f49]">{item.body}</p>
                        </div>
                      )
                    })}
                  </div>

                  <div className="rounded-[28px] border border-dashed border-[#d7d7d1] bg-[#fbfbf8] p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-[#1c1c1e]">Portfolio uploads</p>
                        <p className="mt-1 text-sm text-[#6b6b6b]">MP4, MOV, WebM, or M4V · up to 100MB each · {draft.portfolioItems.length}/{MAX_PORTFOLIO_ITEMS} added · {viablePortfolioCount}/{MIN_PORTFOLIO_ITEMS} minimum ready</p>
                      </div>
                      <div>
                        <input
                          ref={portfolioInputRef}
                          type="file"
                          accept="video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.webm,.m4v"
                          className="hidden"
                          onChange={uploadPortfolioVideo}
                          disabled={portfolioUploading || draft.portfolioItems.length >= MAX_PORTFOLIO_ITEMS}
                        />
                        <button
                          type="button"
                          onClick={() => portfolioInputRef.current?.click()}
                          disabled={portfolioUploading || draft.portfolioItems.length >= MAX_PORTFOLIO_ITEMS}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1c1c1e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
                        >
                          {portfolioUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                          {portfolioUploading ? 'Uploading…' : 'Upload video'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {draft.portfolioItems.length > 0 ? (
                    <div className="space-y-4">
                      {viablePortfolioCount < MIN_PORTFOLIO_ITEMS && (
                        <div className="rounded-xl border border-[#e8e8e4] bg-[#fbfbf8] px-4 py-3 text-sm text-[#6b6b6b]">
                          Add at least {MIN_PORTFOLIO_ITEMS} valid portfolio videos to continue. Right now you have {viablePortfolioCount} valid video{viablePortfolioCount === 1 ? '' : 's'} ready.
                        </div>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {draft.portfolioItems.map((item, index) => (
                        <div key={`${item.url}-${index}`} className="space-y-3 rounded-[24px] border border-[#e8e8e4] bg-white p-3 shadow-sm">
                          <PreviewPortfolioCard item={item} />
                          <input
                            value={item.caption}
                            onChange={(event) => {
                              const nextItems = [...draft.portfolioItems]
                              nextItems[index] = { ...item, caption: event.target.value }
                              updateDraft({ portfolioItems: nextItems })
                            }}
                            placeholder="Add a short caption"
                            className="w-full rounded-2xl border border-[#e8e8e4] px-3 py-2.5 text-sm outline-none transition focus:border-[#ccff00]"
                          />
                          <button
                            type="button"
                            onClick={() => void removePortfolioItem(index)}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#ecece7] bg-[#fafaf8] px-3 py-2 text-sm font-medium text-[#5f5f58] transition hover:border-[#d8d8d1] hover:text-[#1c1c1e]"
                          >
                            <Trash2 className="h-4 w-4" /> Remove video
                          </button>
                        </div>
                      ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#e8e8e4] bg-[#fbfbf8] px-5 py-8 text-center text-sm text-[#6b6b6b]">
                      <p className="text-base font-semibold text-[#1c1c1e]">Your portfolio starts here.</p>
                      <p className="mt-2">Add at least {MIN_PORTFOLIO_ITEMS} valid portfolio videos to continue. Upload your best product demos, UGC examples, or client work so brands can actually get a proper read on your style.</p>
                    </div>
                  )}
                </div>
              )}

              {step === 4 && role === 'brand' && (
                <div className="space-y-8">
                  <div>
                    <p className="section-label mb-2">Where to next?</p>
                    <h2 className="text-[clamp(30px,5vw,46px)] leading-none text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
                      Choose your first landing spot.
                    </h2>
                    <p className="mt-4 text-sm text-[#6b6b6b]">
                      You can drop into the dashboard or jump straight into posting your first job.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      {
                        value: '/dashboard' as const,
                        title: 'Go to dashboard',
                        description: 'Land in Otto, explore creators, and get familiar before posting.',
                      },
                      {
                        value: '/jobs/new' as const,
                        title: 'Post first job',
                        description: 'Head straight into creating your first brief while the momentum is high.',
                      },
                    ].map((option) => {
                      const active = draft.brandDestination === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateDraft({ brandDestination: option.value })}
                          className={`rounded-[28px] border p-6 text-left transition ${active ? 'border-[#ccff00] bg-[#f7ffd4]' : 'border-[#e8e8e4] bg-white hover:border-[#c8c8c2]'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>{option.title}</h3>
                              <p className="mt-2 text-sm text-[#6b6b6b]">{option.description}</p>
                            </div>
                            {active && <Check className="h-5 w-5 text-[#1c1c1e]" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <p className="section-label mb-2">Review</p>
                    <h2 className="text-[clamp(30px,5vw,46px)] leading-none text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
                      {role === 'creator' ? 'Review your creator page.' : 'You’re ready to roll.'}
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm text-[#6b6b6b]">
                      {role === 'creator'
                        ? 'Check the basics before you finish. Brands will use this page to review your work.'
                        : 'Your setup is locked in. Finish onboarding and drop into the workflow you picked.'}
                    </p>
                  </div>

                  {role === 'creator' && creatorId ? (
                    <div className="space-y-5">
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="rounded-[28px] border border-[#e8e8e4] bg-white p-5 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a8a86]">Ready to publish</p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl bg-[#fbfbf8] p-4">
                              <p className="text-2xl font-semibold text-[#1c1c1e]">{viablePortfolioCount}</p>
                              <p className="mt-1 text-sm text-[#6b6b6b]">portfolio video{viablePortfolioCount === 1 ? '' : 's'}</p>
                            </div>
                            <div className="rounded-2xl bg-[#fbfbf8] p-4">
                              <p className="text-2xl font-semibold text-[#1c1c1e]">{draft.nicheTags.length}</p>
                              <p className="mt-1 text-sm text-[#6b6b6b]">niche tag{draft.nicheTags.length === 1 ? '' : 's'}</p>
                            </div>
                            <div className="rounded-2xl bg-[#fbfbf8] p-4">
                              <p className="text-base font-semibold text-[#1c1c1e]">{draft.mainPlatform || 'Platform set'}</p>
                              <p className="mt-1 text-sm text-[#6b6b6b]">main channel</p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[28px] border border-[#e8e8e4] bg-[#1c1c1e] p-5 text-white shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Public URL</p>
                          <p className="mt-3 break-all text-xl leading-tight" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>ottougc.com/{creatorHandle}</p>
                          <a href={creatorProfileUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#ccff00] px-4 py-3 text-sm font-semibold text-[#1c1c1e] transition hover:bg-[#d8ff47]">
                            Open profile
                          </a>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-[28px] border border-[#e8e8e4] bg-[#f5f5f2] shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-[#e8e8e4] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[#1c1c1e]">Profile preview</p>
                            <p className="text-xs text-[#8a8a86]">{creatorProfileUrl}</p>
                          </div>
                          <a href={creatorProfileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-[#d9d9d2] px-4 py-2 text-sm font-semibold text-[#1c1c1e] transition hover:bg-[#f7f7f5]">
                            Open in new tab
                          </a>
                        </div>
                        <iframe title="Creator profile preview" src={creatorProfileUrl} className="h-[680px] w-full bg-white" />
                      </div>
                    </div>
                  ) : role === 'creator' ? (
                    <div className="rounded-[28px] border border-[#e8e8e4] bg-[#fbfbf8] p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-[#e8e8e4] bg-white text-[#6b6b6b]">
                          {draft.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={draft.avatarUrl} alt={creatorPreviewName} className="h-full w-full object-cover" />
                          ) : (
                            <UserCircle2 className="h-8 w-8" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>{creatorPreviewName}</h3>
                            {draft.followerRange && <span className="rounded-full bg-[#ccff00] px-3 py-1 text-xs font-semibold text-[#1c1c1e]">{draft.followerRange}</span>}
                          </div>
                          <p className="mt-1 text-sm text-[#6b6b6b]">@{creatorHandle}</p>
                          <p className="mt-3 text-sm leading-relaxed text-[#4f4f4f]">{draft.bio || 'Your bio will appear here.'}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {draft.nicheTags.map((tag) => (
                              <span key={tag} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#363535] border border-[#e8e8e4]">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[28px] border border-[#e8e8e4] bg-[#fbfbf8] p-6">
                      <div className="space-y-3">
                        <p className="text-sm text-[#8a8a86]">Brand setup preview</p>
                        <h3 className="text-3xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
                          {draft.companyName || `${draft.firstName} ${draft.lastName}`.trim() || 'Your brand'}
                        </h3>
                        <p className="max-w-2xl text-sm leading-relaxed text-[#4f4f4f]">
                          {draft.companyDescription || 'Your company description will appear here.'}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {draft.industry && <span className="rounded-full border border-[#e8e8e4] bg-white px-3 py-1.5 text-xs font-medium text-[#363535]">{draft.industry}</span>}
                          <span className="rounded-full bg-[#ccff00] px-3 py-1.5 text-xs font-semibold text-[#1c1c1e]">
                            Next stop: {draft.brandDestination === '/jobs/new' ? 'Post first job' : 'Dashboard'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-10 flex items-center justify-between gap-4 border-t border-[#efefe9] pt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 1 || submitting}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#6b6b6b] transition hover:text-[#1c1c1e] disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>

                <button
                  type="button"
                  onClick={step === 1 ? () => void handleRoleContinue() : () => void handleNext()}
                  disabled={submitting || !canGoNext}
                  className="btn-primary px-6 py-3 text-sm disabled:opacity-60"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin" /> {loadingMessage || 'Saving…'}
                    </span>
                  ) : step === 5 ? (
                    role === 'creator' ? 'Finish & Go to Dashboard' : draft.brandDestination === '/jobs/new' ? 'Finish & Post First Job' : 'Finish & Go to Dashboard'
                  ) : (
                    <span className="inline-flex items-center gap-2">Next <ChevronRight className="h-4 w-4" /></span>
                  )}
                </button>
              </div>
            </div>
          </section>

          {!(role === 'creator' && step === 5) && (
          <aside className="space-y-4 lg:sticky lg:top-28">
            <div className="rounded-[28px] border border-[#e8e8e4] bg-white p-6 shadow-sm">
              <p className="section-label mb-2">What happens next</p>
              <h3 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>
                {role === 'creator' ? 'Your profile goes live fast.' : 'Your workspace opens fast.'}
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-[#5d5d58]">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#363535]" /> <span>Every step is saved so you don’t lose momentum.</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#363535]" /> <span>Close the tab and come back later. You’ll resume where you left off.</span></li>
                {role === 'creator' ? (
                  <>
                    <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#363535]" /> <span>Onboarding becomes a public profile brands can browse immediately.</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#363535]" /> <span>You get a live preview before landing in the dashboard.</span></li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#363535]" /> <span>Your company info is saved and routed into the right next step.</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#363535]" /> <span>You can post a job immediately or settle into the dashboard first.</span></li>
                  </>
                )}
              </ul>
            </div>

            {role === 'creator' && (
              <div className="rounded-[28px] border border-[#e8e8e4] bg-[#1c1c1e] p-6 text-white shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Live outcome</p>
                <p className="mt-3 text-3xl leading-none" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
                  ottougc.com/{creatorHandle}
                </p>
                <p className="mt-3 text-sm text-white/72">
                  We’ll send you to the dashboard with a success message once this is done.
                </p>
              </div>
            )}

            {role === 'brand' && (
              <div className="rounded-[28px] border border-[#e8e8e4] bg-[#1c1c1e] p-6 text-white shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Landing route</p>
                <p className="mt-3 text-3xl leading-none" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
                  {draft.brandDestination === '/jobs/new' ? 'Post first job' : 'Dashboard'}
                </p>
                <p className="mt-3 text-sm text-white/72">
                  We’ll carry this choice into the finish step so you land in the right place.
                </p>
              </div>
            )}
          </aside>
          )}
        </div>
      </main>
    </div>
  )
}
