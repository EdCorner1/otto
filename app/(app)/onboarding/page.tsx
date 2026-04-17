'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── STEP COMPONENTS ─────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < current ? 'bg-[#ccff00] text-[#1c1c1c]' : i === current ? 'bg-[#363535] text-white' : 'bg-[#e8e8e4] text-[#9a9a9a]'}`}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && <div className={`w-8 h-0.5 ${i < current ? 'bg-[#ccff00]' : 'bg-[#e8e8e4]'}`} />}
        </div>
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<'brand' | 'creator' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ─── BRAND FORM STATE ───────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [brand, setBrand] = useState({ company_name: '', website: '', industry: 'Tech', description: '', audience: '', content_types: [] as string[], budget_range: '£250–500', platforms: [] as string[] })

  const brandContentTypes = ['UGC Ads', 'Product Reviews', 'Tutorials', 'Unboxing', 'Brand Awareness', 'Testimonials']
  const brandPlatforms = ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'YouTube', 'Twitter/X', 'Other']
  const brandBudgetRanges = ['£100–250', '£250–500', '£500–1,000', '£1,000–2,500', '£2,500–5,000', '£5,000+']
  const brandStepTotal = 4
  const toggleArrayItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]

  // ─── CREATOR FORM STATE ────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [creator, setCreator] = useState({
    display_name: '',
    headline: '',
    bio: '',
    location: '',
    hourly_rate: '',
    website: '',
  })
  const [skillsCsv, setSkillsCsv] = useState('')
  const [experienceSummary, setExperienceSummary] = useState('')
  const [hobbiesCsv, setHobbiesCsv] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [socials, setSocials] = useState([
    { platform: 'tiktok', url: '' },
    { platform: 'youtube', url: '' },
    { platform: 'instagram', url: '' },
    { platform: 'twitter', url: '' },
    { platform: 'other', url: '' },
  ])
  const [portfolioItems, setPortfolioItems] = useState<Array<{ type: 'video' | 'image'; url: string; caption: string }>>([])
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [videoUploadProgress, setVideoUploadProgress] = useState('')
  const [addingPortfolio, setAddingPortfolio] = useState(false)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const primarySocialCount = socials.filter(s => ['tiktok', 'instagram', 'youtube'].includes(s.platform) && s.url.trim()).length

  // ─── STEP 0: ROLE SELECTION ─────────────────────────
  if (step === 0) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          {/* Floating nav */}
          <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-lg font-extrabold font-display" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-1px', color: '#363535' }}>Otto</span>
              <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
            </Link>
          </nav>

          <div className="pt-24">
            <h1 className="text-4xl font-display mb-3" style={{ fontSize: 'clamp(32px, 6vw, 48px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
              Welcome to Otto.
            </h1>
            <p className="text-[#6b6b6b] text-lg mb-10">What kind of user are you?</p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setRole('brand'); setStep(1); }}
                className="p-8 bg-white border-2 border-[#e8e8e4] rounded-2xl text-left hover:border-[#ccff00] hover:-translate-y-0.5 hover:shadow-lg transition-all group"
              >
                <div className="text-3xl mb-4">🏢</div>
                <div className="font-bold text-lg text-[#363535] mb-1" style={{ fontFamily: 'var(--font-bricolage)' }}>Brand</div>
                <div className="text-sm text-[#6b6b6b]">I want to hire creators for UGC content</div>
              </button>
              <button
                onClick={() => { setRole('creator'); setStep(1); }}
                className="p-8 bg-white border-2 border-[#e8e8e4] rounded-2xl text-left hover:border-[#ccff00] hover:-translate-y-0.5 hover:shadow-lg transition-all group"
              >
                <div className="text-3xl mb-4">🎬</div>
                <div className="font-bold text-lg text-[#363535] mb-1" style={{ fontFamily: 'var(--font-bricolage)' }}>Creator</div>
                <div className="text-sm text-[#6b6b6b]">I create UGC content for tech brands</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── BRAND ONBOARDING ──────────────────────────────
  if (role === 'brand') {
    // Step 1: Company info
    if (step === 1) {
      return (
        <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6">
          <div className="w-full max-w-lg">
            <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-display" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-1px', color: '#363535' }}>Otto</span>
                <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
              </Link>
            </nav>
            <div className="pt-24">
              <StepIndicator current={0} total={brandStepTotal} />
              <button onClick={() => { setRole(null); setStep(0); }} className="text-sm text-[#6b6b6b] hover:text-[#363535] mb-6 flex items-center gap-1">← Back</button>
              <h1 className="text-4xl font-display mb-2" style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
                What brand are you?
              </h1>
              <p className="text-[#6b6b6b] mb-8">Let&apos;s start with the basics.</p>

              {error && <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#363535] mb-1.5">Company name *</label>
                  <input type="text" value={brand.company_name} onChange={e => setBrand({ ...brand, company_name: e.target.value })} placeholder="Raycast" required className="w-full px-4 py-3.5 bg-white border border-[#e8e8e4] rounded-xl text-[#363535] placeholder-[#9a9a9a] transition-all focus:outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/[0.07]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#363535] mb-1.5">Website</label>
                  <input type="url" value={brand.website} onChange={e => setBrand({ ...brand, website: e.target.value })} placeholder="https://raycast.com" className="w-full px-4 py-3.5 bg-white border border-[#e8e8e4] rounded-xl text-[#363535] placeholder-[#9a9a9a] transition-all focus:outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/[0.07]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#363535] mb-1.5">Industry *</label>
                  <select value={brand.industry} onChange={e => setBrand({ ...brand, industry: e.target.value })} className="w-full px-4 py-3.5 bg-white border border-[#e8e8e4] rounded-xl text-[#363535] transition-all focus:outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/[0.07]">
                    <option>Tech</option><option>SaaS</option><option>AI Tools</option><option>Gadgets</option><option>Gaming</option><option>Finance</option><option>Health & Fitness</option><option>Travel</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#363535] mb-1.5">What do you make?</label>
                  <textarea value={brand.description} onChange={e => setBrand({ ...brand, description: e.target.value })} placeholder="A fast, keyboard-first launcher for macOS..." rows={3} className="w-full px-4 py-3.5 bg-white border border-[#e8e8e4] rounded-xl text-[#363535] placeholder-[#9a9a9a] transition-all focus:outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/[0.07] resize-none" />
                </div>
                <button
                  onClick={() => {
                    if (!brand.company_name.trim()) { setError('Company name is required.'); return; }
                    setError(''); setStep(2);
                  }}
                  className="btn-primary w-full py-4 text-base disabled:opacity-60 mt-2"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Step 2: Content types & platforms
    if (step === 2) {
      return (
        <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6">
          <div className="w-full max-w-lg">
            <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-display" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-1px', color: '#363535' }}>Otto</span>
                <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
              </Link>
            </nav>
            <div className="pt-24">
              <StepIndicator current={1} total={brandStepTotal} />
              <button onClick={() => setStep(1)} className="text-sm text-[#6b6b6b] hover:text-[#363535] mb-6 flex items-center gap-1">← Back</button>
              <h1 className="text-4xl font-display mb-2" style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
                How do you want to create?
              </h1>
              <p className="text-[#6b6b6b] mb-6">Pick the content formats you work with.</p>

              {error && <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

              <div className="mb-5">
                <label className="block text-sm font-semibold text-[#363535] mb-2">Content types * <span className="font-normal text-[#9a9a9a]">(select all that apply)</span></label>
                <div className="flex flex-wrap gap-2">
                  {brandContentTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setBrand({ ...brand, content_types: toggleArrayItem(brand.content_types, type) })}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${brand.content_types.includes(type) ? 'bg-[#ccff00] border-[#ccff00] text-[#1c1c1c]' : 'bg-white border-[#e8e8e4] text-[#6b6b6b] hover:border-[#363535]'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold text-[#363535] mb-2">Platforms * <span className="font-normal text-[#9a9a9a]">(select all that apply)</span></label>
                <div className="flex flex-wrap gap-2">
                  {brandPlatforms.map(p => (
                    <button
                      key={p}
                      onClick={() => setBrand({ ...brand, platforms: toggleArrayItem(brand.platforms, p) })}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${brand.platforms.includes(p) ? 'bg-[#ccff00] border-[#ccff00] text-[#1c1c1c]' : 'bg-white border-[#e8e8e4] text-[#6b6b6b] hover:border-[#363535]'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#363535] mb-1.5">Typical budget range</label>
                <div className="flex flex-wrap gap-2">
                  {brandBudgetRanges.map(range => (
                    <button
                      key={range}
                      onClick={() => setBrand({ ...brand, budget_range: range })}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${brand.budget_range === range ? 'bg-[#ccff00] border-[#ccff00] text-[#1c1c1c]' : 'bg-white border-[#e8e8e4] text-[#6b6b6b] hover:border-[#363535]'}`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  if (brand.content_types.length === 0 || brand.platforms.length === 0) {
                    setError('Please select at least one content type and one platform.');
                    return;
                  }
                  setError(''); setStep(3);
                }}
                className="btn-primary w-full py-4 text-base"
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Step 3: Audience & posting schedule
    if (step === 3) {
      return (
        <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6">
          <div className="w-full max-w-lg">
            <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-display" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-1px', color: '#363535' }}>Otto</span>
                <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
              </Link>
            </nav>
            <div className="pt-24">
              <StepIndicator current={2} total={brandStepTotal} />
              <button onClick={() => setStep(2)} className="text-sm text-[#6b6b6b] hover:text-[#363535] mb-6 flex items-center gap-1">← Back</button>
              <h1 className="text-4xl font-display mb-2" style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
                Who are you reaching?
              </h1>
              <p className="text-[#6b6b6b] mb-8">This helps us match you with the right creators.</p>

              {error && <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#363535] mb-1.5">Target audience</label>
                  <input type="text" value={brand.audience} onChange={e => setBrand({ ...brand, audience: e.target.value })} placeholder="e.g. Developers and designers aged 20–35 who love productivity tools" className="w-full px-4 py-3.5 bg-white border border-[#e8e8e4] rounded-xl text-[#363535] placeholder-[#9a9a9a] transition-all focus:outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/[0.07]" />
                </div>
                <button
                  onClick={() => { setError(''); setStep(4); }}
                  className="btn-primary w-full py-4 text-base"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Step 4: Review & complete
    if (step === 4) {
      return (
        <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6">
          <div className="w-full max-w-lg">
            <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-display" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-1px', color: '#363535' }}>Otto</span>
                <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
              </Link>
            </nav>
            <div className="pt-24">
              <StepIndicator current={3} total={brandStepTotal} />
              <button onClick={() => setStep(3)} className="text-sm text-[#6b6b6b] hover:text-[#363535] mb-6 flex items-center gap-1">← Back</button>
              <h1 className="text-4xl font-display mb-2" style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
                You&apos;re all set.
              </h1>
              <p className="text-[#6b6b6b] mb-8">Review your brand profile before we get started.</p>

              {error && <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

              <div className="bg-white border border-[#e8e8e4] rounded-xl p-5 mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b6b6b]">Company</span>
                  <span className="text-sm font-semibold text-[#363535]">{brand.company_name}</span>
                </div>
                {brand.website && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6b6b6b]">Website</span>
                    <span className="text-sm text-[#363535]">{brand.website}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b6b6b]">Industry</span>
                  <span className="text-sm text-[#363535]">{brand.industry}</span>
                </div>
                {brand.description && (
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-[#6b6b6b]">About</span>
                    <span className="text-sm text-[#363535] text-right">{brand.description}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b6b6b]">Content types</span>
                  <div className="flex flex-wrap gap-1 justify-end">{brand.content_types.map(t => <span key={t} className="text-xs px-2 py-0.5 bg-[#f0f0ec] rounded-full text-[#6b6b6b]">{t}</span>)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b6b6b]">Platforms</span>
                  <div className="flex flex-wrap gap-1 justify-end">{brand.platforms.map(p => <span key={p} className="text-xs px-2 py-0.5 bg-[#f0f0ec] rounded-full text-[#6b6b6b]">{p}</span>)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b6b6b]">Budget range</span>
                  <span className="text-sm text-[#363535]">{brand.budget_range}</span>
                </div>
              </div>

              <button
                onClick={async () => {
                  setLoading(true); setError('');
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) { router.push('/login'); return; }
                    const { error: brandError } = await supabase.from('brands').insert([{
                      user_id: user.id,
                      company_name: brand.company_name,
                      website: brand.website || null,
                      industry: brand.industry,
                      bio: brand.description || null,
                      audience: brand.audience || null,
                      content_types: brand.content_types,
                      platforms: brand.platforms,
                      budget_range: brand.budget_range,
                    }]);
                    if (brandError) throw brandError;
                    await supabase.from('users').update({ role: 'brand' }).eq('id', user.id);
                    router.push('/dashboard');
                  } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : 'Something went wrong.');
                  } finally { setLoading(false); }
                }}
                disabled={loading}
                className="btn-primary w-full py-4 text-base disabled:opacity-60"
              >
                {loading ? 'Setting up...' : 'Launch brand profile →'}
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  // ─── CREATOR ONBOARDING ─────────────────────────────
  // Steps: 1=basics, 2=photo, 3=socials, 4=portfolio, 5=done

  if (role === 'creator') {
    const TOTAL_STEPS = 5

    // Step 1: Basic profile
    if (step === 1) {
      return (
        <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6">
          <div className="w-full max-w-lg">
            <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-display" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-1px', color: '#363535' }}>Otto</span>
                <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
              </Link>
            </nav>
            <div className="pt-24">
              <StepIndicator current={step} total={TOTAL_STEPS} />
              <button onClick={() => setStep(0)} className="text-sm text-[#6b6b6b] hover:text-[#363535] mb-6 flex items-center gap-1">← Back</button>
              <h1 className="text-4xl font-display mb-2" style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
                Set up your profile.
              </h1>
              <p className="text-[#6b6b6b] mb-8">This is how brands will find you.</p>

              {error && <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#363535] mb-1.5">Display name *</label>
                  <input type="text" value={creator.display_name} onChange={e => setCreator({ ...creator, display_name: e.target.value })} placeholder="Alex Chen" required className="w-full px-4 py-3.5 bg-white border border-[#e8e8e4] rounded-xl text-[#363535] placeholder-[#9a9a9a] transition-all focus:outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/[0.07]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#363535] mb-1.5">Headline * <span className="font-normal text-[#9a9a9a]">(one line — what you do)</span></label>
                  <input type="text" value={creator.headline} onChange={e => setCreator({ ...creator, headline: e.target.value })} placeholder="Tech creator specializing in AI tools & productivity" maxLength={80} required className="w-full px-4 py-3.5 bg-white border border-[#e8e8e4] rounded-xl text-[#363535] placeholder-[#9a9a9a] transition-all focus:outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/[0.07]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#363535] mb-1.5">Why should a brand work with you? * <span className="font-normal text-[#9a9a9a]">(short bio / why me)</span></label>
                  <textarea value={creator.bio} onChange={e => setCreator({ ...creator, bio: e.target.value })} placeholder="I make creator-led videos for AI tools, apps, and productivity brands. My content is quick to ship, product-first, and built to feel native on TikTok and Shorts." rows={4} required className="w-full px-4 py-3.5 bg-white border border-[#e8e8e4] rounded-xl text-[#363535] placeholder-[#9a9a9a] transition-all focus:outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/[0.07] resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#363535] mb-1.5">Portfolio link * <span className="font-normal text-[#9a9a9a]">(drive, notion, website or reel)</span></label>
                  <input type="url" value={creator.website} onChange={e => setCreator({ ...creator, website: e.target.value })} placeholder="https://yourportfolio.com" required className="w-full px-4 py-3.5 bg-white border border-[#e8e8e4] rounded-xl text-[#363535] placeholder-[#9a9a9a] transition-all focus:outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/[0.07]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#363535] mb-1.5">Location</label>
                    <input type="text" value={creator.location} onChange={e => setCreator({ ...creator, location: e.target.value })} placeholder="London, UK" className="w-full px-4 py-3.5 bg-white border border-[#e8e8e4] rounded-xl text-[#363535] placeholder-[#9a9a9a] transition-all focus:outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/[0.07]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#363535] mb-1.5">Hourly rate <span className="font-normal text-[#9a9a9a]">(£, optional)</span></label>
                    <input type="number" value={creator.hourly_rate} onChange={e => setCreator({ ...creator, hourly_rate: e.target.value })} placeholder="150" min="0" className="w-full px-4 py-3.5 bg-white border border-[#e8e8e4] rounded-xl text-[#363535] placeholder-[#9a9a9a] transition-all focus:outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/[0.07]" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#363535] mb-1.5">Skills * <span className="font-normal text-[#9a9a9a]">(comma separated)</span></label>
                  <input
                    type="text"
                    value={skillsCsv}
                    onChange={e => setSkillsCsv(e.target.value)}
                    placeholder="UGC ads, Product demos, TikTok editing, AI tools"
                    className="w-full px-4 py-3.5 bg-white border border-[#e8e8e4] rounded-xl text-[#363535] placeholder-[#9a9a9a] transition-all focus:outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/[0.07]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#363535] mb-1.5">Experience * <span className="font-normal text-[#9a9a9a]">(short summary)</span></label>
                  <textarea
                    value={experienceSummary}
                    onChange={e => setExperienceSummary(e.target.value)}
                    rows={3}
                    placeholder="2 years creating short-form UGC for SaaS and AI brands. Delivered 120+ assets across TikTok and Reels."
                    className="w-full px-4 py-3.5 bg-white border border-[#e8e8e4] rounded-xl text-[#363535] placeholder-[#9a9a9a] transition-all focus:outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/[0.07] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#363535] mb-1.5">Hobbies & Interests * <span className="font-normal text-[#9a9a9a]">(comma separated)</span></label>
                  <input
                    type="text"
                    value={hobbiesCsv}
                    onChange={e => setHobbiesCsv(e.target.value)}
                    placeholder="Fitness tech, productivity, travel"
                    className="w-full px-4 py-3.5 bg-white border border-[#e8e8e4] rounded-xl text-[#363535] placeholder-[#9a9a9a] transition-all focus:outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/[0.07]"
                  />
                </div>
                <button
                  onClick={() => {
                    if (!creator.display_name.trim() || !creator.headline.trim() || !creator.bio.trim() || !creator.website.trim()) {
                      setError('Display name, headline, portfolio link, and bio are all required.');
                      return;
                    }
                    if (!skillsCsv.trim() || !experienceSummary.trim() || !hobbiesCsv.trim()) {
                      setError('Skills, experience, and hobbies/interests are required.');
                      return;
                    }
                    setError('');
                    setStep(2);
                  }}
                  className="btn-primary w-full py-4 text-base mt-2"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Step 2: Profile photo (REQUIRED)
    if (step === 2) {
      return (
        <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6">
          <div className="w-full max-w-lg">
            <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-display" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-1px', color: '#363535' }}>Otto</span>
                <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
              </Link>
            </nav>
            <div className="pt-24">
              <StepIndicator current={step} total={TOTAL_STEPS} />
              <button onClick={() => setStep(1)} className="text-sm text-[#6b6b6b] hover:text-[#363535] mb-6 flex items-center gap-1">← Back</button>
              <h1 className="text-4xl font-display mb-2" style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
                Add a profile photo.
              </h1>
              <p className="text-[#6b6b6b] mb-8">Brands want to see who&apos;s behind the content. A clear photo builds trust.</p>

              {error && <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

              <div className="flex flex-col items-center">
                {/* Photo preview */}
                <div className="relative mb-6">
                  {avatarUrl ? (
                    <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-[#e8e8e4]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarUrl} alt="Profile preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-40 h-40 rounded-full bg-[#f0f0ec] border-2 border-dashed border-[#d0d0cc] flex items-center justify-center">
                      <span className="text-5xl text-[#9a9a9a]">📷</span>
                    </div>
                  )}
                  {avatarUrl && (
                    <button onClick={() => { setAvatarFile(null); setAvatarUrl(''); }} className="absolute bottom-1 right-1 w-9 h-9 bg-white border border-[#e8e8e4] rounded-full flex items-center justify-center text-sm shadow-sm hover:bg-[#fafaf9]">
                      ✕
                    </button>
                  )}
                </div>

                {/* Upload input */}
                <label className="btn-primary cursor-pointer mb-4">
                  {avatarFile ? 'Change Photo' : 'Upload Photo'}
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setAvatarFile(file);
                    // Preview immediately
                    const reader = new FileReader();
                    reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }} className="hidden" />
                </label>

                <p className="text-xs text-[#9a9a9a] text-center mb-6">JPG, PNG or WebP. Max 5MB.</p>

                <button
                  onClick={() => {
                    if (!avatarFile) { setError('A profile photo is required to continue.'); return; }
                    setError('');
                    setStep(3);
                  }}
                  className="btn-primary w-full py-4 text-base disabled:opacity-60"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Step 3: Social links
    if (step === 3) {
      return (
        <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6">
          <div className="w-full max-w-lg">
            <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-display" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-1px', color: '#363535' }}>Otto</span>
                <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
              </Link>
            </nav>
            <div className="pt-24">
              <StepIndicator current={step} total={TOTAL_STEPS} />
              <button onClick={() => setStep(2)} className="text-sm text-[#6b6b6b] hover:text-[#363535] mb-6 flex items-center gap-1">← Back</button>
              <h1 className="text-4xl font-display mb-2" style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
                Your social links.
              </h1>
              <p className="text-[#6b6b6b] mb-2">Add at least one of TikTok, Instagram, or YouTube Shorts so brands can check your work fast.</p>
              <p className="text-xs text-[#6b6b6b] font-medium mb-8">Required to go live: 1 primary social. Recommended: 3+ total links.</p>

              {error && <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

              <div className="space-y-3 mb-6">
                {[
                  { platform: 'TikTok', key: 'tiktok' },
                  { platform: 'YouTube Shorts', key: 'youtube' },
                  { platform: 'Instagram', key: 'instagram' },
                  { platform: 'Twitter / X', key: 'twitter' },
                  { platform: 'Other', key: 'other' },
                ].map(({ platform, key }) => {
                  const existing = socials.find(s => s.platform === key);
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[#363535] w-20">{platform}</span>
                      <input
                        type="url"
                        value={existing?.url || ''}
                        onChange={(e) => {
                          const updated = socials.filter(s => s.platform !== key);
                          updated.push({ platform: key, url: e.target.value });
                          setSocials(updated);
                        }}
                        placeholder={`https://${key}.com/yourname`}
                        className="flex-1 px-3 py-2.5 bg-white border border-[#e8e8e4] rounded-xl text-[#363535] placeholder-[#9a9a9a] text-sm transition-all focus:outline-none focus:border-[#ccff00]"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Progress indicator */}
              <div className="mb-6 p-4 bg-white border border-[#e8e8e4] rounded-xl">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#6b6b6b]">Links added</span>
                  <span className="font-semibold text-[#363535]">{primarySocialCount} / 1 required</span>
                </div>
                <div className="w-full h-1.5 bg-[#f0f0ec] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${primarySocialCount >= 1 ? 'bg-[#ccff00]' : 'bg-[#6b6b6b]'}`} style={{ width: `${Math.min(primarySocialCount, 1) * 100}%` }} />
                </div>
              </div>

              <button onClick={() => {
                if (primarySocialCount < 1) {
                  setError('Add at least one TikTok, Instagram, or YouTube link to continue.')
                  return
                }
                setError('')
                setStep(4)
              }} className="btn-primary w-full py-4 text-base">Continue →</button>
            </div>
          </div>
        </div>
      )
    }

    // Step 4: Portfolio (videos REQUIRED — 3 to 6 videos)
    if (step === 4) {
      return (
        <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6">
          <div className="w-full max-w-lg">
            <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-display" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-1px', color: '#363535' }}>Otto</span>
                <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
              </Link>
            </nav>
            <div className="pt-24">
              <StepIndicator current={step} total={TOTAL_STEPS} />
              <button onClick={() => setStep(3)} className="text-sm text-[#6b6b6b] hover:text-[#363535] mb-6 flex items-center gap-1">← Back</button>
              <h1 className="text-4xl font-display mb-2" style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
                Your portfolio.
              </h1>
              <p className="text-[#6b6b6b] mb-2">Add your best 3–6 videos. 3 gets your profile live. 6 gets you to 100% completion.</p>
              <p className="text-xs font-medium text-[#6b6b6b] mb-6">🎬 Start with your strongest demos, reviews, or native-feeling UGC ads.</p>

              {/* Portfolio grid */}
              {portfolioItems.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {portfolioItems.map((item, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#f0f0ec] border border-[#e8e8e4] group">
                      {item.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-[#1c1c1c]">
                          <span className="text-2xl">▶️</span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#e8e8e4]">
                          <span className="text-2xl">🖼️</span>
                        </div>
                      )}
                      <button
                        onClick={() => setPortfolioItems(portfolioItems.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-xs shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add item */}
              <div className="bg-white border border-[#e8e8e4] rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-[#363535] mb-3">Add portfolio videos</p>

                {/* Upload button */}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || [])
                    if (!files.length) return
                    if (portfolioItems.length + files.length > 6) {
                      setError('Maximum 6 videos allowed.')
                      return
                    }
                    setUploadingVideo(true)
                    setError('')
                    try {
                      const { data: { user } } = await supabase.auth.getUser()
                      if (!user) return

                      const userId = user.id
                      const uploadedFiles: Array<{ fileName: string; uploadId: string }> = []

                      for (let index = 0; index < files.length; index++) {
                        const file = files[index]
                        setVideoUploadProgress(`Uploading ${file.name} (${index + 1}/${files.length})...`)

                        const signRes = await fetch('/api/mux/upload-url', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ filename: file.name, userId }),
                        })
                        if (!signRes.ok) {
                          const err = await signRes.json().catch(() => ({ error: 'Failed to get upload URL' }))
                          throw new Error(err.error || `Upload URL error: ${signRes.status}`)
                        }
                        const { uploadUrl, uploadId } = await signRes.json()

                        await new Promise<void>((resolve, reject) => {
                          const xhr = new XMLHttpRequest()
                          xhr.upload.addEventListener('progress', (e) => {
                            if (e.lengthComputable) {
                              setVideoUploadProgress(`Uploading ${file.name} (${index + 1}/${files.length}) — ${Math.round((e.loaded / e.total) * 100)}%`)
                            }
                          })
                          xhr.addEventListener('load', () => {
                            if (xhr.status >= 200 && xhr.status < 300) resolve()
                            else reject(new Error(`Upload failed: ${xhr.status}`))
                          })
                          xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
                          xhr.open('PUT', uploadUrl)
                          xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
                          xhr.send(file)
                        })

                        uploadedFiles.push({ fileName: file.name, uploadId })
                        setVideoUploadProgress(`Uploaded ${index + 1}/${files.length}. Processing in background...`)
                      }

                      let completed = 0
                      await Promise.all(uploadedFiles.map(async ({ fileName, uploadId }) => {
                        let playbackId: string | null = null
                        for (let attempt = 0; attempt < 40; attempt++) {
                          await new Promise(r => setTimeout(r, 1500))
                          const statusRes = await fetch(`/api/mux/upload-status?uploadId=${uploadId}`)
                          if (statusRes.ok) {
                            const data = await statusRes.json()
                            if (data.playbackId) { playbackId = data.playbackId; break }
                            if (data.status === 'errored') throw new Error(`Video processing failed on Mux for ${fileName}`)
                          }
                        }
                        if (!playbackId) throw new Error(`Timed out waiting for ${fileName} to process`)

                        completed += 1
                        setPortfolioItems(prev => [
                          ...prev,
                          { type: 'video', url: playbackId!, caption: '' },
                        ])
                        setVideoUploadProgress(`Processed ${completed}/${uploadedFiles.length} video${uploadedFiles.length === 1 ? '' : 's'}...`)
                      }))
                    } catch (err: unknown) {
                      const msg = err instanceof Error ? err.message : 'Upload failed'
                      setError(msg.includes('not found') ? 'Video storage bucket not found — please contact support.' : msg)
                    } finally {
                      setUploadingVideo(false)
                      setVideoUploadProgress('')
                      if (videoInputRef.current) videoInputRef.current.value = ''
                    }
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideo || portfolioItems.length >= 6}
                  className="w-full py-4 border-2 border-dashed border-[#e8e8e4] rounded-xl text-[#6b6b6b] hover:border-[#ccff00] hover:text-[#363535] transition-all flex flex-col items-center gap-2 disabled:opacity-50"
                >
                  <span className="text-2xl">📤</span>
                  <span className="text-sm font-semibold">
                    {uploadingVideo ? (videoUploadProgress || 'Uploading...') : 'Click to upload videos'}
                  </span>
                  <span className="text-xs text-[#9a9a9a]">MP4, MOV, WebM · Max 6 videos</span>
                </button>

                {/* Link option (collapsed, for TikTok/YT links) */}
                {portfolioItems.length < 6 && (
                  <button
                    onClick={() => setAddingPortfolio(true)}
                    className="mt-2 text-xs text-[#9a9a9a] hover:text-[#363535] underline"
                  >
                    Or add a video link instead
                  </button>
                )}
                {addingPortfolio && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="url"
                      onChange={e => setAddingPortfolio(e.target.value !== '')}
                      placeholder="YouTube or TikTok video URL"
                      className="w-full px-3 py-2.5 bg-[#fafaf9] border border-[#e8e8e4] rounded-lg text-[#363535] placeholder-[#9a9a9a] text-sm transition-all focus:outline-none focus:border-[#ccff00]"
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector<HTMLInputElement>('input[placeholder="YouTube or TikTok video URL"]')
                        const url = input?.value || ''
                        if (!url.trim() || portfolioItems.length >= 6) return
                        setPortfolioItems([...portfolioItems, { type: 'video', url, caption: '' }])
                        setAddingPortfolio(false)
                        if (input) input.value = ''
                      }}
                      className="btn-primary text-sm py-2 px-4"
                    >Add link</button>
                  </div>
                )}

                {error && !error.includes('bucket') && (
                  <p className="text-xs text-red-500 mt-2">{error}</p>
                )}
                {error && error.includes('bucket') && (
                  <p className="text-xs text-red-500 mt-2">⚠️ {error}</p>
                )}
              </div>

              {/* Progress */}
              <div className="mb-6 p-4 bg-white border border-[#e8e8e4] rounded-xl">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#6b6b6b]">Portfolio videos</span>
                  <span className="font-semibold text-[#363535]">{portfolioItems.length} / 3-6 required</span>
                </div>
                <div className="w-full h-1.5 bg-[#f0f0ec] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${portfolioItems.length >= 3 ? 'bg-[#ccff00]' : 'bg-[#6b6b6b]'}`} style={{ width: `${Math.min((portfolioItems.length / 3) * 100, 100)}%` }} />
                </div>
                {portfolioItems.length < 3 && (
                  <p className="text-xs text-[#9a9a9a] mt-2">Add {3 - portfolioItems.length} more to publish your profile.</p>
                )}
                {portfolioItems.length >= 6 && (
                  <p className="text-xs text-[#9a9a9a] mt-2">You reached the max of 6 videos.</p>
                )}
              </div>

              {error && <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

              <div className="space-y-3">
                {/* Publish with portfolio */}
                <button
                  onClick={async () => {
                    if (portfolioItems.length < 3 || portfolioItems.length > 6) {
                      setError('Add at least 3 videos before you can publish your creator profile.')
                      return
                    }
                    setLoading(true)
                    setError('')
                    try {
                      const { data: { user } } = await supabase.auth.getUser()
                      if (!user) { router.push('/login'); return }

                      let finalAvatarUrl = avatarUrl
                      if (avatarFile) {
                        const ext = avatarFile.name.split('.').pop()
                        const avatarPath = `${user.id}/avatar.${ext}`
                        const { error: uploadError } = await supabase.storage
                          .from('avatars').upload(avatarPath, avatarFile, { upsert: true })
                        if (uploadError) throw uploadError
                        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(avatarPath)
                        finalAvatarUrl = urlData.publicUrl
                      }

                      const { error: creatorError } = await supabase.from('creators').insert([{
                        user_id: user.id,
                        display_name: creator.display_name,
                        headline: creator.headline,
                        bio: creator.bio,
                        location: creator.location || null,
                        hourly_rate: creator.hourly_rate ? parseFloat(creator.hourly_rate) : null,
                        website: creator.website || null,
                        avatar_url: finalAvatarUrl || null,
                      }])
                      if (creatorError) throw creatorError

                      const { data: creatorData } = await supabase
                        .from('creators').select('id').eq('user_id', user.id).single()

                      if (creatorData) {
                        const skills = skillsCsv.split(',').map(s => s.trim()).filter(Boolean).slice(0, 12)
                        const hobbies = hobbiesCsv.split(',').map(s => s.trim()).filter(Boolean).slice(0, 12)
                        const tagsPayload = [
                          ...skills.map(tag => ({ creator_id: creatorData.id, tag: `skill:${tag}` })),
                          ...(experienceSummary.trim() ? [{ creator_id: creatorData.id, tag: `exp:${experienceSummary.trim()}` }] : []),
                          ...hobbies.map(tag => ({ creator_id: creatorData.id, tag: `hobby:${tag}` })),
                        ]
                        if (tagsPayload.length > 0) await supabase.from('creator_tags').insert(tagsPayload)

                        const socialLinks = [
                          ...socials.filter(s => s.url.trim()),
                          { platform: 'website', url: creator.website.trim() },
                        ]
                        if (socialLinks.length > 0) {
                          await supabase.from('creator_socials').insert(
                            socialLinks.map(s => ({ creator_id: creatorData.id, platform: s.platform as string, url: s.url }))
                          )
                        }

                        if (portfolioItems.length > 0) {
                          await supabase.from('portfolio_items').insert(
                            portfolioItems.map(p => ({ creator_id: creatorData.id, type: p.type, url: p.url, caption: p.caption || null }))
                          )
                        }
                      }

                      await supabase.from('users').update({ role: 'creator' }).eq('id', user.id)
                      setStep(5)
                    } catch (err: unknown) {
                      setError(err instanceof Error ? err.message : 'Something went wrong.')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading}
                  className="btn-primary w-full py-4 text-base disabled:opacity-60"
                >
                  {loading ? 'Publishing...' : portfolioItems.length >= 6 ? 'Publish 100% Complete Profile →' : portfolioItems.length >= 3 ? 'Publish Live Profile →' : `Add ${Math.max(0, 3 - portfolioItems.length)} more videos →`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Step 5: Success
    if (step === 5) {
      return (
        <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6">
          <div className="w-full max-w-lg text-center">
            <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-display" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-1px', color: '#363535' }}>Otto</span>
                <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
              </Link>
            </nav>
            <div className="pt-24">
              <div className="w-20 h-20 rounded-full bg-[#ccff00] flex items-center justify-center mx-auto mb-6">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </div>
              <h1 className="text-4xl font-display mb-3" style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
                Your profile is live.
              </h1>
              <p className="text-[#6b6b6b] text-lg mb-2">Brands can now discover you and review your best work straight away.</p>
              <p className="text-[#6b6b6b] mb-6">Head to your dashboard to preview your profile, top it up to 6 videos, and get ready for your first brief.</p>

              {/* Fast pay promise */}
              <div className="mb-10 inline-flex items-center gap-3 px-5 py-3 bg-[#1c1c1e] rounded-2xl text-left">
                <div className="w-10 h-10 rounded-full bg-[#ccff00] flex items-center justify-center text-lg flex-shrink-0">⚡</div>
                <div>
                  <p className="text-sm font-semibold text-white">Get paid in 48 hours</p>
                  <p className="text-xs text-[#9a9a9a]">We release payment within 48hrs of content approval. No waiting weeks.</p>
                </div>
              </div>

              <div className="block">
                <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-4">
                  Go to Dashboard →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  // Fallback
  return null
}
