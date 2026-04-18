'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Role = 'creator' | 'brand'

type CreatorForm = {
  name: string
  handle: string
  mainPlatform: string
  niche: string
  audienceSize: string
  portfolioLinks: string[]
}

function formatPlatformValue(value: string) {
  const normalized = value.trim().toLowerCase()
  if (normalized.includes('youtube')) return 'youtube'
  if (normalized.includes('instagram')) return 'instagram'
  if (normalized.includes('tiktok')) return 'tiktok'
  if (normalized.includes('twitter') || normalized === 'x') return 'twitter'
  return normalized.replace(/\s*\/\s*/g, '-').replace(/\s+/g, '-') || 'other'
}

type BrandForm = {
  companyName: string
  website: string
  description: string
  industry: string
  firstJobBrief: string
}

const TOTAL_STEPS = 4
const CREATOR_PLATFORMS = ['TikTok', 'Instagram', 'YouTube Shorts', 'X / Twitter', 'LinkedIn', 'Other']
const CREATOR_AUDIENCE_RANGES = ['< 1K', '1K - 10K', '10K - 50K', '50K - 250K', '250K+']
const BRAND_INDUSTRIES = ['SaaS', 'AI', 'Consumer Tech', 'Productivity', 'Gaming', 'E-commerce', 'Other']

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

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100)
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#6b6b6b]">
        <span>Step {step} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#e8e8e4]">
        <div className="h-full rounded-full bg-[#ccff00] transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  const [role, setRole] = useState<Role | null>(null)
  const [userId, setUserId] = useState('')
  const [loadingRole, setLoadingRole] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [creatorForm, setCreatorForm] = useState<CreatorForm>({
    name: '',
    handle: '',
    mainPlatform: '',
    niche: '',
    audienceSize: '',
    portfolioLinks: [''],
  })

  const [brandForm, setBrandForm] = useState<BrandForm>({
    companyName: '',
    website: '',
    description: '',
    industry: '',
    firstJobBrief: '',
  })

  const step = Math.min(Math.max(Number(searchParams.get('step') || '1'), 1), TOTAL_STEPS)

  function goToStep(nextStep: number) {
    router.push(`/onboarding?step=${Math.min(Math.max(nextStep, 1), TOTAL_STEPS)}`)
  }

  async function finishOnboarding() {
    if (!role || !userId) return
    setSubmitting(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        router.push('/login')
        return
      }

      const onboardingData = role === 'creator'
        ? {
            role,
            profile: {
              name: creatorForm.name,
              handle: creatorForm.handle,
              main_platform: formatPlatformValue(creatorForm.mainPlatform),
              niche: creatorForm.niche,
              audience_size: creatorForm.audienceSize,
              portfolio_links: creatorForm.portfolioLinks.filter((link) => link.trim()).slice(0, 3),
            },
          }
        : {
            role,
            profile: {
              company_name: brandForm.companyName,
              website: brandForm.website,
              description: brandForm.description,
              industry: brandForm.industry,
              first_job_brief: brandForm.firstJobBrief,
            },
          }

      const res = await fetch(`/api/users/${userId}/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(onboardingData),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Could not complete onboarding.')
      }

      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not complete onboarding.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    async function boot() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        setUserId(user.id)

        const metadataRole = user.user_metadata?.role
        if (metadataRole === 'creator' || metadataRole === 'brand') {
          setRole(metadataRole)
          return
        }

        const { data: row } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (row?.role === 'creator' || row?.role === 'brand') {
          setRole(row.role)
          return
        }

        setRole('creator')
      } catch {
        setError('Could not load your onboarding role.')
      } finally {
        setLoadingRole(false)
      }
    }

    void boot()
  }, [router, supabase])

  function StepActions({ onNext }: { onNext: () => void }) {
    return (
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => goToStep(step - 1)}
          disabled={step === 1}
          className="text-sm text-[#6b6b6b] hover:text-[#1c1c1e] disabled:opacity-40"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          {step < TOTAL_STEPS && (
            <button onClick={() => goToStep(step + 1)} className="text-sm text-[#6b6b6b] hover:text-[#1c1c1e]">
              Skip →
            </button>
          )}
          <button onClick={onNext} className="btn-primary px-6 py-3 text-sm">
            {step === TOTAL_STEPS ? (submitting ? 'Finishing...' : 'Finish onboarding') : 'Continue'}
          </button>
        </div>
      </div>
    )
  }

  if (loadingRole) {
    return <div className="min-h-screen bg-[#fafaf9]" />
  }

  const creatorStep = (
    <section key={`creator-step-${step}`} className="rounded-3xl border border-[#e8e8e4] bg-white p-6 sm:p-8 shadow-sm">
      {step === 1 && (
        <>
          <h1 className="mb-2 text-3xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>Profile basics</h1>
          <p className="mb-6 text-sm text-[#6b6b6b]">Tell brands who you are and where you create.</p>
          <div className="space-y-4">
            <input
              value={creatorForm.name}
              onChange={(e) => setCreatorForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Your name"
              className="w-full rounded-xl border border-[#e8e8e4] px-4 py-3 outline-none focus:border-[#ccff00]"
            />
            <input
              value={creatorForm.handle}
              onChange={(e) => setCreatorForm((prev) => ({ ...prev, handle: e.target.value }))}
              placeholder="@handle"
              className="w-full rounded-xl border border-[#e8e8e4] px-4 py-3 outline-none focus:border-[#ccff00]"
            />
            <select
              value={creatorForm.mainPlatform}
              onChange={(e) => setCreatorForm((prev) => ({ ...prev, mainPlatform: e.target.value }))}
              className="w-full rounded-xl border border-[#e8e8e4] px-4 py-3 outline-none focus:border-[#ccff00]"
            >
              <option value="">Main platform</option>
              {CREATOR_PLATFORMS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <StepActions onNext={() => goToStep(2)} />
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="mb-2 text-3xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>Niche & audience</h1>
          <p className="mb-6 text-sm text-[#6b6b6b]">Help us route better opportunities your way.</p>
          <div className="space-y-4">
            <input
              value={creatorForm.niche}
              onChange={(e) => setCreatorForm((prev) => ({ ...prev, niche: e.target.value }))}
              placeholder="e.g. AI tools, productivity apps"
              className="w-full rounded-xl border border-[#e8e8e4] px-4 py-3 outline-none focus:border-[#ccff00]"
            />
            <select
              value={creatorForm.audienceSize}
              onChange={(e) => setCreatorForm((prev) => ({ ...prev, audienceSize: e.target.value }))}
              className="w-full rounded-xl border border-[#e8e8e4] px-4 py-3 outline-none focus:border-[#ccff00]"
            >
              <option value="">Audience size</option>
              {CREATOR_AUDIENCE_RANGES.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <StepActions onNext={() => goToStep(3)} />
        </>
      )}

      {step === 3 && (
        <>
          <h1 className="mb-2 text-3xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>Demo video links</h1>
          <p className="mb-6 text-sm text-[#6b6b6b]">Add up to 3 links to your best videos. You can paste YouTube, Vimeo, TikTok, Instagram, or a direct video URL.</p>

          <div className="space-y-3">
            {creatorForm.portfolioLinks.map((link, idx) => (
              <input
                key={`link-${idx}`}
                value={link}
                onChange={(e) => {
                  const next = [...creatorForm.portfolioLinks]
                  next[idx] = e.target.value
                  setCreatorForm((prev) => ({ ...prev, portfolioLinks: next }))
                }}
                placeholder={`Video link ${idx + 1}`}
                className="w-full rounded-xl border border-[#e8e8e4] px-4 py-3 outline-none focus:border-[#ccff00]"
              />
            ))}
          </div>

          {creatorForm.portfolioLinks.length < 3 && (
            <button
              onClick={() => setCreatorForm((prev) => ({ ...prev, portfolioLinks: [...prev.portfolioLinks, ''] }))}
              className="mt-3 text-sm text-[#1c1c1e] underline"
            >
              + Add another video link
            </button>
          )}

          <StepActions onNext={() => goToStep(4)} />
        </>
      )}

      {step === 4 && (
        <>
          <h1 className="mb-2 text-3xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>Ready to go ✦</h1>
          <p className="mb-6 text-sm text-[#6b6b6b]">We&apos;ll save your onboarding and take you straight to your dashboard.</p>

          <div className="rounded-2xl border border-[#e8e8e4] bg-[#fafaf9] p-4 text-sm text-[#363535] space-y-1">
            <p><span className="font-semibold">Name:</span> {creatorForm.name || '-'}</p>
            <p><span className="font-semibold">Handle:</span> {creatorForm.handle || '-'}</p>
            <p><span className="font-semibold">Platform:</span> {creatorForm.mainPlatform || '-'}</p>
            <p><span className="font-semibold">Niche:</span> {creatorForm.niche || '-'}</p>
            <p><span className="font-semibold">Audience:</span> {creatorForm.audienceSize || '-'}</p>
          </div>

          <StepActions onNext={finishOnboarding} />
        </>
      )}
    </section>
  )

  const brandStep = (
    <section key={`brand-step-${step}`} className="rounded-3xl border border-[#e8e8e4] bg-white p-6 sm:p-8 shadow-sm">
      {step === 1 && (
        <>
          <h1 className="mb-2 text-3xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>Company basics</h1>
          <p className="mb-6 text-sm text-[#6b6b6b]">Set up your brand profile in under a minute.</p>
          <div className="space-y-4">
            <input
              value={brandForm.companyName}
              onChange={(e) => setBrandForm((prev) => ({ ...prev, companyName: e.target.value }))}
              placeholder="Company name"
              className="w-full rounded-xl border border-[#e8e8e4] px-4 py-3 outline-none focus:border-[#ccff00]"
            />
            <input
              value={brandForm.website}
              onChange={(e) => setBrandForm((prev) => ({ ...prev, website: e.target.value }))}
              placeholder="Website"
              className="w-full rounded-xl border border-[#e8e8e4] px-4 py-3 outline-none focus:border-[#ccff00]"
            />
            <textarea
              value={brandForm.description}
              onChange={(e) => setBrandForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="What your company does"
              rows={4}
              className="w-full rounded-xl border border-[#e8e8e4] px-4 py-3 outline-none focus:border-[#ccff00]"
            />
          </div>
          <StepActions onNext={() => goToStep(2)} />
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="mb-2 text-3xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>Industry</h1>
          <p className="mb-6 text-sm text-[#6b6b6b]">Choose the space your brand is in.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {BRAND_INDUSTRIES.map((industry) => (
              <button
                key={industry}
                onClick={() => setBrandForm((prev) => ({ ...prev, industry }))}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                  brandForm.industry === industry
                    ? 'border-[#ccff00] bg-[#ccff00]/20 text-[#1c1c1e]'
                    : 'border-[#e8e8e4] bg-white text-[#363535] hover:border-[#1c1c1e]'
                }`}
              >
                {industry}
              </button>
            ))}
          </div>
          <StepActions onNext={() => goToStep(3)} />
        </>
      )}

      {step === 3 && (
        <>
          <h1 className="mb-2 text-3xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>First job brief (optional)</h1>
          <p className="mb-6 text-sm text-[#6b6b6b]">You can skip this now and post later from your dashboard.</p>
          <textarea
            value={brandForm.firstJobBrief}
            onChange={(e) => setBrandForm((prev) => ({ ...prev, firstJobBrief: e.target.value }))}
            placeholder="What type of creator/content are you looking for?"
            rows={6}
            className="w-full rounded-xl border border-[#e8e8e4] px-4 py-3 outline-none focus:border-[#ccff00]"
          />
          <StepActions onNext={() => goToStep(4)} />
        </>
      )}

      {step === 4 && (
        <>
          <h1 className="mb-2 text-3xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>You&apos;re ready ✦</h1>
          <p className="mb-6 text-sm text-[#6b6b6b]">We&apos;ll save this and bring you into your dashboard.</p>

          <div className="rounded-2xl border border-[#e8e8e4] bg-[#fafaf9] p-4 text-sm text-[#363535] space-y-1">
            <p><span className="font-semibold">Company:</span> {brandForm.companyName || '-'}</p>
            <p><span className="font-semibold">Website:</span> {brandForm.website || '-'}</p>
            <p><span className="font-semibold">Industry:</span> {brandForm.industry || '-'}</p>
            <p><span className="font-semibold">Job brief:</span> {brandForm.firstJobBrief ? 'Added' : 'Skipped'}</p>
          </div>

          <StepActions onNext={finishOnboarding} />
        </>
      )}
    </section>
  )

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1c1e]">
      <Header />
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-5 pb-10 pt-28 sm:px-8">
        <div className="w-full">
          <ProgressBar step={step} total={TOTAL_STEPS} />

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!role ? (
            <div className="rounded-3xl border border-[#e8e8e4] bg-white p-8">
              <p className="text-sm text-[#6b6b6b]">Couldn&apos;t detect a role from your account metadata. Choose one to continue.</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button onClick={() => setRole('creator')} className="rounded-xl border border-[#e8e8e4] bg-white px-4 py-3 text-left hover:border-[#ccff00]">Creator</button>
                <button onClick={() => setRole('brand')} className="rounded-xl border border-[#e8e8e4] bg-white px-4 py-3 text-left hover:border-[#ccff00]">Brand</button>
              </div>
            </div>
          ) : role === 'creator' ? creatorStep : brandStep}
        </div>
      </main>
    </div>
  )
}
