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

// Converts markdown → HTML with proper semantic markup
function renderMarkdown(text: string): string {
  if (!text) return ''

  // Split on newlines but preserve double blank lines as paragraph breaks
  const blocks = text.split(/\n{2,}/)

  return blocks.map(block => {
    const b = block.trim()
    if (!b) return ''

    // H2
    if (b.startsWith('## ')) {
      const inner = b.slice(3)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
      return `<h2>${inner}</h2>`
    }

    // H3
    if (b.startsWith('### ')) {
      const inner = b.slice(4)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
      return `<h3>${inner}</h3>`
    }

    // Unordered list
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

    // Horizontal rule
    if (b === '---' || b === '***' || b === '___') {
      return '<hr>'
    }

    // Paragraph — process inline markdown
    const inner = b
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`(.+?)`/g, '<code>$1</code>')
      // Links [text](url)
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
          {/* Breadcrumb + category */}
          <div className="flex items-center gap-2 mb-5">
            <Link href="/blog" className="text-xs text-[#9a9a9a] hover:text-[#6b6b6b] transition-colors">Blog</Link>
            <span className="text-[#d0d0cc]">/</span>
            {post.blog_categories && (
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
            <p style={{
              fontFamily: 'var(--font-open-sans)',
              fontSize: '18px',
              lineHeight: 1.6,
              color: '#6b6b6b',
              marginTop: '16px',
            }}>
              {post.excerpt}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-4 mt-6 pt-6 border-t border-[#f0f0ec]">
            {/* Author avatar */}
            <div className="w-9 h-9 rounded-full bg-[#1c1c1c] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {post.author_name?.[0] || 'O'}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#363535]">{post.author_name}</p>
              <p className="text-xs text-[#9a9a9a]">{pubDate}</p>
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

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex items-start gap-2 mt-12 pt-8 border-t border-[#e8e8e4] flex-wrap">
            <span className="text-xs text-[#9a9a9a] pt-1">Tagged:</span>
            {post.tags.map(tag => (
              <span key={tag} className="text-xs text-[#6b6b6b] bg-[#f0f0ec] hover:bg-[#e8e8e4] px-3 py-1 rounded-full transition-colors cursor-default">{tag}</span>
            ))}
          </div>
        )}

        {/* CTA */}
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

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link href="/blog" className="text-sm text-[#9a9a9a] hover:text-[#6b6b6b] transition-colors inline-flex items-center gap-1">
            ← Back to Blog
          </Link>
        </div>
      </article>
    </div>
  )
}
