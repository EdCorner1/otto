'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type BlogPost = {
  id: string; title: string; slug: string; excerpt: string; content: string
  cover_image_url: string; status: string; tags: string[]; published_at: string
  author_name: string; category_id: string; created_at: string
  blog_categories?: { name: string; slug: string }
}

type Category = { id: string; name: string; slug: string }

const STYLES = {
  badge: (s: string) => ({
    draft: 'bg-gray-100 text-gray-600',
    in_review: 'bg-amber-50 text-amber-700',
    published: 'bg-green-50 text-green-700',
    archived: 'bg-gray-100 text-gray-400',
  }[s] || 'bg-gray-100 text-gray-600'),
}

interface UserState { id: string; email?: string; user_metadata?: Record<string, unknown> }
export default function CMSPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const searchParams = useSearchParams()
  const initialFilter = searchParams.get('filter')
  const [filter, setFilter] = useState<string>(['all', 'draft', 'in_review', 'published', 'archived'].includes(initialFilter || '') ? (initialFilter as string) : 'all')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserState | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const next = searchParams.get('filter')
    if (next && ['all', 'draft', 'in_review', 'published', 'archived'].includes(next)) {
      setFilter(next)
    }
  }, [searchParams])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: cats } = await supabase.from('blog_categories').select('*').order('name')
      setCategories((cats as Category[]) || [])

      const { data: allPosts } = await supabase
        .from('blog_posts')
        .select('*, blog_categories(name, slug)')
        .order('created_at', { ascending: false })
        .limit(50)

      setPosts((allPosts as BlogPost[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter)

  const counts = {
    all: posts.length,
    draft: posts.filter(p => p.status === 'draft').length,
    in_review: posts.filter(p => p.status === 'in_review').length,
    published: posts.filter(p => p.status === 'published').length,
    archived: posts.filter(p => p.status === 'archived').length,
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Nav */}
      <header className="fixed top-4 left-4 right-4 z-50 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#e8e8e4]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>
            Otto<span className="inline-block w-2 h-2 bg-[#ccff00] rounded-full mb-2" />
            <span className="text-xs text-[#9a9a9a] font-normal ml-1">/ CMS</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-[#6b6b6b] hover:text-[#363535]">← Dashboard</Link>
            <button onClick={handleSignOut} className="text-sm text-[#6b6b6b] hover:text-[#363535]">Sign out</button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-16">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', lineHeight: 1.0, letterSpacing: '-3px', color: '#363535' }}>
              Blog CMS
            </h1>
            <p className="text-sm text-[#6b6b6b] mt-1">Manage Otto&apos;s content. Posts start as drafts — you approve before they go live.</p>
          </div>
          <Link href="/cms/new" className="btn-primary flex-shrink-0 inline-flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Post
          </Link>
        </div>

        {/* Review queue alert */}
        {counts.in_review > 0 && (
          <Link href="/cms?filter=in_review" className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl mb-6 hover:bg-amber-100/60 transition-colors">
            <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-sm flex-shrink-0">📝</div>
            <div>
              <p className="text-sm font-semibold text-amber-800">{counts.in_review} post{counts.in_review > 1 ? 's' : ''} awaiting review</p>
              <p className="text-xs text-amber-600">Click to see posts ready for your approval</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto"><path d="M9 18l6-6-6-6"/></svg>
          </Link>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-6 bg-white border border-[#e8e8e4] rounded-2xl p-1 w-fit">
          {(['all', 'in_review', 'draft', 'published', 'archived'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-[#363535] text-white'
                  : 'text-[#6b6b6b] hover:text-[#363535]'
              }`}>
              {f === 'all' ? 'All' : f === 'in_review' ? 'In Review' : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1.5 text-xs opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>

        {/* Posts table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-[#6b6b6b]">No posts here yet.</p>
            <Link href="/cms/new" className="btn-primary text-sm mt-4 inline-flex items-center gap-2">Create first post →</Link>
          </div>
        ) : (
          <div className="bg-white border border-[#e8e8e4] rounded-2xl overflow-hidden">
            {filtered.map((post, i) => (
              <div key={post.id}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-[#fafaf9] transition-colors ${i > 0 ? 'border-t border-[#f0f0ec]' : ''}`}>

                {/* Cover thumbnail */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#f0f0ec] border border-[#e8e8e4] flex-shrink-0 flex items-center justify-center">
                  {post.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">📄</span>
                  )}
                </div>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#363535] truncate">{post.title || '(Untitled)'}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STYLES.badge(post.status)}`}>
                      {post.status === 'in_review' ? 'In Review' : post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                    {post.blog_categories?.name && (
                      <span className="text-xs text-[#9a9a9a]">{post.blog_categories.name}</span>
                    )}
                    {post.tags?.length > 0 && (
                      <span className="text-xs text-[#9a9a9a]">{post.tags.slice(0,2).join(', ')}</span>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className="text-xs text-[#9a9a9a] flex-shrink-0 hidden sm:block">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                    : new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {post.status === 'in_review' && (
                    <Link href={`/cms/${post.id}/review`} className="btn-primary text-xs py-1.5 px-3">
                      Review
                    </Link>
                  )}
                  <Link href={`/cms/${post.id}/edit`} className="btn-ghost text-xs py-1.5 px-3">
                    Edit
                  </Link>
                  {post.status === 'published' && (
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"
                      className="btn-ghost text-xs py-1.5 px-3">
                      View ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
