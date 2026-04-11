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

function renderMarkdown(text: string): string {
  if (!text) return ''
  const lines = text.split('\n')
  let html = ''
  let inUl = false
  for (const line of lines) {
    if (line.startsWith('## ')) { if (inUl) { html += '</ul>'; inUl = false } html += `<h2>${line.slice(3)}</h2>` }
    else if (line.startsWith('# ')) { if (inUl) { html += '</ul>'; inUl = false } html += `<h1>${line.slice(2)}</h1>` }
    else if (line.startsWith('- ')) { if (!inUl) { html += '<ul>'; inUl = true } html += `<li>${line.slice(2)}</li>` }
    else if (line.trim()) { if (inUl) { html += '</ul>'; inUl = false } html += `<p>${line}</p>` }
  }
  if (inUl) html += '</ul>'
  return html
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
      <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-extrabold font-display tracking-tight" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>Otto</span>
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/blog" className="text-sm font-medium text-[#6b6b6b] hover:text-[#363535]">← Blog</Link>
          <Link href="/signup" className="btn-primary text-sm py-2 px-5">Get Started</Link>
        </div>
      </nav>

      <article className="max-w-2xl mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <div className="mb-8">
          {post.blog_categories && (
            <span className="text-xs font-semibold text-[#ccff00] bg-[#ccff00]/10 px-2.5 py-1 rounded-full">
              {post.blog_categories.name}
            </span>
          )}
          <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: 'clamp(28px, 6vw, 48px)', lineHeight: 1.0, letterSpacing: '-3px', color: '#363535' }}
            className="mt-4 mb-4">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg text-[#6b6b6b] leading-relaxed mb-4">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-3 text-sm text-[#9a9a9a]">
            <span>{post.author_name}</span>
            {pubDate && <><span>·</span><span>{pubDate}</span></>}
          </div>
        </div>

        {/* Cover image */}
        {post.cover_image_url && (
          <div className="rounded-2xl overflow-hidden mb-10 border border-[#e8e8e4] aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="text-[#363535] leading-relaxed" style={{ fontSize: '16px', lineHeight: '1.75' }}>
          <div dangerouslySetInnerHTML={{ __html: rendered }} />
        </div>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex items-center gap-2 mt-10 pt-8 border-t border-[#e8e8e4] flex-wrap">
            {post.tags.map(tag => (
              <span key={tag} className="text-xs text-[#6b6b6b] bg-[#f0f0ec] px-3 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 p-6 bg-[#363535] rounded-2xl text-center">
          <p className="text-white text-sm font-semibold mb-2">Want more like this?</p>
          <p className="text-white/60 text-xs mb-4">Join the Otto signup for early access to the UGC marketplace.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#ccff00] text-[#1c1c1c] rounded-xl text-sm font-bold hover:bg-[#d9ff4d] transition-colors">
            Get Started →
          </Link>
        </div>
      </article>
    </div>
  )
}
