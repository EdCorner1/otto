'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Play, Sparkles, Wand2 } from 'lucide-react'

type HookItem = {
  id: string
  category: string
  hook: string
  url: string
}

const MOCK_HOOKS: HookItem[] = [
  {
    id: 'ig-1',
    category: 'AI Tools',
    hook: 'I replaced my $2,000/month software stack with this one AI workflow.',
    url: 'https://www.instagram.com/reel/C9h9Q0oS1Qx/',
  },
  {
    id: 'ig-2',
    category: 'Productivity',
    hook: 'This 10-second system fixed my content consistency instantly.',
    url: 'https://www.instagram.com/reel/C8xP8b4I2Zd/',
  },
  {
    id: 'tt-1',
    category: 'UGC Strategy',
    hook: 'If I had to get my first UGC deal in 7 days, I would do this exact plan.',
    url: 'https://www.tiktok.com/@scout2015/video/6718335390845095173',
  },
]

function toEmbedUrl(url: string) {
  const lower = url.toLowerCase()

  if (lower.includes('instagram.com/reel/')) {
    const id = url.split('/reel/')[1]?.split('/')[0]
    if (id) return `https://www.instagram.com/reel/${id}/embed`
  }

  if (lower.includes('instagram.com/p/')) {
    const id = url.split('/p/')[1]?.split('/')[0]
    if (id) return `https://www.instagram.com/p/${id}/embed`
  }

  if (lower.includes('tiktok.com') && lower.includes('/video/')) {
    const id = url.split('/video/')[1]?.split(/[/?]/)[0]
    if (id) return `https://www.tiktok.com/embed/v2/${id}`
  }

  if (lower.includes('youtube.com/watch?v=')) {
    const id = url.split('v=')[1]?.split('&')[0]
    if (id) return `https://www.youtube.com/embed/${id}`
  }

  if (lower.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split(/[?&]/)[0]
    if (id) return `https://www.youtube.com/embed/${id}`
  }

  return null
}

export default function HooksLandingPage() {
  const [contentType, setContentType] = useState('AI app tutorials')
  const [audience, setAudience] = useState('tech creators growing to first $5k/month')
  const [style, setStyle] = useState('no-BS, practical, slightly opinionated')
  const [results, setResults] = useState<HookItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = useMemo(() => {
    return results.find((item) => item.id === selectedId) ?? null
  }, [results, selectedId])

  const selectedEmbedUrl = selected ? toEmbedUrl(selected.url) : null

  const continuation = useMemo(() => {
    if (!selected) return ''

    return `Great hook. Now bridge it to your audience in one sentence:\n\n"If you're creating ${contentType} for ${audience}, this matters because [pain point]."\n\nThen move into proof: show the exact workflow and result in 2-3 steps. Keep it in a ${style} tone.`
  }, [selected, contentType, audience, style])

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#363535]">
      <header className="sticky top-0 z-40 border-b border-[#e8e8e4] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold" style={{ fontFamily: 'var(--font-bricolage)' }}>
              Hooksy
            </span>
            <span className="rounded-full bg-[#ccff00] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1c1c1c]">
              beta
            </span>
          </div>
          <Link href="/" className="text-sm font-semibold text-[#5b5b57] hover:text-[#1c1c1c]">
            Back to Otto
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="mb-10 max-w-3xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dff3b3] bg-[#efffd3] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#355400]">
            <Sparkles className="h-3.5 w-3.5" />
            Viral Hook Assistant
          </p>
          <h1 className="text-[clamp(2rem,5vw,3.5rem)] leading-[0.95] text-[#1c1c1c]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>
            Find proven hooks. Watch real viral videos. Write your next script faster.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6b6b6b]">
            Tell Hooksy what content you make, who it is for, and your style. It pulls 3 relevant viral examples and helps you write the next part of your script.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-[#e8e8e4] bg-white p-5 shadow-[0_10px_30px_rgba(28,28,30,0.05)]">
            <h2 className="mb-4 text-xl font-semibold text-[#1c1c1c]">Prompt the assistant</h2>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#5f5f58]">
                Type of content
                <input
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#e8e8e4] bg-[#fafaf8] px-4 py-3 text-sm outline-none focus:border-[#ccff00]"
                />
              </label>

              <label className="block text-sm font-medium text-[#5f5f58]">
                Audience
                <input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#e8e8e4] bg-[#fafaf8] px-4 py-3 text-sm outline-none focus:border-[#ccff00]"
                />
              </label>

              <label className="block text-sm font-medium text-[#5f5f58]">
                Content style
                <input
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#e8e8e4] bg-[#fafaf8] px-4 py-3 text-sm outline-none focus:border-[#ccff00]"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                setResults(MOCK_HOOKS)
                setSelectedId(MOCK_HOOKS[0].id)
              }}
              className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#ccff00] px-5 text-sm font-bold text-[#1c1c1c] transition hover:opacity-90"
            >
              <Wand2 className="h-4 w-4" />
              Pull 3 viral examples
            </button>

            {results.length > 0 && (
              <div className="mt-6 space-y-3">
                {results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedId === item.id
                        ? 'border-[#ccff00] bg-[#f6ffd9]'
                        : 'border-[#e8e8e4] bg-[#fcfcfa] hover:border-[#d8d8d1]'
                    }`}
                  >
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#8a8a86]">{item.category}</p>
                    <p className="text-sm font-medium text-[#1c1c1c]">{item.hook}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-[#e8e8e4] bg-white p-5 shadow-[0_10px_30px_rgba(28,28,30,0.05)]">
            <h2 className="mb-4 text-xl font-semibold text-[#1c1c1c]">Live video + script continuation</h2>

            {!selected && (
              <div className="rounded-2xl border border-dashed border-[#d9d9d3] bg-[#fafaf8] p-6 text-sm text-[#6b6b6b]">
                Select an example and we will preview the viral video here.
              </div>
            )}

            {selected && (
              <>
                {selectedEmbedUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-[#e8e8e4] bg-black">
                    <iframe
                      src={selectedEmbedUrl}
                      title="Viral source video"
                      className="h-[360px] w-full"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    />
                  </div>
                ) : (
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#e8e8e4] bg-[#fafaf8] px-4 py-3 text-sm font-semibold text-[#363535]"
                  >
                    <Play className="h-4 w-4" />
                    Open viral video source
                  </a>
                )}

                <div className="mt-4 rounded-2xl border border-[#e8e8e4] bg-[#fcfcfa] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8a8a86]">Suggested next script section</p>
                  <pre className="whitespace-pre-wrap text-sm leading-6 text-[#3f3f3a]">{continuation}</pre>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
