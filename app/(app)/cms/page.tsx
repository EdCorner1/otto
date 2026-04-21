'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Archive, ArrowLeft, ClipboardCheck, Clock3, FileText, PenSquare, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type BlogPost = {
  id: string; title: string; slug: string; excerpt: string; content: string
  cover_image_url: string; status: string; tags: string[]; published_at: string
  author_name: string; category_id: string; created_at: string
  blog_categories?: { name: string; slug: string }
}

const STYLES = {
  badge: (s: string) => ({
    draft: 'bg-gray-100 text-gray-600',
    in_review: 'bg-amber-50 text-amber-700',
    published: 'bg-green-50 text-green-700',
    archived: 'bg-gray-100 text-gray-400',
  }[s] || 'bg-gray-100 text-gray-600'),
}

interface UserState { id: string; email?: string; user_metadata?: Record<string, unknown> }

type StatCardProps = {
  label: string
  value: number
  icon: React.ReactNode
  tone?: 'default' | 'accent' | 'success' | 'muted'
}

function StatCard({ label, value, icon, tone = 'default' }: StatCardProps) {
  const tones = {
    default: 'bg-white border-[#e8e8e4] text-[#363535] icon-bg-[#f4f4ef]',
    accent: 'bg-[#f9fce9] border-[#e4efb8] text-[#2f350d] icon-bg-[#eefd9a]',
    success: 'bg-[#f5fbf5] border-[#dbe9db] text-[#234023] icon-bg-[#e4f5e4]',
    muted: 'bg-white border-[#ecece8] text-[#5f5f5b] icon-bg-[#f2f2ef]',
  }

  const toneClass = tones[tone]
  const iconBg = toneClass.match(/icon-bg-\[(.*?)\]/)?.[1] || '#f4f4ef'

  return (
    <div className={`rounded-[24px] border p-4 ${toneClass.replace(/ icon-bg-\[.*?\]/, '')}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#8d8d88]">{label}</p>
          <p className="mt-2 text-3xl font-semibold" style={{ fontFamily: 'var(--font-bricolage)' }}>{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: iconBg }}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function CMSPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [, setUser] = useState<UserState | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: allPosts } = await supabase
        .from('blog_posts')
        .select('*, blog_categories(name, slug)')
        .order('created_at', { ascending: false })
        .limit(50)

      setPosts((allPosts as BlogPost[]) || [])
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const counts = useMemo(() => ({
    all: posts.length,
    draft: posts.filter(p => p.status === 'draft').length,
    in_review: posts.filter(p => p.status === 'in_review').length,
    published: posts.filter(p => p.status === 'published').length,
    archived: posts.filter(p => p.status === 'archived').length,
  }), [posts])

  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <header className="fixed top-4 left-4 right-4 z-50 rounded-2xl border border-[#e8e8e4] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>
            Otto<span className="inline-block h-2 w-2 rounded-full bg-[#ccff00] mb-2" />
            <span className="ml-1 text-xs font-normal text-[#9a9a9a]">/ CMS</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-[#6b6b6b] hover:text-[#363535]">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <button onClick={handleSignOut} className="text-sm text-[#6b6b6b] hover:text-[#363535]">Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 pt-28 pb-16">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', lineHeight: 1.0, letterSpacing: '-3px', color: '#363535' }}>
              Blog CMS
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[#6b6b6b]">
              Manage Otto&apos;s editorial pipeline. Draft, review, and publish without losing the feel of the brand.
            </p>
          </div>
          <Link href="/cms/new" className="btn-primary inline-flex flex-shrink-0 items-center gap-2">
            <PenSquare className="h-4 w-4" />
            New Post
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Drafts" value={counts.draft} icon={<FileText className="h-4 w-4" />} />
          <StatCard label="In review" value={counts.in_review} icon={<Clock3 className="h-4 w-4" />} tone="accent" />
          <StatCard label="Published" value={counts.published} icon={<Send className="h-4 w-4" />} tone="success" />
          <StatCard label="Archived" value={counts.archived} icon={<Archive className="h-4 w-4" />} tone="muted" />
        </div>

        {counts.in_review > 0 && (
          <Link href="/cms?filter=in_review" className="mb-6 flex items-center gap-3 rounded-[24px] border border-[#ece6c7] bg-[#fffaf0] p-4 transition-colors hover:bg-[#fff6e7]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7e9b8] text-[#7a5600] flex-shrink-0">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#6f5208]">{counts.in_review} post{counts.in_review > 1 ? 's' : ''} waiting for review</p>
              <p className="text-xs text-[#8a6b1f]">Open the review queue and clear today&apos;s approvals.</p>
            </div>
            <span className="ml-auto text-sm font-medium text-[#7a5600]">Open queue →</span>
          </Link>
        )}

        <div className="mb-6 flex w-fit items-center gap-1 rounded-2xl border border-[#e8e8e4] bg-white p-1">
          {(['all', 'in_review', 'draft', 'published', 'archived'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-[#363535] text-white'
                  : 'text-[#6b6b6b] hover:text-[#363535]'
              }`}
            >
              {f === 'all' ? 'All posts' : f === 'in_review' ? 'In Review' : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1.5 text-xs opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ccff00] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[#dfdfd8] bg-white px-6 py-20 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3f3ee] text-[#6b6b6b]">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-[#363535]">No posts here yet.</p>
            <p className="mt-1 text-sm text-[#6b6b6b]">Start a fresh draft or switch filters to review existing content.</p>
            <Link href="/cms/new" className="btn-primary mt-5 inline-flex items-center gap-2 text-sm">
              <PenSquare className="h-4 w-4" />
              Create first post
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-[#e8e8e4] bg-white">
            {filtered.map((post, i) => (
              <div
                key={post.id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#fafaf9] ${i > 0 ? 'border-t border-[#f0f0ec]' : ''}`}
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e8e8e4] bg-[#f7f7f4] text-[#7b7b75]">
                  {post.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.cover_image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#363535]">{post.title || '(Untitled)'}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STYLES.badge(post.status)}`}>
                      {post.status === 'in_review' ? 'In Review' : post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                    {post.blog_categories?.name && (
                      <span className="text-xs text-[#9a9a9a]">{post.blog_categories.name}</span>
                    )}
                    {post.tags?.length > 0 && (
                      <span className="text-xs text-[#9a9a9a]">{post.tags.slice(0, 2).join(', ')}</span>
                    )}
                  </div>
                </div>

                <div className="hidden flex-shrink-0 text-xs text-[#9a9a9a] sm:block">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                    : new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  {post.status === 'in_review' && (
                    <Link href={`/cms/${post.id}/review`} className="btn-primary px-3 py-1.5 text-xs">
                      Review
                    </Link>
                  )}
                  <Link href={`/cms/${post.id}/edit`} className="btn-ghost px-3 py-1.5 text-xs">
                    Edit
                  </Link>
                  {post.status === 'published' && (
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="btn-ghost px-3 py-1.5 text-xs">
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
