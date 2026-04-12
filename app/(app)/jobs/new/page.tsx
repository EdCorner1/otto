'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const headlineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-bricolage)',
  fontWeight: 600,
  fontSize: 'clamp(28px, 5vw, 40px)',
  lineHeight: 1.0,
  letterSpacing: '-4.5px',
  color: '#363535',
}

const PLATFORMS = ['TikTok', 'YouTube Shorts', 'Instagram Reels', 'Twitter/X', 'LinkedIn']
const DELIVERABLES = ['Demo/review', 'Unboxing', 'Tutorial/how-to', 'Comparison', 'Sponsored post', 'Day-in-the-life', 'Testimonial']
const BUDGET_RANGES = ['£100–250', '£250–500', '£500–1,000', '£1,000–2,500', '£2,500+']
const TIMELINES = ['Within 1 week', 'Within 2 weeks', 'Within 1 month', 'Flexible']
const CATEGORIES = ['Tech & Gadgets', 'Fitness & Health', 'Travel & Lifestyle', 'Language Learning', 'AI & Productivity', 'Gaming', 'Food & Drink', 'Fashion & Beauty', 'Finance & SaaS', 'Other']

export default function NewJobPage() {
  const [user, setUser] = useState<{ email?: string; id: string; user_metadata?: { role?: string } } | null>(null)
  const [brand, setBrand] = useState<{ id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [deliverables, setDeliverables] = useState<string[]>([])
  const [budget, setBudget] = useState('')
  const [timeline, setTimeline] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const role = user.user_metadata?.role
      if (role === 'creator') { router.push('/dashboard'); return }

      const { data: brandData } = await supabase.from('brands').select('*').eq('user_id', user.id).single()
      if (!brandData) { router.push('/dashboard'); return }

      setUser(user)
      setBrand(brandData)
      setRole(role)
      setLoading(false)
    }
    getUser()
  }, [])

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const toggleDeliverable = (d: string) => {
    setDeliverables(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || !budget || !timeline) return

    setSubmitting(true)
    if (!brand) { setSubmitting(false); return }

    const { error } = await supabase.from('jobs').insert({
      brand_id: brand.id,
      title,
      description,
      category,
      platforms,
      deliverables,
      budget_range: budget,
      timeline,
      status: 'open',
    })
    setSubmitting(false)
    if (!error) router.push('/dashboard?posted=1')
  }

  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      <main className="pt-28 pb-20 max-w-2xl mx-auto px-6">
        <div className="mb-8 fade-up">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#6b6b6b] hover:text-[#363535] transition-colors mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to dashboard
          </Link>
          <h1 style={headlineStyle}>Post a New Brief</h1>
          <p className="mt-2 text-[#6b6b6b] text-sm">Describe what you need and creators will apply.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 fade-up stagger-1">
          {/* Brief title */}
          <div>
            <label className="block section-label mb-2">Brief title <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Need TikTok review for our AI writing tool"
              className="w-full bg-white border border-[#e8e8e4] rounded-xl px-4 py-3 text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00] transition-shadow"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block section-label mb-2">Description <span className="text-red-400">*</span></label>
            <textarea
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What should the content cover? Key messages, brand voice, must-have points..."
              rows={5}
              className="w-full bg-white border border-[#e8e8e4] rounded-xl px-4 py-3 text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00] transition-shadow resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block section-label mb-2">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-white border border-[#e8e8e4] rounded-xl px-4 py-3 text-sm text-[#363535] focus:outline-none focus:ring-2 focus:ring-[#ccff00] transition-shadow appearance-none cursor-pointer"
            >
              <option value="">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Platforms */}
          <div>
            <label className="block section-label mb-3">Platforms <span className="text-red-400">*</span></label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${platforms.includes(p)
                      ? 'bg-[#ccff00] text-[#1c1c1c]'
                      : 'bg-white border border-[#e8e8e4] text-[#6b6b6b] hover:border-[#363535]'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Deliverables */}
          <div>
            <label className="block section-label mb-3">Deliverables <span className="text-red-400">*</span></label>
            <div className="flex flex-wrap gap-2">
              {DELIVERABLES.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDeliverable(d)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${deliverables.includes(d)
                      ? 'bg-[#ccff00] text-[#1c1c1c]'
                      : 'bg-white border border-[#e8e8e4] text-[#6b6b6b] hover:border-[#363535]'
                    }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Budget + Timeline row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block section-label mb-2">Budget range <span className="text-red-400">*</span></label>
              <select
                required
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="w-full bg-white border border-[#e8e8e4] rounded-xl px-4 py-3 text-sm text-[#363535] focus:outline-none focus:ring-2 focus:ring-[#ccff00] transition-shadow appearance-none cursor-pointer"
              >
                <option value="">Select...</option>
                {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block section-label mb-2">Timeline <span className="text-red-400">*</span></label>
              <select
                required
                value={timeline}
                onChange={e => setTimeline(e.target.value)}
                className="w-full bg-white border border-[#e8e8e4] rounded-xl px-4 py-3 text-sm text-[#363535] focus:outline-none focus:ring-2 focus:ring-[#ccff00] transition-shadow appearance-none cursor-pointer"
              >
                <option value="">Select...</option>
                {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !title || !description || platforms.length === 0 || deliverables.length === 0 || !budget || !timeline}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#1c1c1c]/30 border-t-[#1c1c1c] rounded-full animate-spin" />
                  Posting...
                </span>
              ) : 'Post Brief'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
