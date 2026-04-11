'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Post = {
  id: string; title: string; slug: string; excerpt: string; content: string
  cover_image_url: string; tags: string[]; author_name: string
  blog_categories: { name: string; slug: string } | null
  published_at: string; created_at: string
}

const SERIES_SLUGS = [
  'day-1-first-ugc-profile','day-2-finding-first-deal','day-3-write-pitch-that-gets-response',
  'day-4-setting-your-rate','day-5-legal-stuff','day-6-portfolio-page-that-converts',
  'day-7-first-200-deal','day-8-one-deal-into-three','day-9-content-stack-you-need',
  'day-10-first-piece-of-ugc-content','day-11-what-brands-actually-want',
  'day-12-pricing-second-third-deal','day-13-building-brand-relationships',
  'day-14-when-brand-says-no','day-15-first-retainer-client','day-16-first-1000-month',
  'day-17-understanding-your-numbers','day-18-saying-no-to-bad-deals',
  'day-19-content-system-that-scales','day-20-using-ai-without-sounding-like-ai',
  'day-21-building-email-list-day-zero','day-22-first-recurring-brand-relationship',
  'day-23-networking-with-other-creators','day-24-expanding-to-second-platform',
  'day-25-protecting-yourself-and-work','day-26-raising-your-rates',
  'day-27-first-3000-month','day-28-building-brand-demand',
  'day-29-planning-next-90-days','day-30-where-to-go-from-here',
]

