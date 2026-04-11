'use client'
import { useState } from 'react'
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
  const [brand, setBrand] = useState({ company_name: '', website: '', industry: 'Tech', description: '' })

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [socials, setSocials] = useState([
    { platform: 'tiktok', url: '' },
    { platform: 'youtube', url: '' },
    { platform: 'instagram', url: '' },
  ])
  const [portfolioItems, setPortfolioItems] = useState<Array<{ type: 'video' | 'image'; url: string; caption: string }>>([])
  const [newPortfolioUrl, setNewPortfolioUrl] = useState('')
  const [newPortfolioCaption, setNewPortfolioCaption] = useState('')
  const [addingPortfolio, setAddingPortfolio] = useState(false)

  // ─── STEP 0: ROLE SELECTION ─────────────────────────
  if (step === 0) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          {/* Floating nav */}
          <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-extrabold font-display tracking-tight" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>Otto</span>
              <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
            </Link>
          </nav>

          <div className="pt-24">
            <h1 className="text-4xl font-display tracking-tight mb-3" style={{ fontSize: 'clamp(32px, 6vw, 48px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
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
    if (step === 1) {
      return (
        <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6">
          <div className="w-full max-w-lg">
            <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-display tracking-tight" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>Otto</span>
                <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
              </Link>
            </nav>
            <div className="pt-24">
              <StepIndicator current={1} total={2} />
              <button onClick={() => setStep(0)} className="text-sm text-[#6b6b6b] hover:text-[#363535] mb-6 flex items-center gap-1">← Back</button>
              <h1 className="text-4xl font-display tracking-tight mb-2" style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
                Tell us about your brand.
              </h1>
              <p className="text-[#6b6b6b] mb-8">This helps us match you with the right creators.</p>

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
                    <option>Tech</option><option>SaaS</option><option>AI Tools</option><option>Gadgets</option><option>Gaming</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#363535] mb-1.5">What do you make?</label>
                  <textarea value={brand.description} onChange={e => setBrand({ ...brand, description: e.target.value })} placeholder="A fast, keyboard-first launcher for macOS..." rows={3} className="w-full px-4 py-3.5 bg-white border border-[#e8e8e4] rounded-xl text-[#363535] placeholder-[#9a9a9a] transition-all focus:outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/[0.07] resize-none" />
                </div>
                <button
                  onClick={async () => {
                    if (!brand.company_name.trim()) { setError('Company name is required.'); return; }
                    setLoading(true); setError('');
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) { router.push('/login'); return; }
                      // Insert into brands table
                      const { error } = await supabase.from('brands').insert([{ user_id: user.id, company_name: brand.company_name, website: brand.website || null, industry: brand.industry, bio: brand.description || null }]);
                      if (error) throw error;
                      // Update user role
                      await supabase.from('users').update({ role: 'brand' }).eq('id', user.id);
                      router.push('/dashboard');
                    } catch (err: unknown) {
                      setError(err instanceof Error ? err.message : 'Something went wrong.');
                    } finally { setLoading(false); }
                  }}
                  disabled={loading}
                  className="btn-primary w-full py-4 text-base disabled:opacity-60 mt-2"
                >
                  {loading ? 'Setting up...' : 'Continue →'}
                </button>
              </div>
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
              <Link href="/" className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-display tracking-tight" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>Otto</span>
                <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
              </Link>
            </nav>
            <div className="pt-24">
              <StepIndicator current={step} total={TOTAL_STEPS} />
              <button onClick={() => setStep(0)} className="text-sm text-[#6b6b6b] hover:text-[#363535] mb-6 flex items-center gap-1">← Back</button>
              <h1 className="text-4xl font-display tracking-tight mb-2" style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
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
                  <label className="block text-sm font-semibold text-[#363535] mb-1.5">Bio * <span className="font-normal text-[#9a9a9a]">(2-4 sentences)</span></label>
                  <textarea value={creator.bio} onChange={e => setCreator({ ...creator, bio: e.target.value })} placeholder="I make videos about AI tools and productivity software. 200K+ views across TikTok and YouTube. I've worked with Notion, Linear, and Raycast..." rows={4} required className="w-full px-4 py-3.5 bg-white border border-[#e8e8e4] rounded-xl text-[#363535] placeholder-[#9a9a9a] transition-all focus:outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/[0.07] resize-none" />
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
                <button
                  onClick={() => {
                    if (!creator.display_name.trim() || !creator.headline.trim() || !creator.bio.trim()) {
                      setError('Display name, headline, and bio are all required.');
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
              <Link href="/" className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-display tracking-tight" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>Otto</span>
                <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
              </Link>
            </nav>
            <div className="pt-24">
              <StepIndicator current={step} total={TOTAL_STEPS} />
              <button onClick={() => setStep(1)} className="text-sm text-[#6b6b6b] hover:text-[#363535] mb-6 flex items-center gap-1">← Back</button>
              <h1 className="text-4xl font-display tracking-tight mb-2" style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
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
              <Link href="/" className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-display tracking-tight" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>Otto</span>
                <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
              </Link>
            </nav>
            <div className="pt-24">
              <StepIndicator current={step} total={TOTAL_STEPS} />
              <button onClick={() => setStep(2)} className="text-sm text-[#6b6b6b] hover:text-[#363535] mb-6 flex items-center gap-1">← Back</button>
              <h1 className="text-4xl font-display tracking-tight mb-2" style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
                Your social links.
              </h1>
              <p className="text-[#6b6b6b] mb-2">Add at least one link so brands can see your audience.</p>
              <p className="text-xs text-[#ccff00] font-semibold mb-8">Recommended: add 3+ for more visibility.</p>

              <div className="space-y-3 mb-6">
                {[
                  { platform: 'TikTok', key: 'tiktok', emoji: '🎵' },
                  { platform: 'YouTube', key: 'youtube', emoji: '▶️' },
                  { platform: 'Instagram', key: 'instagram', emoji: '📸' },
                  { platform: 'Twitter / X', key: 'twitter', emoji: '🐦' },
                  { platform: 'Other', key: 'other', emoji: '🔗' },
                ].map(({ platform, key, emoji }) => {
                  const existing = socials.find(s => s.platform === key);
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xl w-8 text-center">{emoji}</span>
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
                  <span className="font-semibold text-[#363535]">{socials.filter(s => s.url.trim()).length} / {socials.length}</span>
                </div>
                <div className="w-full h-1.5 bg-[#f0f0ec] rounded-full overflow-hidden">
                  <div className="h-full bg-[#ccff00] rounded-full transition-all" style={{ width: `${(socials.filter(s => s.url.trim()).length / socials.length) * 100}%` }} />
                </div>
              </div>

              <button onClick={() => setStep(4)} className="btn-primary w-full py-4 text-base">Continue →</button>
            </div>
          </div>
        </div>
      )
    }

    // Step 4: Portfolio (videos REQUIRED — minimum 6 to publish)
    if (step === 4) {
      return (
        <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6">
          <div className="w-full max-w-lg">
            <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-display tracking-tight" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>Otto</span>
                <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
              </Link>
            </nav>
            <div className="pt-24">
              <StepIndicator current={step} total={TOTAL_STEPS} />
              <button onClick={() => setStep(3)} className="text-sm text-[#6b6b6b] hover:text-[#363535] mb-6 flex items-center gap-1">← Back</button>
              <h1 className="text-4xl font-display tracking-tight mb-2" style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
                Your portfolio.
              </h1>
              <p className="text-[#6b6b6b] mb-2">Add at least 6 videos to publish your profile. Brands hire based on your work.</p>
              <p className="text-xs font-semibold text-[#ccff00] mb-6">🎬 Video content gets 3x more proposals than image-only portfolios.</p>

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
                <p className="text-sm font-semibold text-[#363535] mb-3">Add a portfolio item</p>
                <input
                  type="url"
                  value={newPortfolioUrl}
                  onChange={e => setNewPortfolioUrl(e.target.value)}
                  placeholder="YouTube or TikTok video URL"
                  className="w-full px-3 py-2.5 bg-[#fafaf9] border border-[#e8e8e4] rounded-lg text-[#363535] placeholder-[#9a9a9a] text-sm mb-2 transition-all focus:outline-none focus:border-[#ccff00]"
                />
                <input
                  type="text"
                  value={newPortfolioCaption}
                  onChange={e => setNewPortfolioCaption(e.target.value)}
                  placeholder="Caption (e.g. 'Raycast review — 50K views')"
                  className="w-full px-3 py-2.5 bg-[#fafaf9] border border-[#e8e8e4] rounded-lg text-[#363535] placeholder-[#9a9a9a] text-sm mb-3 transition-all focus:outline-none focus:border-[#ccff00]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!newPortfolioUrl.trim()) return;
                      setPortfolioItems([...portfolioItems, { type: 'video', url: newPortfolioUrl, caption: newPortfolioCaption }]);
                      setNewPortfolioUrl('');
                      setNewPortfolioCaption('');
                    }}
                    disabled={!newPortfolioUrl.trim()}
                    className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
                  >+ Add Video</button>
                  <button
                    onClick={() => {
                      if (!newPortfolioUrl.trim()) return;
                      setPortfolioItems([...portfolioItems, { type: 'image', url: newPortfolioUrl, caption: newPortfolioCaption }]);
                      setNewPortfolioUrl('');
                      setNewPortfolioCaption('');
                    }}
                    disabled={!newPortfolioUrl.trim()}
                    className="btn-ghost text-sm py-2 px-4 border border-[#e8e8e4] disabled:opacity-50"
                  >+ Add Image</button>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6 p-4 bg-white border border-[#e8e8e4] rounded-xl">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#6b6b6b]">Portfolio items</span>
                  <span className="font-semibold text-[#363535]">{portfolioItems.length} / 6 minimum</span>
                </div>
                <div className="w-full h-1.5 bg-[#f0f0ec] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${portfolioItems.length >= 6 ? 'bg-[#ccff00]' : 'bg-[#6b6b6b]'}`} style={{ width: `${Math.min((portfolioItems.length / 6) * 100, 100)}%` }} />
                </div>
                {portfolioItems.length < 6 && (
                  <p className="text-xs text-[#9a9a9a] mt-2">Add {6 - portfolioItems.length} more to publish your profile.</p>
                )}
              </div>

              {error && <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

              <button
                onClick={async () => {
                  if (portfolioItems.length < 6) {
                    setError('You need at least 6 portfolio items to publish your profile.');
                    return;
                  }
                  setLoading(true);
                  setError('');
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) { router.push('/login'); return; }

                    // 1. Upload avatar to Supabase Storage
                    let finalAvatarUrl = avatarUrl;
                    if (avatarFile) {
                      const ext = avatarFile.name.split('.').pop();
                      const avatarPath = `${user.id}/avatar.${ext}`;
                      const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(avatarPath, avatarFile, { upsert: true });
                      if (uploadError) throw uploadError;
                      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
                      finalAvatarUrl = urlData.publicUrl;
                    }

                    // 2. Insert creator profile
                    const { error: creatorError } = await supabase.from('creators').insert([{
                      user_id: user.id,
                      display_name: creator.display_name,
                      headline: creator.headline,
                      bio: creator.bio,
                      location: creator.location || null,
                      hourly_rate: creator.hourly_rate ? parseFloat(creator.hourly_rate) : null,
                      website: null,
                      avatar_url: finalAvatarUrl || null,
                    }]);
                    if (creatorError) throw creatorError;

                    // 3. Insert social links
                    const socialLinks = socials.filter(s => s.url.trim());
                    if (socialLinks.length > 0) {
                      const { data: creatorData } = await supabase.from('creators').select('id').eq('user_id', user.id).single();
                      if (creatorData) {
                        await supabase.from('creator_socials').insert(
                          socialLinks.map(s => ({ creator_id: creatorData.id, platform: s.platform as string, url: s.url }))
                        );
                      }
                    }

                    // 4. Insert portfolio items
                    if (portfolioItems.length > 0) {
                      const { data: creatorData } = await supabase.from('creators').select('id').eq('user_id', user.id).single();
                      if (creatorData) {
                        await supabase.from('portfolio_items').insert(
                          portfolioItems.map(p => ({ creator_id: creatorData.id, type: p.type, url: p.url, caption: p.caption || null }))
                        );
                      }
                    }

                    // 5. Update user role
                    await supabase.from('users').update({ role: 'creator' }).eq('id', user.id);

                    setStep(5);
                  } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : 'Something went wrong.');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="btn-primary w-full py-4 text-base disabled:opacity-60"
              >
                {loading ? 'Publishing...' : portfolioItems.length >= 6 ? 'Publish Profile →' : `Add ${6 - portfolioItems.length} more →`}
              </button>
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
              <Link href="/" className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-display tracking-tight" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>Otto</span>
                <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
              </Link>
            </nav>
            <div className="pt-24">
              <div className="w-20 h-20 rounded-full bg-[#ccff00] flex items-center justify-center mx-auto mb-6">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </div>
              <h1 className="text-4xl font-display tracking-tight mb-3" style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
                Your profile is live.
              </h1>
              <p className="text-[#6b6b6b] text-lg mb-2">Brands can now discover you and send briefs.</p>
              <p className="text-[#6b6b6b] mb-10">Complete your social links and add more portfolio items any time from your dashboard.</p>
              <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-4">
                Go to Dashboard →
              </Link>
            </div>
          </div>
        </div>
      )
    }
  }

  // Fallback
  return null
}
