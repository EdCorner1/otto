'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const TEMPLATES = [
  {
    id: 'product-launch',
    title: 'Product Launch',
    description: 'Announce a new product or feature. Great for building anticipation and early adoption.',
    platforms: ['TikTok', 'YouTube Shorts', 'Instagram Reels'],
    deliverables: [
      '1 × 30–60 second UGC video',
      '3 × quote carousels for stories',
      'Written caption (300–500 words)',
    ],
    budget_range: '£150–£500',
    timeline: '1–2 weeks',
    requirements: [
      'Creator must have used or reviewed the product',
      'Video must be original (not screen recorded)',
      'Brand approval required before posting',
    ],
  },
  {
    id: 'app-walkthrough',
    title: 'App Walkthrough',
    description: 'Show real users how to get the most out of your app. Builds trust and reduces churn.',
    platforms: ['YouTube Shorts', 'TikTok', 'Instagram Reels'],
    deliverables: [
      '1 × 60–90 second tutorial video',
      '2 × bite-sized clips (15–30 seconds)',
      'Creator commentary / narration',
    ],
    budget_range: '£200–£600',
    timeline: '1–2 weeks',
    requirements: [
      'Creator must have a genuine paid account with the app',
      'Must cover at least 3 key features',
      'No misleading claims or comparisons',
    ],
  },
  {
    id: 'testimonial',
    title: 'Customer Testimonial',
    description: 'Real customer sharing their experience. High trust, great for landing pages and ads.',
    platforms: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
    deliverables: [
      '1 × 45–90 second testimonial video',
      'Written quote (50–100 words)',
      'Optional: behind-the-scenes context',
    ],
    budget_range: '£100–£400',
    timeline: '3–7 days',
    requirements: [
      'Creator must be a genuine customer or user',
      'Honest, unscripted feel preferred',
      'Creator retains right to post on their own channels',
    ],
  },
  {
    id: 'comparison',
    title: 'Comparison / vs Content',
    description: 'Position your tool against a competitor. Bold, engaging, drives switching intent.',
    platforms: ['TikTok', 'YouTube Shorts'],
    deliverables: [
      '1 × 60–90 second comparison video',
      'Key points written as bullet list',
    ],
    budget_range: '£250–£700',
    timeline: '1–2 weeks',
    requirements: [
      'Must be factually accurate — no misleading claims',
      'Brand gets right to review before publishing',
      'Both tools must be genuinely used or trialled',
    ],
  },
  {
    id: 'listicle',
    title: 'Tool List / Recommendation',
    description: 'Creators share your tool as part of a "best of" or "my stack" style content piece.',
    platforms: ['TikTok', 'YouTube Shorts', 'Twitter/X'],
    deliverables: [
      '1 × 60 second video featuring the tool',
      'Written recommendation (if applicable)',
    ],
    budget_range: '£75–£250',
    timeline: '3–7 days',
    requirements: [
      'Tool must be featured prominently (not buried)',
      'Creator must have used it in a real workflow',
    ],
  },
  {
    id: 'brand-awareness',
    title: 'Brand Awareness Series',
    description: 'Ongoing content partnership with a creator who aligns with your brand values.',
    platforms: ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Podcast'],
    deliverables: [
      '4 × pieces of content over 4 weeks',
      'Monthly performance review call',
      'Cross-promotion on creator channels',
    ],
    budget_range: '£500–£2,000/month',
    timeline: 'Monthly retainer',
    requirements: [
      'Creator must align with brand voice and values',
      'Minimum 3-month commitment preferred',
      'Creator must have engaged, relevant audience',
    ],
  },
]

export default function BriefTemplatesPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user?.user_metadata?.role !== 'brand') {
        // Let anyone view templates, but redirect non-brands to jobs page
      }
    })
  }, [])

  const template = TEMPLATES.find(t => t.id === selected)

  return (
    <div className="max-w-4xl mx-auto px-6">

      {/* Header */}
      <div className="mb-10">
        <h1 style={{
          fontFamily: 'var(--font-bricolage)',
          fontWeight: 600, fontSize: 'clamp(28px, 5vw, 40px)',
          lineHeight: 1.0, letterSpacing: '-0.5px', color: '#363535',
        }} className="mb-3">
          Brief templates
        </h1>
        <p className="text-[#6b6b6b] text-sm max-w-xl">
          Pick a format, fill in the details, and post your brief. Each template is designed to attract the right creators.
        </p>
      </div>

      {!selected ? (
        <>
          {/* Template grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className="card card-hover p-6 text-left w-full group"
              >
                <h3 style={{
                  fontFamily: 'var(--font-bricolage)',
                  fontWeight: 600, fontSize: '18px', letterSpacing: '-0.5px', color: '#1c1c1e',
                }} className="mb-1.5">
                  {t.title}
                </h3>
                <p className="text-sm text-[#6b6b6b] mb-4">{t.description}</p>
                <div className="flex items-center gap-3 text-xs text-[#9a9a9a]">
                  <span className="px-2 py-0.5 bg-[#f0f0ec] rounded-full">{t.budget_range}</span>
                  <span>{t.platforms.length} platform{t.platforms.length !== 1 ? 's' : ''}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Selected template */}
          <button
            onClick={() => setSelected(null)}
            className="text-sm text-[#6b6b6b] hover:text-[#363535] transition-colors mb-6 flex items-center gap-1.5"
          >
            ← All templates
          </button>

          <div className="card mb-6">
            <div className="flex items-start gap-4 mb-5">
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-bricolage)',
                  fontWeight: 600, fontSize: 'clamp(22px, 4vw, 32px)',
                  letterSpacing: '-1.5px', color: '#1c1c1e',
                }} className="mb-1">{template!.title}</h2>
                <p className="text-sm text-[#6b6b6b]">{template!.description}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-5 p-4 bg-[#fafaf9] rounded-xl">
              <div>
                <p className="text-xs text-[#9a9a9a] mb-1">Budget range</p>
                <p className="text-sm font-semibold text-[#363535]">{template!.budget_range}</p>
              </div>
              <div>
                <p className="text-xs text-[#9a9a9a] mb-1">Timeline</p>
                <p className="text-sm font-semibold text-[#363535]">{template!.timeline}</p>
              </div>
              <div>
                <p className="text-xs text-[#9a9a9a] mb-1">Platforms</p>
                <p className="text-sm font-semibold text-[#363535]">{template!.platforms.join(', ')}</p>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider mb-2">Deliverables</p>
              <ul className="space-y-1.5">
                {template!.deliverables.map((d, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[#6b6b6b]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] mt-2 flex-shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider mb-2">Requirements</p>
              <ul className="space-y-1.5">
                {template!.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[#6b6b6b]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#363535] mt-2 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Use this template */}
          <div className="card text-center py-8">
            <h3 style={{
              fontFamily: 'var(--font-bricolage)',
              fontWeight: 600, fontSize: '20px', letterSpacing: '-0.5px', color: '#1c1c1e',
            }} className="mb-2">
              Ready to post this brief?
            </h3>
            <p className="text-sm text-[#6b6b6b] mb-6">
              This template will pre-fill your brief when you create it.
            </p>
            <Link
              href={`/jobs/new?template=${selected}`}
              className="btn-primary px-8 py-3 text-base"
            >
              Post a brief with this template →
            </Link>
          </div>
        </>
      )}

    </div>
  )
}
