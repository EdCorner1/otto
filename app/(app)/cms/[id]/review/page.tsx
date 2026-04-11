'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Post = {
  id: string; title: string; slug: string; excerpt: string; content: string
  cover_image_url: string; status: string; tags: string[]; author_name: string
  published_at: string | null
  blog_categories?: { name: string; slug: string }
  created_at: string
}

function renderMarkdown(text: string): string {
  // Simple markdown renderer — paragraphs, bold, italic, headers, links, code
  if (!text) return ''
  const lines = text.split('\n')
  let inList = false
  let html = ''
  for (const line of lines) {
    if (line.startsWith('## ')) { html += `<h2>${line.slice(3)}</h2>`; inList = false }
    else if (line.startsWith('# ')) { html += `<h1>${line.slice(2)}</h1>`; inList = false }
    else if (line.startsWith('- ')) { if (!inList) { html += '<ul>'; inList = true } html += `<li>${line.slice(2)}</li>` }
    else if (inList) { html += '</ul>'; inList = false; html += `<p>${line}</p>` }
    else html += `<p>${line}</p>`
  }
  if (inList) html += '</ul>'
  return html
}

export default function ReviewPostPage() {
  const params = useParams()
  const postId = params.id as string
  const router = useRouter()
  const supabase = createClient()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [rejectionNote, setRejectionNote] = useState('')
  const [showReject, setShowReject] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: p } = await supabase
        .from('blog_posts').select('*, blog_categories(name, slug)')
        .eq('id', postId).single()

      if (!p) { router.push('/cms'); return }
      setPost(p as Post)
      setLoading(false)
    }
    load()
  }, [postId])

  const updateStatus = async (status: string, publishedAt?: string) => {
    if (!post) return
    setUpdating(true)
    await supabase.from('blog_posts').update({
      status,
      published_at: publishedAt || post.published_at,
    }).eq('id', post.id)
    setPost(prev => prev ? { ...prev, status } : null)
    setUpdating(false)
  }

  const handleApprove = async () => {
    await updateStatus('published', new Date().toISOString())
  }

  const handleReject = async () => {
    if (!rejectionNote.trim()) return
    await updateStatus('draft')
    // Could store rejection note in a future field
    setShowReject(false)
    router.push('/cms')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!post) return null

  const rendered = renderMarkdown(post.content)

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Nav */}
      <header className="fixed top-4 left-4 right-4 z-50 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#e8e8e4]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/cms" className="text-sm text-[#6b6b6b] hover:text-[#363535]">← CMS</Link>
            <span className="text-[#d0d0cc]">/</span>
            <span className="text-sm font-medium text-[#363535]">Review</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full font-semibold">In Review</span>
            <button onClick={handleSignOut} className="text-sm text-[#6b6b6b] hover:text-[#363535]">Sign out</button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-16">
        {/* Action bar */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <button onClick={handleApprove} disabled={updating}
            className="btn-primary disabled:opacity-50 inline-flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
            Approve & Publish
          </button>
          <button onClick={() => setShowReject(true)} disabled={updating}
            className="btn-ghost text-red-500 hover:bg-red-50 hover:border-red-200 disabled:opacity-50">
            Request Changes
          </button>
          <Link href={`/blog/${post.slug}`} target="_blank"
            className="ml-auto text-sm text-[#6b6b6b] hover:text-[#363535] flex items-center gap-1">
            Preview ↗
          </Link>
        </div>

        {/* Post preview */}
        <div className="bg-white rounded-2xl border border-[#e8e8e4] overflow-hidden mb-8">
          {post.cover_image_url && (
            <div className="aspect-video bg-[#f0f0ec]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-8">
            <div className="flex items-center gap-2 mb-4">
              {post.blog_categories?.name && (
                <span className="text-xs font-semibold text-[#ccff00] bg-[#ccff00]/10 px-2 py-0.5 rounded-full">
                  {post.blog_categories.name}
                </span>
              )}
              {post.tags?.map(tag => (
                <span key={tag} className="text-xs text-[#9a9a9a] bg-[#f0f0ec] px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
            <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: 'clamp(24px, 4vw, 40px)', lineHeight: 1.05, letterSpacing: '-3px', color: '#363535' }} className="mb-4">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-lg text-[#6b6b6b] leading-relaxed mb-6 border-l-4 border-[#ccff00] pl-4">
                {post.excerpt}
              </p>
            )}
            <div
              className="prose-blog"
              dangerouslySetInnerHTML={{ __html: rendered }}
            />
          </div>
        </div>

        {/* Rejection form */}
        {showReject && (
          <div className="bg-white rounded-2xl border border-red-200 p-6 mb-8">
            <h3 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: '20px', letterSpacing: '-1px', color: '#363535' }} className="mb-2">Request Changes</h3>
            <p className="text-sm text-[#6b6b6b] mb-4">Tell Otto what needs to change before this can be published.</p>
            <textarea value={rejectionNote} onChange={e => setRejectionNote(e.target.value)} rows={4}
              placeholder="Example: The intro needs a stronger hook, and the conclusion should include a clear call-to-action..."
              className="w-full px-4 py-3 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-red-200 resize-none mb-3" />
            <div className="flex gap-2">
              <button onClick={handleReject} disabled={!rejectionNote.trim() || updating}
                className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors">
                Send Feedback
              </button>
              <button onClick={() => setShowReject(false)} className="btn-ghost text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex items-center gap-3">
          <button onClick={handleApprove} disabled={updating}
            className="btn-primary disabled:opacity-50 inline-flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
            Approve & Publish
          </button>
          <button onClick={() => setShowReject(true)} disabled={updating}
            className="btn-ghost text-red-500 hover:bg-red-50 disabled:opacity-50">
            Request Changes
          </button>
        </div>
      </div>
    </div>
  )
}
