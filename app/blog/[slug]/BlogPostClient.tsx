'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

// ── Types ───────────────────────────────────────────────────────────────────

type Post = {
  id: string; title: string; slug: string; excerpt: string; content: string
  cover_image_url: string; tags: string[]; author_name: string; author_avatar: string | null
  author_bio?: string; author_twitter?: string
  blog_categories: { name: string; slug: string } | null
  published_at: string; created_at: string; updated_at?: string
  seo_title?: string; seo_description?: string; canonical_url?: string
  read_time_minutes?: number
}

type FaqItem = { question: string; answer: string }

// ── Helpers ────────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeUrl(url: string): string {
  const t = url.trim()
  if (t.startsWith('/')) return t
  if (/^https?:\/\//i.test(t)) return t
  return '#'
}

function formatInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, label, href) =>
      `<a href="${sanitizeUrl(href)}" class="text-link">${escapeHtml(label)}</a>`)
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
// Parses the custom markdown flavour used in blog posts:
// ## H2           → section heading
// ### H3          → sub-heading
// > blockquote     → callout
// ![alt](url)     → figure
// ^ caption line  → figcaption (after image line)
// - item          → list item
// ---             → hr divider
// {{CTA}}         → inline CTA
// {{BLUF}}...{{/BLUF}} → direct answer / TL;DR box
// {{KEYTAKEAWAYS}} → bullets list rendered as takeaways
// {{FAQ}}Q|A{{/FAQ}} → FAQ accordion items
// <!--RELATED: slug|Title|Desc--> → related posts

function parseBluf(content: string): string {
  const match = content.match(/\{\{BLUF\}\}([\s\S]*?)\{\{\/BLUF\}\}/)
  return match ? match[1].trim() : ''
}

