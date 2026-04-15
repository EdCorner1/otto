'use client'

import { useState } from 'react'
import Link from 'next/link'

const INDUSTRIES = ['SaaS & Tech', 'Fashion & Beauty', 'Health & Wellness', 'Food & Beverage', 'Gaming', 'Finance', 'Other']
const GOALS = ['Drive sales', 'Build brand awareness', 'Get authentic product reviews', 'Launch a new product', 'Other']
const CREATOR_TIERS = ['Nano (1K – 10K)', 'Micro (10K – 50K)', 'Mid-tier (50K – 500K)', 'Macro (500K+)']
const CONTENT_TYPES = ['Ad creative', 'Product seeding / reviews', 'Tutorials / demos', 'Long-form reviews', 'Lifestyle integrated']
const BUDGETS = ['Under $500 / mo', '$500 – $2K / mo', '$2K – $10K / mo', '$10K+ / mo']
const PAIN_POINTS = ['Finding creators who actually fit my brand', 'Quality inconsistency', 'Measuring ROI', 'Creator ghosting', 'Not sure yet']

function ProgressBar({ step }: { step: number }) {
  const total = 8
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between text-xs font-medium text-[#8a8a86] mb-2">
        <span>Step {step} of {total}</span>
        <span>{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#e8e8e4]">
        <div
          className="h-full rounded-full bg-[#ccff00] transition-all duration-500"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

const BRAND_QUESTIONS: Array<{
  id: string; question: string; type: 'text' | 'select';
  placeholder?: string; options?: string[]; required?: boolean
}> = [
  { id: 'company', question: "What's your company called?", type: 'text', placeholder: 'Company name', required: true },
  { id: 'your_role', question: "What's your role?", type: 'text', placeholder: 'e.g. Head of Marketing', required: true },
  { id: 'industry', question: 'What industry are you in?', type: 'select', options: INDUSTRIES, required: true },
  { id: 'goal', question: 'What are you mainly trying to achieve with UGC?', type: 'select', options: GOALS, required: true },
  { id: 'creator_tier', question: 'What size creators do you usually work with?', type: 'select', options: CREATOR_TIERS, required: true },
  { id: 'content_types', question: 'What content format do you need most?', type: 'select', options: CONTENT_TYPES, required: true },
  { id: 'budget', question: "What's your monthly UGC budget?", type: 'select', options: BUDGETS, required: true },
  { id: 'pain_point', question: "What's your biggest challenge with creator partnerships?", type: 'select', options: PAIN_POINTS, required: false },
]

export default function BrandWelcome() {
  const [step, setStep] = useState(0)
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const currentQ = BRAND_QUESTIONS[step]
  const currentValue = values[currentQ?.id] || ''

  function handleNext(val: string) {
    const next = { ...values, [currentQ.id]: val }
    setValues(next)
    if (step < BRAND_QUESTIONS.length - 1) {
      setStep(s => s + 1)
    } else {
      handleSubmit(next)
    }
  }

  async function handleSubmit(data: Record<string, string>) {
    setSubmitting(true)
    try {
      await fetch('/api/waitlist-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, role: 'brand' }),
      })
    } catch { /* non-fatal */ }
    setDone(true)
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#fafaf9] text-[#363535] flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#ccff00]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1
            className="text-3xl font-semibold text-[#1c1c1e] sm:text-4xl"
            style={{
              fontFamily: 'var(--font-bricolage)',
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
            }}
          >
            You&apos;re all set ✦
          </h1>
          <p className="mt-3 text-[#6b6b6b]">We&apos;ve got everything we need. We&apos;ll be in touch when we launch — and you&apos;ll get early access to the platform.</p>
          <a href="/" className="mt-8 inline-block rounded-full bg-[#1c1c1e] px-8 py-3.5 text-sm font-bold text-white">Back to home</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#363535]">
      <header className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-[#e8e8e4] bg-white/85 px-5 py-3.5 shadow-lg shadow-black/[0.06] backdrop-blur-md">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>Otto</span>
            <span className="h-2 w-2 rounded-full bg-[#ccff00]" />
          </Link>
          <span className="text-sm text-[#8a8a86]">Brand profile</span>
        </div>
      </header>

      <main className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-6 pt-28 pb-12">
        <div className="w-full">
          <ProgressBar step={step + 1} />

          <p className="mb-2 text-sm font-medium text-[#8a8a86] uppercase tracking-wide">Brand onboarding</p>
          <h2 className="mb-8 font-heading text-3xl font-bold text-[#1c1c1e]">{currentQ.question}</h2>

          {currentQ.type === 'text' ? (
            <div>
              <input
                type="text"
                autoFocus
                value={currentValue}
                onChange={e => setValues(v => ({ ...v, [currentQ.id]: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter' && currentValue.trim()) handleNext(currentValue.trim())
                }}
                placeholder={currentQ.placeholder}
                className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-5 py-4 text-lg text-[#1c1c1e] outline-none transition focus:border-[#ccff00]"
              />
              <button
                onClick={() => currentValue.trim() && handleNext(currentValue.trim())}
                disabled={!currentValue.trim() || submitting}
                className="mt-4 w-full rounded-2xl bg-[#1c1c1e] py-4 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {(currentQ.options ?? []).map(opt => (
                <button
                  key={opt}
                  onClick={() => handleNext(opt)}
                  className={`w-full rounded-2xl border px-5 py-4 text-left text-base transition ${
                    currentValue === opt
                      ? 'border-[#ccff00] bg-[#ccff00]/10 font-semibold text-[#1c1c1e]'
                      : 'border-[#e8e8e4] bg-white text-[#363535] hover:border-[#1c1c1e]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} className="text-sm text-[#8a8a86] hover:text-[#363535]">
                ← Back
              </button>
            ) : <span />}
            <button onClick={() => handleNext(currentValue)} className="text-sm text-[#8a8a86] hover:text-[#363535]">
              Skip →
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}