function renderMarkdown(text: string): string {
  if (!text) return ''
  const blocks = text.split(/\n{2,}/)
  return blocks.map(block => {
    const b = block.trim()
    if (!b) return ''
    if (b.startsWith('## ')) {
      const inner = b.slice(3)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
      return `<h2>${inner}</h2>`
    }
    if (b.startsWith('### ')) {
      const inner = b.slice(4)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
      return `<h3>${inner}</h3>`
    }
    if (b.startsWith('- ') || b.startsWith('* ')) {
      const items = b.split('\n').filter(l => l.trim())
      const htmlItems = items.map(l =>
        `<li>${l.replace(/^[\-\*]\s/, '')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`(.+?)`/g, '<code>$1</code>')
        }</li>`
      ).join('')
      return `<ul>${htmlItems}</ul>`
    }
    if (b === '---' || b === '***' || b === '___') return '<hr>'
    const inner = b
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-link" target="_blank" rel="noopener">$1</a>')
    return `<p>${inner}</p>`
  }).join('\n')
}

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const supabase = createClient()

  const seriesIndex = SERIES_SLUGS.indexOf(slug)
  const isInSeries = seriesIndex !== -1
  const prevSlug = seriesIndex > 0 ? SERIES_SLUGS[seriesIndex - 1] : null
  const nextSlug = seriesIndex < SERIES_SLUGS.length - 1 ? SERIES_SLUGS[seriesIndex + 1] : null

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase
        .from('blog_posts')
        .select('*, blog_categories(name, slug)')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()
      if (!p) { setNotFound(true); setLoading(false); return }
      setPost(p as Post)
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound || !post) return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }} className="mb-3">Post not found</h1>
        <p className="text-[#6b6b6b] mb-8">This post doesn&apos;t exist or has been removed.</p>
        <Link href="/blog" className="btn-primary inline-flex items-center gap-2 px-6 py-3">← Back to Blog</Link>
      </div>
    </div>
  )

  const rendered = renderMarkdown(post.content)
  const pubDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Nav */}
      <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3.5 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-extrabold font-display tracking-tight" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>Otto</span>
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/blog" className="text-sm font-medium text-[#6b6b6b] hover:text-[#363535] transition-colors">← Blog</Link>
          <Link href="/signup" className="btn-primary text-sm py-2 px-5">Get Started</Link>
        </div>
      </nav>

      <article className="max-w-[720px] mx-auto px-6 pt-32 pb-20">

        {/* Header */}
        <header className="mb-10">
          {/* Breadcrumb + series badge */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <Link href="/blog" className="text-xs text-[#9a9a9a] hover:text-[#6b6b6b] transition-colors">Blog</Link>
            <span className="text-[#d0d0cc]">/</span>
            {isInSeries && (
              <Link href="/blog/0-to-1000-in-30-days" className="text-xs font-semibold bg-[#ccff00] text-[#1c1c1c] px-2.5 py-1 rounded-full hover:bg-[#d9ff4d] transition-colors">
                0 to £1,000 Series
              </Link>
            )}
            {post.blog_categories && !isInSeries && (
              <span className="text-xs font-semibold text-[#363535] bg-[#f0f0ec] px-2.5 py-1 rounded-full">
                {post.blog_categories.name}
              </span>
            )}
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-bricolage)',
            fontWeight: 700,
            fontSize: 'clamp(28px, 5vw, 44px)',
            lineHeight: 1.08,
            letterSpacing: '-2.5px',
            color: '#1c1c1c',
          }}>
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p style={{ fontFamily: 'var(--font-open-sans)', fontSize: '18px', lineHeight: 1.6, color: '#6b6b6b', marginTop: '16px' }}>
              {post.excerpt}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-4 mt-6 pt-6 border-t border-[#f0f0ec]">
            <div className="w-9 h-9 rounded-full bg-[#1c1c1c] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {post.author_name?.[0] || 'O'}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#363535]">{post.author_name}</p>
              <p className="text-xs text-[#9a9a9a]">{pubDate}{isInSeries ? ` · Day ${seriesIndex + 1} of 30` : ''}</p>
            </div>
          </div>
        </header>

        {/* Cover image */}
        {post.cover_image_url && (
          <div className="rounded-2xl overflow-hidden mb-10 border border-[#e8e8e4] aspect-video bg-[#f0f0ec]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Article body */}
        <div className="prose-blog" dangerouslySetInnerHTML={{ __html: rendered }} />

        {/* Series CTA — only for series posts */}
        {isInSeries && (
          <div className="mt-12 p-7 bg-[#1c1c1c] rounded-2xl text-center">
            <p style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: '18px', letterSpacing: '-1px', color: '#fff' }} className="mb-1">
              {seriesIndex === 0 ? 'Start your journey:' : seriesIndex < 29 ? `Day ${seriesIndex + 1} of 30` : 'You finished the series!'}
            </p>
            <p className="text-white/50 text-sm mb-4">
              {seriesIndex === 0 ? 'This is part of the free £0 to £1,000 in 30 Days series.' : seriesIndex < 29 ? 'Keep going — the next step is where it clicks.' : 'Now plan your next 90 days.'}
            </p>
            <Link
              href={seriesIndex === 0 ? '/blog/0-to-1000-in-30-days' : nextSlug ? `/blog/${nextSlug}` : '/blog/0-to-1000-in-30-days'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ccff00] text-[#1c1c1c] rounded-xl text-sm font-bold hover:bg-[#d9ff4d] transition-colors"
            >
              {seriesIndex === 0 ? 'Read the Full Series' : seriesIndex < 29 ? `Next: Day ${seriesIndex + 2} →` : 'Back to Series Overview'}
            </Link>
          </div>
        )}

        {/* Regular CTA — non-series posts */}
        {!isInSeries && (
          <div className="mt-12 p-7 bg-[#1c1c1c] rounded-2xl text-center">
            <div className="text-2xl mb-2">🚀</div>
            <p style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: '20px', letterSpacing: '-1px', color: '#ffffff' }} className="mb-2">
              Want more practical UGC insights?
            </p>
            <p className="text-white/50 text-sm mb-5">Join the Otto signup — the newsletter for tech creators who mean business.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-[#ccff00] text-[#1c1c1c] rounded-xl text-sm font-bold hover:bg-[#d9ff4d] transition-colors">
              Get Started →
            </Link>
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex items-start gap-2 mt-10 pt-8 border-t border-[#e8e8e4] flex-wrap">
            <span className="text-xs text-[#9a9a9a] pt-1">Tagged:</span>
            {post.tags.map(tag => (
              <span key={tag} className="text-xs text-[#6b6b6b] bg-[#f0f0ec] px-3 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        {/* Prev/Next navigation — series only */}
        {isInSeries && (
          <div className="mt-8 grid grid-cols-2 gap-3">
            {prevSlug ? (
              <Link href={`/blog/${prevSlug}`} className="flex flex-col gap-1 p-4 bg-white border border-[#e8e8e4] rounded-xl hover:border-[#ccff00] hover:-translate-y-0.5 hover:shadow-md transition-all group">
                <span className="text-xs text-[#9a9a9a] group-hover:text-[#363535]">← Previous</span>
                <span style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: '13px', letterSpacing: '-0.5px', color: '#363535' }} className="group-hover:text-[#1c1c1e]">Day {seriesIndex} · {SERIES_SLUGS[seriesIndex - 1].replace('day-', 'Day ').replace(/-/g, ' ')}</span>
              </Link>
            ) : <div />}
            {nextSlug && (
              <Link href={`/blog/${nextSlug}`} className="flex flex-col gap-1 p-4 bg-white border border-[#e8e8e4] rounded-xl hover:border-[#ccff00] hover:-translate-y-0.5 hover:shadow-md transition-all group text-right">
                <span className="text-xs text-[#9a9a9a] group-hover:text-[#363535]">Next →</span>
                <span style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: '13px', letterSpacing: '-0.5px', color: '#363535' }} className="group-hover:text-[#1c1c1e]">Day {seriesIndex + 2} · {nextSlug.replace('day-', 'Day ').replace(/-/g, ' ')}</span>
              </Link>
            )}
          </div>
        )}

        {/* Bottom nav */}
        <div className="mt-8 text-center">
          <Link href={isInSeries ? '/blog/0-to-1000-in-30-days' : '/blog'} className="text-sm text-[#9a9a9a] hover:text-[#6b6b6b] transition-colors inline-flex items-center gap-1">
            ← {isInSeries ? 'Series Overview' : 'Back to Blog'}
          </Link>
        </div>
      </article>
    </div>
  )
}
