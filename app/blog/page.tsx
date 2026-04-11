'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Post = {
  id: string; title: string; slug: string; excerpt: string
  cover_image_url: string; status: string; tags: string[]; author_name: string
  blog_categories: { name: string; slug: string } | null
  published_at: string
}

type Category = { id: string; name: string; slug: string }

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const [{ data: cats }, { data: published }] = await Promise.all([
        supabase.from('blog_categories').select('*').order('name'),
        supabase.from('blog_posts')
          .select('*, blog_categories(name, slug)')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(50),
      ])
      setCategories((cats as Category[]) || [])
      setPosts((published as Post[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = activeCategory
    ? posts.filter(p => p.blog_categories?.slug === activeCategory)
    : posts

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Nav */}
      <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-extrabold font-display tracking-tight" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>Otto</span>
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm px-4 py-2 hidden sm:inline-flex">Sign in</Link>
          <Link href="/signup" className="btn-primary text-sm py-2 px-5">Get Started</Link>
        </div>
      </nav>

      <div className="max-w-[960px] mx-auto px-6 pt-32 pb-16">
        {/* Header */}
        <div className="mb-10">
          <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: 'clamp(36px, 7vw, 64px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
            Otto Blog
          </h1>
          <p className="text-[#6b6b6b] mt-3 text-lg">Practical content for tech UGC creators — and the brands who work with them.</p>
        </div>

        {/* Category filters */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 mb-10 flex-wrap">
            <button onClick={() => setActiveCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!activeCategory ? 'bg-[#363535] text-white' : 'bg-white border border-[#e8e8e4] text-[#6b6b6b] hover:border-[#ccff00]'}`}>
              All
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.slug === activeCategory ? null : cat.slug)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeCategory === cat.slug ? 'bg-[#363535] text-white' : 'bg-white border border-[#e8e8e4] text-[#6b6b6b] hover:border-[#ccff00]'}`}>
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white border border-[#e8e8e4] rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-[#6b6b6b]">No posts published yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}
                className="group bg-white border border-[#e8e8e4] rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all">

                {post.cover_image_url && (
                  <div className="aspect-video bg-[#f0f0ec] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}

                <div className="p-5 flex flex-col flex-1">
                  {post.blog_categories && (
                    <span className="inline-block text-xs font-semibold text-[#363535] bg-[#f0f0ec] px-2.5 py-0.5 rounded-full self-start mb-2">
                      {post.blog_categories.name}
                    </span>
                  )}
                  <h2 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: 'clamp(15px, 1.8vw, 19px)', lineHeight: 1.15, letterSpacing: '-1px', color: '#1c1c1e' }}
                    className="mb-2 group-hover:text-[#363535]">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-xs text-[#6b6b6b] leading-relaxed mb-4 line-clamp-2 flex-1">{post.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#f0f0ec]">
                    <span className="text-xs text-[#9a9a9a]">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                    </span>
                    <span className="text-xs text-[#9a9a9a] group-hover:text-[#ccff00] transition-colors">Read →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
