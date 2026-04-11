'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Step = 1 | 2 | 3
type Role = 'brand' | 'creator' | null

interface BrandForm {
  company_name: string
  website: string
  industry: string
  description: string
}

interface CreatorForm {
  display_name: string
  location: string
  bio: string
  hourly_rate: string
}

const headlineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-bricolage)',
  fontWeight: 600,
  fontSize: 'clamp(28px, 5vw, 40px)',
  lineHeight: 1.0,
  letterSpacing: '-4.5px',
  color: '#363535',
}

const industries = ['Tech', 'SaaS', 'AI Tools', 'Gadgets', 'Gaming', 'Other']

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1)
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      }
    }
    checkUser()
  }, [])

  // Brand form state
  const [brandForm, setBrandForm] = useState<BrandForm>({
    company_name: '',
    website: '',
    industry: '',
    description: '',
  })

  // Creator form state
  const [creatorForm, setCreatorForm] = useState<CreatorForm>({
    display_name: '',
    location: '',
    bio: '',
    hourly_rate: '',
  })

  const handleBrandSubmit = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Insert brand profile
    const { error: brandError } = await supabase.from('brands').insert({
      user_id: user.id,
      company_name: brandForm.company_name,
      website: brandForm.website,
      industry: brandForm.industry,
      description: brandForm.description,
    })

    if (brandError) {
      setError(brandError.message)
      setLoading(false)
      return
    }

    // Update user metadata with role
    const { error: metaError } = await supabase.auth.updateUser({
      data: { role: 'brand' },
    })

    if (metaError) {
      setError(metaError.message)
      setLoading(false)
      return
    }

    // Also update users table
    await supabase
      .from('users')
      .update({ role: 'brand' })
      .eq('id', user.id)

    setStep(3)
    setLoading(false)
  }

  const handleCreatorSubmit = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Insert creator profile
    const { error: creatorError } = await supabase.from('creators').insert({
      user_id: user.id,
      display_name: creatorForm.display_name,
      bio: creatorForm.bio,
      location: creatorForm.location,
      hourly_rate: creatorForm.hourly_rate ? parseFloat(creatorForm.hourly_rate) : null,
    })

    if (creatorError) {
      setError(creatorError.message)
      setLoading(false)
      return
    }

    // Update user metadata with role
    const { error: metaError } = await supabase.auth.updateUser({
      data: { role: 'creator' },
    })

    if (metaError) {
      setError(metaError.message)
      setLoading(false)
      return
    }

    // Also update users table
    await supabase
      .from('users')
      .update({ role: 'creator' })
      .eq('id', user.id)

    setStep(3)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Floating nav */}
      <header className="fixed top-4 left-4 right-4 z-50 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#e8e8e4]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold font-display tracking-tight text-[#363535] hover:opacity-80 transition-opacity"
          >
            Otto
            <span className="inline-block w-2 h-2 bg-[#ccff00] rounded-full mb-2" />
          </Link>
        </div>
      </header>

      <main className="pt-28 pb-20 max-w-2xl mx-auto px-6">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                s <= step ? 'bg-[#ccff00]' : 'bg-[#e8e8e4]'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {/* STEP 1: Role Selection */}
        {step === 1 && (
          <div className="space-y-8 fade-up">
            <div className="text-center">
              <p className="section-label mb-4">Step 1 of 3</p>
              <h1 style={headlineStyle}>Welcome to Otto.</h1>
              <p className="section-label mt-4">What kind of user are you?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Brand Card */}
              <button
                onClick={() => {
                  setRole('brand')
                  setStep(2)
                }}
                className="card card-hover flex flex-col items-start gap-4 text-left w-full cursor-pointer hover:border-[#ccff00] hover:shadow-[0_8px_32px_rgba(204,255,0,0.2)]"
              >
                <span className="text-3xl">🏢</span>
                <div>
                  <h2 className="font-display font-semibold text-lg text-[#363535] mb-1">
                    Brand
                  </h2>
                  <p className="text-sm text-[#6b6b6b]">
                    I&apos;run a tech company and want to hire UGC creators.
                  </p>
                </div>
              </button>

              {/* Creator Card */}
              <button
                onClick={() => {
                  setRole('creator')
                  setStep(2)
                }}
                className="card card-hover flex flex-col items-start gap-4 text-left w-full cursor-pointer hover:border-[#ccff00] hover:shadow-[0_8px_32px_rgba(204,255,0,0.2)]"
              >
                <span className="text-3xl">🎨</span>
                <div>
                  <h2 className="font-display font-semibold text-lg text-[#363535] mb-1">
                    Creator
                  </h2>
                  <p className="text-sm text-[#6b6b6b]">
                    I make tech UGC content and want to get paid.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2A: Brand Form */}
        {step === 2 && role === 'brand' && (
          <div className="space-y-8 fade-up">
            <div className="text-center">
              <p className="section-label mb-4">Step 2 of 3</p>
              <h1 style={headlineStyle}>Tell us about your brand.</h1>
              <p className="section-label mt-4">Help us match you with the right creators.</p>
            </div>

            <div className="card space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#363535] mb-2">
                  Company name
                </label>
                <input
                  type="text"
                  value={brandForm.company_name}
                  onChange={(e) =>
                    setBrandForm((p) => ({ ...p, company_name: e.target.value }))
                  }
                  placeholder="Acme Inc."
                  className="w-full px-4 py-3 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:border-[#ccff00] focus:ring-2 focus:ring-[#ccff00]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#363535] mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={brandForm.website}
                  onChange={(e) =>
                    setBrandForm((p) => ({ ...p, website: e.target.value }))
                  }
                  placeholder="https://acme.com"
                  className="w-full px-4 py-3 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:border-[#ccff00] focus:ring-2 focus:ring-[#ccff00]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#363535] mb-2">
                  Industry
                </label>
                <select
                  value={brandForm.industry}
                  onChange={(e) =>
                    setBrandForm((p) => ({ ...p, industry: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] focus:outline-none focus:border-[#ccff00] focus:ring-2 focus:ring-[#ccff00]/20 transition-all"
                >
                  <option value="">Select an industry</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#363535] mb-2">
                  What do you make?
                </label>
                <textarea
                  value={brandForm.description}
                  onChange={(e) =>
                    setBrandForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Briefly describe your product and what kind of UGC content you're looking for..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:border-[#ccff00] focus:ring-2 focus:ring-[#ccff00]/20 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setStep(1)}
                className="btn-ghost"
                disabled={loading}
              >
                ← Back
              </button>
              <button
                onClick={handleBrandSubmit}
                disabled={
                  loading ||
                  !brandForm.company_name ||
                  !brandForm.industry
                }
                className="btn-primary flex-1"
              >
                {loading ? 'Saving...' : 'Continue →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2B: Creator Form */}
        {step === 2 && role === 'creator' && (
          <div className="space-y-8 fade-up">
            <div className="text-center">
              <p className="section-label mb-4">Step 2 of 3</p>
              <h1 style={headlineStyle}>Set up your creator profile.</h1>
              <p className="section-label mt-4">Show brands who you are.</p>
            </div>

            <div className="card space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#363535] mb-2">
                  Display name
                </label>
                <input
                  type="text"
                  value={creatorForm.display_name}
                  onChange={(e) =>
                    setCreatorForm((p) => ({ ...p, display_name: e.target.value }))
                  }
                  placeholder="Your name or creator alias"
                  className="w-full px-4 py-3 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:border-[#ccff00] focus:ring-2 focus:ring-[#ccff00]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#363535] mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={creatorForm.location}
                  onChange={(e) =>
                    setCreatorForm((p) => ({ ...p, location: e.target.value }))
                  }
                  placeholder="City, Country"
                  className="w-full px-4 py-3 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:border-[#ccff00] focus:ring-2 focus:ring-[#ccff00]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#363535] mb-2">
                  One-line bio
                </label>
                <textarea
                  value={creatorForm.bio}
                  onChange={(e) =>
                    setCreatorForm((p) => ({ ...p, bio: e.target.value }))
                  }
                  placeholder="I make TikToks about AI tools with 500K+ views..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:border-[#ccff00] focus:ring-2 focus:ring-[#ccff00]/20 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#363535] mb-2">
                  Hourly rate (optional)
                </label>
                <input
                  type="number"
                  value={creatorForm.hourly_rate}
                  onChange={(e) =>
                    setCreatorForm((p) => ({ ...p, hourly_rate: e.target.value }))
                  }
                  placeholder="80"
                  min="0"
                  className="w-full px-4 py-3 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:border-[#ccff00] focus:ring-2 focus:ring-[#ccff00]/20 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setStep(1)}
                className="btn-ghost"
                disabled={loading}
              >
                ← Back
              </button>
              <button
                onClick={handleCreatorSubmit}
                disabled={
                  loading ||
                  !creatorForm.display_name ||
                  !creatorForm.bio
                }
                className="btn-primary flex-1"
              >
                {loading ? 'Saving...' : 'Continue →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Success */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center space-y-8 fade-up">
            <div className="w-20 h-20 bg-[#ccff00] rounded-full flex items-center justify-center">
              <span className="text-3xl">🎉</span>
            </div>
            <div>
              <h1 style={headlineStyle}>You&apos;re all set.</h1>
              <p className="section-label mt-4">
                Your profile is ready. Let&apos;s find you some work.
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-primary px-8 py-4 text-base"
            >
              Go to Dashboard →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
