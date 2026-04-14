'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Post = {
  id: string; title: string; slug: string; excerpt: string; content: string
  cover_image_url: string; tags: string[]; author_name: string; author_avatar: string | null
  blog_categories: { name: string; slug: string } | null
  published_at: string; created_at: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeUrl(url: string): string {
  const trimmed = url.trim()
  if (trimmed.startsWith('/')) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return '#'
}

function formatInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, label, href) => `<a href="${sanitizeUrl(href)}" target="_blank" rel="noopener noreferrer" class="text-link">${escapeHtml(label)}</a>`)
}

function calcReadingTime(text: string): number {
  if (!text) return 1
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
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

// ── Block-level renderers ──────────────────────────────────────────────────

function renderCallout(text: string): string {
  const stripped = text.replace(/^(NOTE|TIP|WARNING|EXAMPLE):?\s*/i, '')
  const rawType = text.match(/^(NOTE|TIP|WARNING|EXAMPLE)/i)?.[1]?.toLowerCase() || 'note'
  const type = rawType === 'tip' ? 'tip'
    : rawType === 'warning' ? 'warning'
    : rawType === 'example' ? 'example'
    : 'note'
  const icons: Record<string, string> = { tip: '💡', note: '📌', warning: '⚠️', example: '📖' }
  const icon = icons[type] || icons.note
  const title = type.charAt(0).toUpperCase() + type.slice(1)
  const inner = formatInline(stripped)
  return `<div class="callout callout-${type}"><div class="callout-header"><span>${icon}</span><strong>${title}</strong></div><div class="callout-body">${inner}</div></div>`
}

function renderImageWithCaption(src: string, alt: string, caption: string): string {
  return `<figure class="article-figure"><img src="${sanitizeUrl(src)}" alt="${escapeHtml(alt)}" loading="lazy" />${caption ? `<figcaption>${formatInline(caption)}</figcaption>` : ''}</figure>`
}

function renderInlineCTA(): string {
  return `<div class="inline-cta"><span>🚀</span><div><strong>Want more practical UGC insights?</strong><p>Join the Otto signup — the newsletter for tech creators who mean business.</p></div><a href="/signup" class="inline-cta-btn">Get Started →</a></div>`
}

function renderHorizontalRule(): string {
  return `<div class="hr-fade"><hr /><hr /><hr /></div>`
}

function renderSection(title: string, body: string, index: number): string {
  const anchor = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `<section class="article-section" id="${anchor}"><h2 class="section-title"><span class="section-num">0${index}</span>${escapeHtml(title)}</h2>${body}</section>`
}

function renderRelated(posts: Array<{slug: string; title: string; desc: string}>): string {
  if (!posts.length) return ''
  const items = posts.map(p => `
    <a href="/blog/${encodeURIComponent(p.slug)}" class="related-card">
      <span class="related-title">${escapeHtml(p.title)}</span>
      <span class="related-desc">${escapeHtml(p.desc)}</span>
      <span class="related-arrow">→</span>
    </a>
  `).join('')
  return `<div class="related-posts">
    <h3 class="related-heading">Keep Reading</h3>
    <div class="related-grid">${items}</div>
  </div>`
}

// ── Full markdown renderer ─────────────────────────────────────────────────

function renderMarkdown(content: string): { html: string; related: Array<{slug:string;title:string;desc:string}> } {
  const related: Array<{slug:string;title:string;desc:string}> = []
  const relatedMatch = content.match(/<!--\s*RELATED:?\n([\s\S]*?)-->/i)
  if (relatedMatch) {
    relatedMatch[1].split('\n').forEach(line => {
      const m = line.match(/^\s*-\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*$/)
      if (m) related.push({ slug: m[1].trim(), title: m[2].trim(), desc: m[3].trim() })
    })
    content = content.replace(/<!--\s*RELATED:?\n[\s\S]*?-->/gi, '')
  }

  const lines = content.split('\n')
  const blocks: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) { blocks.push('__HR__'); i++; continue }
    if (line.startsWith('> ')) {
      const rawLines: string[] = []
      while (i < lines.length && (lines[i].startsWith('>') || lines[i].trim() === '')) {
        if (lines[i].startsWith('>')) rawLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      blocks.push(renderCallout(rawLines.join(' ')))
      continue
    }
    if (line.match(/^!\[\[(.+?)\]\((.+?)\)\]/) || line.match(/^!\[(.*?)\]\((.+?)\)$/)) {
      const imgMatch = line.match(/^!\[(.*?)\]\((.+?)\)$/)
      const alt = imgMatch ? imgMatch[1] : ''
      const src = imgMatch ? imgMatch[2] : ''
      const captionLines: string[] = []
      i++
      while (i < lines.length && lines[i].startsWith('^')) {
        captionLines.push(lines[i].replace(/^\^/, '').trim())
        i++
      }
      blocks.push(renderImageWithCaption(src, alt, captionLines.join(' ')))
      continue
    }
    if (line.includes('{{CTA:')) { blocks.push(renderInlineCTA()); i++; continue }
    if (line.startsWith('## ')) { blocks.push(`__H2__${line.slice(3).trim()}__`); i++; continue }
    if (line.startsWith('### ')) { blocks.push(`__H3__${line.slice(4).trim()}__`); i++; continue }
    if (line.match(/^[-*]\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        const itemText = formatInline(lines[i].replace(/^[-*]\s/, ''))
        items.push(`<li>${itemText}</li>`)
        i++
      }
      blocks.push(`<ul class="article-list">${items.join('')}</ul>`)
      continue
    }
    if (line.trim()) {
      const paraLines: string[] = []
      while (i < lines.length && lines[i].trim() && !lines[i].match(/^(##|###|>|\*|--|!\[)/) && !lines[i].startsWith('{{')) {
        paraLines.push(lines[i])
        i++
      }
      const text = formatInline(paraLines.join(' ')).replace(/\{\{CTA:.*?\}\}/g, '')
      if (text.trim()) blocks.push(`<p>${text}</p>`)
      continue
    }
    i++
  }

  const htmlParts: string[] = []
  let sectionCount = 0
  let currentSectionContent = ''

  for (const block of blocks) {
    if (block === '__HR__') {
      if (currentSectionContent.trim()) { sectionCount++; htmlParts.push(renderSection(`Section ${sectionCount}`, currentSectionContent.trim(), sectionCount)); currentSectionContent = '' }
      htmlParts.push(renderHorizontalRule())
      continue
    }
    if (block.startsWith('__H2__')) {
      if (currentSectionContent.trim()) { sectionCount++; htmlParts.push(renderSection(`Section ${sectionCount}`, currentSectionContent.trim(), sectionCount)); currentSectionContent = '' }
      sectionCount++
      continue
    }
    if (block.startsWith('__H3__')) {
      const h3 = block.replace('__H3__', '').replace('__', '')
      currentSectionContent += `<h3>${h3}</h3>`
      continue
    }
    currentSectionContent += block
  }
  if (currentSectionContent.trim()) { sectionCount++; htmlParts.push(renderSection(`Section ${sectionCount}`, currentSectionContent.trim(), sectionCount)) }

  return { html: htmlParts.join('\n'), related }
}

// ── Page component ─────────────────────────────────────────────────────────

export default function BlogPostClient({ slug }: { slug: string }) {
  const params = useParams()
  const resolvedSlug = slug ?? (params.slug as string)
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [rendered, setRendered] = useState({ html: '', related: [] as Array<{slug:string;title:string;desc:string}> })
  const [readProgress, setReadProgress] = useState(0)
  const articleRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const seriesIndex = SERIES_SLUGS.indexOf(resolvedSlug)
  const isInSeries = seriesIndex !== -1
  const prevSlug = seriesIndex > 0 ? SERIES_SLUGS[seriesIndex - 1] : null
  const nextSlug = seriesIndex < SERIES_SLUGS.length - 1 ? SERIES_SLUGS[seriesIndex + 1] : null
  const readingTime = post ? calcReadingTime(post.content) : 0

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase
        .from('blog_posts')
        .select('*, blog_categories(name, slug)')
        .eq('slug', resolvedSlug)
        .eq('status', 'published')
        .single()
      if (!p) { setNotFound(true); setLoading(false); return }
      setPost(p as Post)
      const r = renderMarkdown((p as Post).content)
      setRendered(r)
      setLoading(false)
    }
    load()
  }, [resolvedSlug])

  // Scroll progress tracker
  useEffect(() => {
    const article = articleRef.current
    if (!article) return
    const handleScroll = () => {
      const rect = article.getBoundingClientRect()
      const articleHeight = article.offsetHeight
      const windowHeight = window.innerHeight
      const scrolled = Math.max(0, -rect.top)
      const total = articleHeight - windowHeight
      const progress = total > 0 ? Math.min(100, Math.round((scrolled / total) * 100)) : 0
      setReadProgress(progress)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [post])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound || !post) return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-2.5px', color: '#363535' }}>Post not found</h1>
        <p className="text-[#6b6b6b] mb-8">This post doesn&apos;t exist or has been removed.</p>
        <Link href="/blog" className="btn-primary inline-flex items-center gap-2 px-6 py-3">← Back to Blog</Link>
      </div>
    </div>
  )

  const pubDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-[#f0f0ec]">
        <div className="h-full bg-[#ccff00] transition-all duration-100 ease-out" style={{ width: `${readProgress}%` }} />
      </div>

      {/* Nav */}
      <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3.5 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <span style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '20px', letterSpacing: '-1px', color: '#363535' }}>Otto</span>
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/blog" className="text-sm font-medium text-[#6b6b6b] hover:text-[#363535] transition-colors">← Blog</Link>
          <Link href="/signup" className="btn-primary text-sm py-2 px-5">Get Started</Link>
        </div>
      </nav>

      <main className="max-w-[760px] mx-auto px-6 pt-32 pb-20" ref={articleRef}>

        {/* Article header */}
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <Link href="/blog" className="text-xs text-[#9a9a9a] hover:text-[#6b6b6b] transition-colors">Blog</Link>
            <span className="text-[#d0d0cc]">/</span>
            {isInSeries && (
              <Link href="/blog/0-to-1000-in-30-days"
                className="text-xs font-semibold bg-[#ccff00] text-[#1c1c1e] px-2.5 py-1 rounded-full hover:bg-[#d9ff4d] transition-colors">
                0 to £1,000 Series
              </Link>
            )}
            {post.blog_categories && !isInSeries && (
              <span className="text-xs font-semibold text-[#363535] bg-[#f0f0ec] px-2.5 py-1 rounded-full">
                {post.blog_categories.name}
              </span>
            )}
          </div>

          <h1 className="mb-4" style={{
            fontFamily: 'var(--font-bricolage)',
            fontWeight: 700,
            fontSize: 'clamp(28px, 5vw, 46px)',
            lineHeight: 1.06,
            letterSpacing: '-2.5px',
            color: '#1c1c1e',
          }}>
            {post.title}
          </h1>

          {post.excerpt && (
            <p style={{ fontFamily: 'var(--font-open-sans)', fontSize: '18px', lineHeight: 1.65, color: '#6b6b6b' }}>
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 mt-6 pt-5 border-t border-[#f0f0ec]">
            <div className="w-9 h-9 rounded-full bg-[#1c1c1e] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {post.author_name?.[0] || 'O'}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#363535]">{post.author_name}</p>
              <p className="text-xs text-[#9a9a9a]">
                {pubDate}
                {isInSeries ? ` · Day ${seriesIndex + 1} of 30` : ''}
                {readingTime > 0 ? ` · ${readingTime} min read` : ''}
              </p>
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
        <div className="article-body" dangerouslySetInnerHTML={{ __html: rendered.html }} />

        {/* Series CTA */}
        {isInSeries && (
          <div className="mt-12 p-7 bg-[#1c1c1e] rounded-2xl text-center">
            <p className="mb-1" style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: '18px', letterSpacing: '-0.5px', color: '#fff' }}>
              {seriesIndex === 0 ? 'Start your journey:' : seriesIndex < 29 ? `Day ${seriesIndex + 1} of 30` : 'You finished the series!'}
            </p>
            <p className="text-white/50 text-sm mb-4">
              {seriesIndex === 0 ? 'This is part of the free £0 to £1,000 in 30 Days series.' : seriesIndex < 29 ? 'Keep going — the next step is where it clicks.' : 'Now plan your next 90 days.'}
            </p>
            <Link href={seriesIndex === 0 ? '/blog/0-to-1000-in-30-days' : nextSlug ? `/blog/${nextSlug}` : '/blog/0-to-1000-in-30-days'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ccff00] text-[#1c1c1e] rounded-xl text-sm font-bold hover:bg-[#d9ff4d] transition-colors">
              {seriesIndex === 0 ? 'Read the Full Series' : seriesIndex < 29 ? `Next: Day ${seriesIndex + 2} →` : 'Back to Series Overview'}
            </Link>
          </div>
        )}

        {/* Regular CTA */}
        {!isInSeries && (
          <div className="mt-12 p-7 bg-[#1c1c1e] rounded-2xl text-center">
            <div className="text-2xl mb-2">🚀</div>
            <p className="mb-2" style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: '20px', letterSpacing: '-0.5px', color: '#fff' }}>
              Want more practical UGC insights?
            </p>
            <p className="text-white/50 text-sm mb-5">Join the Otto signup — the newsletter for tech creators who mean business.</p>
            <Link href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ccff00] text-[#1c1c1e] rounded-xl text-sm font-bold hover:bg-[#d9ff4d] transition-colors">
              Get Started →
            </Link>
          </div>
        )}

        {/* Related posts */}
        {rendered.related.length > 0 && (
          <div className="mt-12">{renderRelated(rendered.related)}</div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex items-start gap-2 mt-10 pt-8 border-t border-[#f0f0ec] flex-wrap">
            <span className="text-xs text-[#9a9a9a] pt-1">Tagged:</span>
            {post.tags.map(tag => (
              <span key={tag} className="text-xs text-[#6b6b6b] bg-[#f0f0ec] px-3 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        {/* Prev/Next */}
        {isInSeries && (
          <div className="mt-8 grid grid-cols-2 gap-3">
            {prevSlug ? (
              <Link href={`/blog/${prevSlug}`}
                className="flex flex-col gap-1 p-4 bg-white border border-[#e8e8e4] rounded-xl hover:border-[#ccff00] hover:-translate-y-0.5 hover:shadow-md transition-all group">
                <span className="text-xs text-[#9a9a9a] group-hover:text-[#363535]">← Previous</span>
                <span className="text-xs font-semibold text-[#363535] group-hover:text-[#1c1c1e]">Day {seriesIndex} · {SERIES_SLUGS[seriesIndex - 1].replace(/day-/i,'Day ').replace(/-/g,' ')}</span>
              </Link>
            ) : <div />}
            {nextSlug && (
              <Link href={`/blog/${nextSlug}`}
                className="flex flex-col gap-1 p-4 bg-white border border-[#e8e8e4] rounded-xl hover:border-[#ccff00] hover:-translate-y-0.5 hover:shadow-md transition-all group text-right">
                <span className="text-xs text-[#9a9a9a] group-hover:text-[#363535]">Next →</span>
                <span className="text-xs font-semibold text-[#363535] group-hover:text-[#1c1c1e]">Day {seriesIndex + 2} · {nextSlug.replace(/day-/i,'Day ').replace(/-/g,' ')}</span>
              </Link>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href={isInSeries ? '/blog/0-to-1000-in-30-days' : '/blog'}
            className="text-sm text-[#9a9a9a] hover:text-[#6b6b6b] transition-colors inline-flex items-center gap-1">
            ← {isInSeries ? 'Series Overview' : 'Back to Blog'}
          </Link>
        </div>
      </main>

      <style jsx global>{`
        .article-body { font-family: var(--font-open-sans); color: #1c1c1e; }
        .article-body p { font-size: 17px; line-height: 1.75; margin: 0 0 1.4em; color: #363535; }
        .article-body h2 { font-family: var(--font-bricolage); font-weight: 600; font-size: 22px; letter-spacing: -1px; color: #1c1c1e; margin: 2.5em 0 0.75em; line-height: 1.2; }
        .article-body h3 { font-family: var(--font-bricolage); font-weight: 600; font-size: 17px; letter-spacing: -0.5px; color: #363535; margin: 1.75em 0 0.5em; }
        .article-body .article-list { margin: 0 0 1.4em; padding-left: 1.5em; }
        .article-body .article-list li { font-size: 17px; line-height: 1.7; color: #363535; margin-bottom: 0.5em; }
        .article-body .article-list li::marker { color: #ccff00; }
        .article-body a.text-link { color: #363535; text-decoration: underline; text-decoration-color: #ccff00; text-underline-offset: 3px; }
        .article-body a.text-link:hover { color: #1c1c1e; }
        .article-body code { background: #f0f0ec; padding: 2px 6px; border-radius: 4px; font-size: 14px; font-family: monospace; }
        .callout { border-radius: 12px; padding: 16px 20px; margin: 1.75em 0; border-left: 4px solid; }
        .callout-note { background: #f0f0ec; border-color: #363535; }
        .callout-tip { background: #f9ffef; border-color: #84cc16; }
        .callout-warning { background: #fff9e6; border-color: #f59e0b; }
        .callout-example { background: #f0f9ff; border-color: #3b82f6; }
        .callout-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .callout-note .callout-header { color: #363535; }
        .callout-tip .callout-header { color: #4a7c0f; }
        .callout-warning .callout-header { color: #b45309; }
        .callout-example .callout-header { color: #1d4ed8; }
        .callout-body { font-size: 15px; line-height: 1.65; color: #363535; }
        .pull-quote { border-left: 4px solid #ccff00; margin: 2em 0; padding: 8px 0 8px 24px; }
        .pull-quote p { font-family: var(--font-bricolage); font-size: 20px; font-weight: 600; letter-spacing: -0.5px; color: #1c1c1e; line-height: 1.4; font-style: italic; margin: 0; }
        .article-figure { margin: 2em 0; }
        .article-figure img { width: 100%; border-radius: 12px; border: 1px solid #e8e8e4; }
        .article-figure figcaption { font-size: 13px; color: #9a9a9a; text-align: center; margin-top: 8px; font-style: italic; }
        .inline-cta { display: flex; align-items: center; gap: 16px; background: #1c1c1e; border-radius: 16px; padding: 20px 24px; margin: 2.5em 0; }
        .inline-cta span { font-size: 28px; flex-shrink: 0; }
        .inline-cta div { flex: 1; }
        .inline-cta strong { display: block; font-family: var(--font-bricolage); font-size: 15px; font-weight: 600; color: #fff; letter-spacing: -0.3px; margin-bottom: 3px; }
        .inline-cta p { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0; }
        .inline-cta-btn { flex-shrink: 0; background: #ccff00; color: #1c1c1e; font-weight: 700; font-size: 13px; padding: 8px 16px; border-radius: 8px; text-decoration: none; transition: background 0.15s; }
        .inline-cta-btn:hover { background: #d9ff4d; }
        .article-section { margin-bottom: 3em; }
        .section-title { display: flex; align-items: center; gap: 12px; font-family: var(--font-bricolage); font-weight: 700; font-size: clamp(18px, 2.5vw, 22px); letter-spacing: -1px; color: #1c1c1e; margin-bottom: 1em; padding-bottom: 10px; border-bottom: 2px solid #f0f0ec; }
        .section-num { font-size: 11px; font-weight: 700; background: #ccff00; color: #1c1c1e; padding: 3px 8px; border-radius: 6px; letter-spacing: 0; flex-shrink: 0; }
        .hr-fade { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 3em 0; opacity: 0.2; }
        .hr-fade hr { width: 60px; border: none; border-top: 2px solid #363535; }
        .related-posts { margin-top: 3em; padding-top: 2em; border-top: 2px solid #f0f0ec; }
        .related-heading { font-family: var(--font-bricolage); font-weight: 700; font-size: 18px; letter-spacing: -0.5px; color: #363535; margin-bottom: 1em; }
        .related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        .related-card { display: flex; flex-direction: column; gap: 4px; padding: 16px; background: white; border: 1.5px solid #e8e8e4; border-radius: 14px; text-decoration: none; transition: all 0.15s; }
        .related-card:hover { border-color: #ccff00; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.07); }
        .related-title { font-weight: 600; font-size: 14px; color: #1c1c1e; line-height: 1.3; }
        .related-desc { font-size: 12px; color: #9a9a9a; line-height: 1.5; flex: 1; }
        .related-arrow { font-size: 14px; color: #ccff00; margin-top: 4px; }
        .share-bar { display: flex; align-items: center; gap: 8px; margin-top: 3em; padding-top: 2em; border-top: 2px solid #f0f0ec; flex-wrap: wrap; }
        .share-label { font-family: var(--font-bricolage); font-weight: 700; font-size: 14px; color: #363535; }
        .share-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 999px; font-size: 13px; font-weight: 600; text-decoration: none; transition: all 0.15s; cursor: pointer; border: none; }
        .share-btn.twitter { background: #000; color: #fff; }
        .share-btn.twitter:hover { background: #1a1a1a; }
        .share-btn.linkedin { background: #0077b5; color: #fff; }
        .share-btn.linkedin:hover { background: #006399; }
        .share-btn.copy { background: #f0f0ec; color: #363535; }
        .share-btn.copy:hover { background: #e8e8e4; }
        .newsletter-cta { background: #1c1c1e; border-radius: 20px; padding: 40px; margin-top: 4em; text-align: center; }
        .newsletter-eyebrow { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
        .newsletter-heading { font-family: var(--font-bricolage); font-weight: 700; font-size: 28px; color: #fff; letter-spacing: -1.5px; margin-bottom: 12px; }
        .newsletter-sub { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.6; max-width: 400px; margin: 0 auto 24px; }
        .newsletter-form { display: flex; gap: 8px; max-width: 400px; margin: 0 auto; }
        .newsletter-input { flex: 1; padding: 12px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; font-size: 14px; color: #fff; outline: none; }
        .newsletter-input::placeholder { color: rgba(255,255,255,0.3); }
        .newsletter-input:focus { border-color: #ccff00; }
        .newsletter-btn { padding: 12px 20px; background: #ccff00; color: #1c1c1e; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; white-space: nowrap; }
        .newsletter-btn:hover { background: #b8e600; }
        .newsletter-success { font-size: 13px; color: #ccff00; margin-top: 12px; font-weight: 600; }
      `}</style>
    </div>
  )
}
