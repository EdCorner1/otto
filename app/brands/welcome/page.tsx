'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

const QUESTIONS = [
  { id: 'company_name', question: "What's your company called?", type: 'text', placeholder: 'Company name' },
  { id: 'role', question: "What's your role at the company?", type: 'text', placeholder: 'e.g. Head of Marketing' },
  { id: 'industry', question: 'What industry are you in?', type: 'select', options: ['SaaS & Tech', 'AI', 'E-commerce', 'Consumer apps', 'Gaming', 'Other'] },
  { id: 'goal', question: 'What do you want from UGC right now?', type: 'select', options: ['Drive sales', 'Awareness', 'Get more social proof', 'Launch product', 'All of the above'] },
  { id: 'creator_tier', question: 'What creator size do you usually work with?', type: 'select', options: ['Nano (1K - 10K)', 'Micro (10K - 50K)', 'Mid (50K - 250K)', 'Mixed tiers'] },
  { id: 'formats', question: 'What format do you need most?', type: 'select', options: ['UGC ads', 'Product demos', 'Reviews', 'Tutorials', 'Mixed'] },
  { id: 'budget', question: "What's your monthly UGC budget range?", type: 'select', options: ['Under $1K', '$1K - $5K', '$5K - $20K', '$20K+'] },
  { id: 'challenge', question: "What's your biggest challenge with creators?", type: 'select', options: ['Finding fit', 'Quality consistency', 'Slow turnaround', 'Measuring ROI', 'Not sure yet'] },
] as const

type Question = (typeof QUESTIONS)[number]

export default function BrandWelcomePage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const current = QUESTIONS[step]
  const value = answers[current?.id] || ''

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('email')?.trim().toLowerCase()
    const fromStorage = window.localStorage.getItem('otto_waitlist_email')?.trim().toLowerCase()
    setEmail(fromQuery || fromStorage || '')
  }, [])

  const progressPct = useMemo(() => Math.round(((step + 1) / QUESTIONS.length) * 100), [step])

  function next(nextValue: string) {
    const updated = { ...answers, [current.id]: nextValue }
    setAnswers(updated)

    if (step < QUESTIONS.length - 1) {
      setStep((prev) => prev + 1)
      return
    }

    void submit(updated)
  }

  async function submit(payload: Record<string, string>) {
    setSubmitting(true)
    try {
      await fetch('/api/waitlist-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'brand',
          email: email || undefined,
          answers: payload,
        }),
      })
    } catch {
      // non-fatal for UX
    } finally {
      setSubmitting(false)
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#fafaf9] text-[#1c1c1e] flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-[#e8e8e4] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#ccff00] animate-[checkPop_450ms_ease-out]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-3xl" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>You&apos;re on the list</h1>
          <p className="mt-3 text-sm text-[#6b6b6b]">Perfect. We&apos;ll send your early brand invite as soon as we open access.</p>
          <Link href="/" className="mt-7 inline-block rounded-full bg-[#1c1c1e] px-7 py-3 text-sm font-bold text-white">Back to home</Link>

          <style jsx>{`
            @keyframes checkPop {
              0% { transform: scale(0.5); opacity: 0; }
              70% { transform: scale(1.08); opacity: 1; }
              100% { transform: scale(1); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1c1e]">
      <header className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-[#e8e8e4] bg-white/90 px-5 py-3.5 shadow-lg shadow-black/[0.06] backdrop-blur-md">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>Otto</span>
            <span className="h-2 w-2 rounded-full bg-[#ccff00]" />
          </Link>
          <span className="text-sm text-[#6b6b6b]">Brand onboarding</span>
        </div>
      </header>

      <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-5 pb-10 pt-28 sm:px-8">
        <div className="w-full rounded-3xl border border-[#e8e8e4] bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-7">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#6b6b6b]">
              <span>Step {step + 1} of 8</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#e8e8e4]">
              <div className="h-full rounded-full bg-[#ccff00] transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div key={current.id} className="animate-[questionIn_320ms_ease-out]">
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[#8a8a86]">Brand waitlist</p>
            <h1 className="mb-3 text-3xl leading-tight" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>{current.question}</h1>
            <p className="mb-7 text-sm text-[#6b6b6b]">
              {email
                ? `Saved: ${email}. These answers help us shape launch matching.`
                : 'These answers help us shape launch matching.'}
            </p>

            {current.type === 'text' ? (
              <>
                <input
                  autoFocus
                  value={value}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && value.trim()) next(value.trim())
                  }}
                  placeholder={current.placeholder}
                  className="w-full rounded-2xl border border-[#e8e8e4] px-4 py-3.5 text-base outline-none focus:border-[#ccff00]"
                />
                <button
                  onClick={() => value.trim() && next(value.trim())}
                  disabled={!value.trim() || submitting}
                  className="mt-4 w-full rounded-2xl bg-[#1c1c1e] py-3.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  Continue
                </button>
              </>
            ) : (
              <div className="space-y-3">
                {(current.options || []).map((option) => (
                  <button
                    key={option}
                    onClick={() => next(option)}
                    className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm transition ${
                      value === option
                        ? 'border-[#ccff00] bg-[#ccff00]/15 text-[#1c1c1e]'
                        : 'border-[#e8e8e4] bg-white text-[#363535] hover:border-[#1c1c1e]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between text-sm">
            {step > 0 ? (
              <button onClick={() => setStep((prev) => prev - 1)} className="text-[#6b6b6b] hover:text-[#1c1c1e]">← Back</button>
            ) : <span />}
            <button onClick={() => next(value)} className="text-[#6b6b6b] hover:text-[#1c1c1e]">Skip →</button>
          </div>

          <style jsx>{`
            @keyframes questionIn {
              0% { opacity: 0; transform: translateY(10px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      </main>
    </div>
  )
}