function parseKeyTakeaways(content: string): string[] {
  const match = content.match(/\{\{KEYTAKEAWAYS\}\}([\s\S]*?)\{\{\/KEYTAKEAWAYS\}\}/)
  if (!match) return []
  return match[1].split('\n')
    .map(l => l.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
}

function parseFaqs(content: string): FaqItem[] {
  const match = content.match(/\{\{FAQ\}\}([\s\S]*?)\{\{\/FAQ\}\}/)
  if (!match) return []
  return match[1].split('\n')
    .filter(l => l.includes('|'))
    .map(l => {
      const [question, ...rest] = l.split('|')
      return { question: question.trim().replace(/^Q:\s*/i, ''), answer: rest.join('|').trim().replace(/^A:\s*/i, '') }
    })
    .filter(f => f.question && f.answer)
}

function parseRelated(content: string): Array<{slug: string; title: string; desc: string}> {
  const match = content.match(/<!--\s*RELATED:?\n([\s\S]*?)-->/i)
  if (!match) return []
  return match[1].split('\n')
    .map(l => {
      const m = l.match(/^\s*-\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*$/)
      if (m) return { slug: m[1].trim(), title: m[2].trim(), desc: m[3].trim() }
      return null
    })
    .filter(Boolean) as Array<{slug: string; title: string; desc: string}>
}

function stripMeta(content: string): string {
  return content
    .replace(/\{\{BLUF\}\}[\s\S]*?\{\{\/BLUF\}\}/g, '')
    .replace(/\{\{KEYTAKEAWAYS\}\}[\s\S]*?\{\{\/KEYTAKEAWAYS\}\}/g, '')
    .replace(/\{\{FAQ\}\}[\s\S]*?\{\{\/FAQ\}\}/g, '')
    .replace(/<!--\s*RELATED:?\n[\s\S]*?-->/gi, '')
    .replace(/\{\{CTA\}\}/g, '')
}

function calcReadingTime(text: string): number {
  if (!text) return 1
  return Math.max(1, Math.round(text.trim().split(/\s+/).length / 200))
}

function renderBody(content: string): string {
  const lines = stripMeta(content).split('\n')
  const blocks: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) { blocks.push('__HR__'); i++; continue }
    if (line.startsWith('> ')) {
      const raw: string[] = []
      while (i < lines.length && (lines[i].startsWith('>') || lines[i].trim() === '')) {
        if (lines[i].startsWith('>')) raw.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      const type = raw[0]?.match(/^(TIP|NOTE|WARNING|EXAMPLE):?/i)?.[1]?.toLowerCase() || 'note'
      const icons: Record<string, string> = { tip: '💡', note: '📌', warning: '⚠️', example: '📖' }
      const titles: Record<string, string> = { tip: 'Tip', note: 'Note', warning: 'Important', example: 'Example' }
      const stripped = raw.join(' ').replace(/^(TIP|NOTE|WARNING|EXAMPLE):?\s*/i, '')
      blocks.push(`<div class="callout callout-${type}"><div class="callout-header"><span>${icons[type]}</span><strong>${titles[type]}</strong></div><div class="callout-body">${formatInline(stripped)}</div></div>`)
      continue
    }
    if (line.match(/^!\[\[(.+?)\]\((.+?)\)\]/)) {
      const imgMatch = line.match(/^!\[(.*?)\]\((.+?)\)$/)
      if (imgMatch) {
        const alt = imgMatch[1]; const src = imgMatch[2]
        const captionLines: string[] = []
        i++
        while (i < lines.length && lines[i].startsWith('^')) {
          captionLines.push(lines[i].replace(/^\^/, '').trim())
          i++
        }
        blocks.push(`<figure class="article-figure"><img src="${sanitizeUrl(src)}" alt="${escapeHtml(alt)}" loading="lazy" />${captionLines.length ? `<figcaption>${formatInline(captionLines.join(' '))}</figcaption>` : ''}</figure>`)
      }
      continue
    }
    if (line.includes('{{CTA}}')) { blocks.push(renderInlineCTA()); i++; continue }
    if (line.startsWith('## ')) { blocks.push(`__SECTION__${line.slice(3).trim()}`); i++; continue }
    if (line.startsWith('### ')) { blocks.push(`<h3>${escapeHtml(line.slice(4).trim())}</h3>`); i++; continue }
    if (line.match(/^[-*]\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        items.push(`<li>${formatInline(lines[i].replace(/^[-*]\s/, ''))}</li>`)
        i++
      }
      blocks.push(`<ul class="article-list">${items.join('')}</ul>`)
      continue
    }
    if (line.trim()) {
      const para: string[] = []
      while (i < lines.length && lines[i].trim() && !lines[i].match(/^(##|###|>|\*|--|!\[)/) && !lines[i].startsWith('{{')) {
        para.push(lines[i]); i++
      }
      const text = formatInline(para.join(' ')).replace(/\{\{CTA.*?\}\}/g, '')
      if (text.trim()) blocks.push(`<p>${text}</p>`)
      continue
    }
    i++
  }
  return blocks.join('\n')
}

function renderInlineCTA(): string {
  return `<div class="inline-cta">
    <span>🚀</span>
    <div>
      <strong>Want to follow along as Otto gets built?</strong>
      <p>Join the Otto signup — the newsletter for tech UGC creators who mean business.</p>
    </div>
    <a href="/signup" class="inline-cta-btn">Get Started →</a>
  </div>`
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

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ── JSON-LD helpers ───────────────────────────────────────────────────────────

function buildJsonLd(post: Post, faqs: FaqItem[]) {
  const baseUrl = 'https://ottougc.com'
  const articleUrl = `${baseUrl}/blog/${post.slug}`
  const publishedTime = post.published_at
  const modifiedTime = post.updated_at || post.published_at

  const author = {
    '@type': 'Person',
    name: post.author_name || 'Otto',
    url: `${baseUrl}/blog`,
    description: post.author_bio || 'The AI agent building Otto in public — a UGC platform for tech creators.',
  }

  const schemas: Record<string, object> = {
    article: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      url: articleUrl,
      datePublished: publishedTime,
      dateModified: modifiedTime,
      author,
      publisher: { '@type': 'Organization', name: 'Otto', url: baseUrl },
      mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
      ...(post.cover_image_url ? { image: { '@type': 'ImageObject', url: post.cover_image_url } } : {}),
    },
    author,
    ...(faqs.length ? {
      faq: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    } : {}),
  }

  return schemas
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BlogPostClient({ slug }: { slug: string }) {
  const params = useParams()
  const resolvedSlug = slug ?? (params.slug as string)
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [readProgress, setReadProgress] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const articleRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const seriesIndex = SERIES_SLUGS.indexOf(resolvedSlug)
  const isInSeries = seriesIndex !== -1
  const prevSlug = seriesIndex > 0 ? SERIES_SLUGS[seriesIndex - 1] : null
  const nextSlug = seriesIndex < SERIES_SLUGS.length - 1 ? SERIES_SLUGS[seriesIndex + 1] : null

  // Derived data
  const bluf = post ? parseBluf(post.content) : ''
  const keyTakeaways = post ? parseKeyTakeaways(post.content) : []
  const faqs = post ? parseFaqs(post.content) : []
  const related = post ? parseRelated(post.content) : []
  const body = post ? renderBody(post.content) : ''
  const readingTime = post?.read_time_minutes ?? (post ? calcReadingTime(post.content) : 0)
  const pubDate = post?.published_at ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  // JSON-LD
  const jsonLd = post ? buildJsonLd(post, faqs) : null

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
      setLoading(false)
    }
    load()
  }, [resolvedSlug])

  useEffect(() => {
    const article = articleRef.current
    if (!article) return
    const handleScroll = () => {
      const rect = article.getBoundingClientRect()
      const scrolled = Math.max(0, -rect.top)
      const total = article.offsetHeight - window.innerHeight
      setReadProgress(total > 0 ? Math.min(100, Math.round((scrolled / total) * 100)) : 0)
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

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* JSON-LD schemas */}
      {jsonLd && Object.entries(jsonLd).map(([key, schema]) => (
        <script
          key={key}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* Reading progress */}
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

        {/* ── Article header ── */}
        <header>
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <Link href="/blog" className="text-xs text-[#9a9a9a] hover:text-[#6b6b6b] transition-colors">Blog</Link>
            <span className="text-[#d0d0cc]">/</span>
            {isInSeries && (
              <Link href="/blog/0-to-1000-in-30-days" className="text-xs font-semibold bg-[#ccff00] text-[#1c1c1e] px-2.5 py-1 rounded-full hover:bg-[#d9ff4d] transition-colors">
                0 to £1,000 Series
              </Link>
            )}
            {post.blog_categories && !isInSeries && (
              <span className="text-xs font-semibold text-[#363535] bg-[#f0f0ec] px-2.5 py-1 rounded-full">{post.blog_categories.name}</span>
            )}
          </div>

          <h1 style={{
            fontFamily: 'var(--font-bricolage)', fontWeight: 700,
            fontSize: 'clamp(28px, 5vw, 46px)', lineHeight: 1.06, letterSpacing: '-2.5px', color: '#1c1c1e',
          }}>
            {post.title}
          </h1>

          {/* ── Author box ── */}
          <div className="flex items-start gap-4 mt-7 pb-7 border-b border-[#f0f0ec]">
            <div className="w-12 h-12 rounded-full bg-[#1c1c1e] flex items-center justify-center text-white text-base font-bold flex-shrink-0 overflow-hidden">
              {post.author_avatar
                ? <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" />
                : (post.author_name?.[0] ?? 'O')}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-[#363535] leading-tight">{post.author_name || 'Otto'}</p>
              {post.author_bio && (
                <p className="text-sm text-[#6b6b6b] leading-snug mt-0.5">{post.author_bio}</p>
              )}
              {post.author_twitter && (
                <a href={`https://twitter.com/${post.author_twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#9a9a9a] hover:text-[#363535] mt-1 transition-colors">
                  <XIcon /> {post.author_twitter}
                </a>
              )}
              <p className="text-xs text-[#9a9a9a] mt-1.5">
                {pubDate}
                {isInSeries ? ` · Day ${seriesIndex + 1} of 30` : ''}
                {readingTime > 0 ? ` · ${readingTime} min read` : ''}
              </p>
            </div>
          </div>
        </header>

        {/* ── Cover image ── */}
        {post.cover_image_url && (
          <div className="rounded-2xl overflow-hidden my-8 border border-[#e8e8e4] aspect-video bg-[#f0f0ec]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* ── Article body ── */}
        <article className="article-body">

          {/* ── BLUF / TL;DR ── */}
          {bluf && (
            <div className="bluf-block">
              <p>{bluf}</p>
            </div>
          )}

          {/* ── Key takeaways ── */}
          {keyTakeaways.length > 0 && (
            <div className="key-takeaways">
              <h2 className="takeaways-heading">Key Takeaways</h2>
              <ul className="takeaways-list">
                {keyTakeaways.map((item, i) => (
                  <li key={i}>{formatInline(item)}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Body content ── */}
          <div dangerouslySetInnerHTML={{ __html: body }} />

          {/* ── FAQ accordion ── */}
          {faqs.length > 0 && (
            <section className="faq-section" aria-label="Frequently asked questions">
              <h2 className="faq-heading">Frequently Asked Questions</h2>
              <div className="faq-list">
                {faqs.map((faq, i) => (
                  <div key={i} className={`faq-item${openFaq === i ? ' faq-open' : ''}`}>
                    <button
                      className="faq-question"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      aria-expanded={openFaq === i}
                    >
                      <span>{faq.question}</span>
                      <span className="faq-chevron">‹</span>
                    </button>
                    <div className="faq-answer">{formatInline(faq.answer)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── What's Next footer ── */}
          <div className="whats-next">
            <h2 className="whats-next-heading">What&apos;s Next</h2>
            <div className="whats-next-links">
              <Link href="/signup" className="whats-next-card whats-next-cta">
                <span className="whats-next-eyebrow">Subscribe</span>
                <span className="whats-next-title">Get the next post in your inbox</span>
                <span className="whats-next-desc">Join the Otto newsletter — no spam, just the good stuff.</span>
              </Link>
              {related.slice(0, 2).map(r => (
                <Link key={r.slug} href={`/blog/${r.slug}`} className="whats-next-card">
                  <span className="whats-next-eyebrow">Related</span>
                  <span className="whats-next-title">{r.title}</span>
                  <span className="whats-next-desc">{r.desc}</span>
                </Link>
              ))}
              <Link href="/blog" className="whats-next-card">
                <span className="whats-next-eyebrow">Explore</span>
                <span className="whats-next-title">Browse all posts</span>
                <span className="whats-next-desc">More UGC insights on the Otto blog.</span>
              </Link>
            </div>
          </div>

        </article>

        {/* ── Tags ── */}
        {post.tags?.length > 0 && (
          <div className="flex items-start gap-2 mt-10 pt-8 border-t border-[#f0f0ec] flex-wrap">
            <span className="text-xs text-[#9a9a9a] pt-1">Tagged:</span>
            {post.tags.map(tag => (
              <span key={tag} className="text-xs text-[#6b6b6b] bg-[#f0f0ec] px-3 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        {/* ── Series prev/next ── */}
        {isInSeries && (
          <div className="mt-8 grid grid-cols-2 gap-3">
            {prevSlug ? (
              <Link href={`/blog/${prevSlug}`} className="flex flex-col gap-1 p-4 bg-white border border-[#e8e8e4] rounded-xl hover:border-[#ccff00] hover:-translate-y-0.5 hover:shadow-md transition-all group">
                <span className="text-xs text-[#9a9a9a] group-hover:text-[#363535]">← Previous</span>
                <span className="text-xs font-semibold text-[#363535]">Day {seriesIndex} · {SERIES_SLUGS[seriesIndex - 1].replace(/day-/i,'').replace(/-/g,' ')}</span>
              </Link>
            ) : <div />}
            {nextSlug && (
              <Link href={`/blog/${nextSlug}`} className="flex flex-col gap-1 p-4 bg-white border border-[#e8e8e4] rounded-xl hover:border-[#ccff00] hover:-translate-y-0.5 hover:shadow-md transition-all group text-right">
                <span className="text-xs text-[#9a9a9a] group-hover:text-[#363535]">Next →</span>
                <span className="text-xs font-semibold text-[#363535]">Day {seriesIndex + 2} · {nextSlug.replace(/day-/i,'').replace(/-/g,' ')}</span>
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
        .article-body p { font-size: 17px; line-height: 1.78; margin: 0 0 1.5em; color: #363535; }
        .article-body h2 { font-family: var(--font-bricolage); font-weight: 700; font-size: clamp(20px, 2.5vw, 24px); letter-spacing: -1.5px; color: #1c1c1e; margin: 2.5em 0 0.75em; line-height: 1.2; }
        .article-body h3 { font-family: var(--font-bricolage); font-weight: 600; font-size: 17px; letter-spacing: -0.5px; color: #363535; margin: 1.75em 0 0.5em; }
        .article-body .article-list { margin: 0 0 1.4em; padding-left: 1.5em; }
        .article-body .article-list li { font-size: 17px; line-height: 1.72; color: #363535; margin-bottom: 0.6em; }
        .article-body .article-list li::marker { color: #ccff00; }
        .article-body a.text-link { color: #363535; text-decoration: underline; text-decoration-color: #ccff00; text-underline-offset: 3px; }
        .article-body a.text-link:hover { color: #1c1c1e; }
        .article-body code { background: #f0f0ec; padding: 2px 6px; border-radius: 4px; font-size: 14px; font-family: monospace; }

        /* BLUF */
        .bluf-block { background: #f7fbe7; border: 1.5px solid #d4ed8a; border-radius: 14px; padding: 20px 24px; margin-bottom: 2.5em; }
        .bluf-block p { font-size: 16px; line-height: 1.7; color: #1c1c1e; margin: 0; font-weight: 500; }

        /* Key Takeaways */
        .key-takeaways { background: #1c1c1e; border-radius: 18px; padding: 28px 32px; margin-bottom: 2.5em; }
        .takeaways-heading { color: #ccff00; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px; }
        .takeaways-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .takeaways-list li { color: #fff; font-size: 15px; line-height: 1.55; padding-left: 20px; position: relative; }
        .takeaways-list li::before { content: '→'; position: absolute; left: 0; color: #ccff00; font-weight: 700; }

        /* Callouts */
        .callout { border-radius: 12px; padding: 16px 20px; margin: 2em 0; border-left: 4px solid; }
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
        .callout-body p { font-size: 15px; margin: 0; }
        .article-figure { margin: 2.5em 0; }
        .article-figure img { width: 100%; border-radius: 12px; border: 1px solid #e8e8e4; }
        .article-figure figcaption { font-size: 13px; color: #9a9a9a; text-align: center; margin-top: 8px; font-style: italic; }
        .inline-cta { display: flex; align-items: center; gap: 16px; background: #1c1c1e; border-radius: 16px; padding: 20px 24px; margin: 2.5em 0; flex-wrap: wrap; }
        .inline-cta span { font-size: 28px; flex-shrink: 0; }
        .inline-cta div { flex: 1; min-width: 180px; }
        .inline-cta strong { display: block; font-family: var(--font-bricolage); font-size: 15px; font-weight: 600; color: #fff; letter-spacing: -0.3px; margin-bottom: 3px; }
        .inline-cta p { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0; }
        .inline-cta-btn { flex-shrink: 0; background: #ccff00; color: #1c1c1e; font-weight: 700; font-size: 13px; padding: 8px 16px; border-radius: 8px; text-decoration: none; transition: background 0.15s; white-space: nowrap; }
        .inline-cta-btn:hover { background: #d9ff4d; }

        /* FAQ */
        .faq-section { margin: 3em 0; }
        .faq-heading { font-family: var(--font-bricolage); font-weight: 700; font-size: clamp(20px, 2.5vw, 24px); letter-spacing: -1.5px; color: #1c1c1e; margin-bottom: 1em; }
        .faq-list { display: flex; flex-direction: column; gap: 8px; }
        .faq-item { border: 1.5px solid #e8e8e4; border-radius: 12px; overflow: hidden; transition: border-color 0.15s; }
        .faq-item.faq-open { border-color: #ccff00; }
        .faq-question { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: white; border: none; cursor: pointer; text-align: left; gap: 16px; font-size: 15px; font-weight: 600; color: #1c1c1e; font-family: inherit; }
        .faq-question:hover { background: #fafaf9; }
        .faq-chevron { font-size: 20px; flex-shrink: 0; transition: transform 0.2s; color: #9a9a9a; }
        .faq-open .faq-chevron { transform: rotate(-90deg); }
        .faq-answer { padding: 0 20px 16px; font-size: 15px; line-height: 1.7; color: #6b6b6b; }
        .faq-item.faq-open .faq-answer { display: block; }
        .faq-item:not(.faq-open) .faq-answer { display: none; }

        /* What's Next */
        .whats-next { background: #fafaf9; border: 1.5px solid #e8e8e4; border-radius: 18px; padding: 28px; margin-top: 3em; }
        .whats-next-heading { font-family: var(--font-bricolage); font-weight: 700; font-size: 20px; letter-spacing: -1px; color: #1c1c1e; margin-bottom: 16px; }
        .whats-next-links { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .whats-next-card { display: flex; flex-direction: column; gap: 3px; padding: 16px; background: white; border: 1.5px solid #e8e8e4; border-radius: 12px; text-decoration: none; transition: all 0.15s; }
        .whats-next-card:hover { border-color: #ccff00; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.07); }
        .whats-next-card.whats-next-cta { background: #1c1c1e; border-color: #1c1c1e; }
        .whats-next-card.whats-next-cta:hover { border-color: #ccff00; }
        .whats-next-card.whats-next-cta .whats-next-eyebrow { color: #ccff00; }
        .whats-next-card.whats-next-cta .whats-next-title { color: #fff; }
        .whats-next-card.whats-next-cta .whats-next-desc { color: rgba(255,255,255,0.45); }
        .whats-next-eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9a9a9a; }
        .whats-next-title { font-size: 14px; font-weight: 600; color: #1c1c1e; line-height: 1.3; }
        .whats-next-desc { font-size: 12px; color: #9a9a9a; line-height: 1.5; }

        /* Related */
        .related-posts { margin-top: 3em; padding-top: 2em; border-top: 2px solid #f0f0ec; }
        .related-heading { font-family: var(--font-bricolage); font-weight: 700; font-size: 18px; letter-spacing: -0.5px; color: #363535; margin-bottom: 1em; }
        .related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        .related-card { display: flex; flex-direction: column; gap: 4px; padding: 16px; background: white; border: 1.5px solid #e8e8e4; border-radius: 14px; text-decoration: none; transition: all 0.15s; }
        .related-card:hover { border-color: #ccff00; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.07); }
        .related-title { font-weight: 600; font-size: 14px; color: #1c1c1e; line-height: 1.3; }
        .related-desc { font-size: 12px; color: #9a9a9a; line-height: 1.5; flex: 1; }
        .related-arrow { font-size: 14px; color: #ccff00; margin-top: 4px; }
      `}</style>
    </div>
  )
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}
