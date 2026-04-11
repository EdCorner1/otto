'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Category = { id: string; name: string; slug: string }

export default function NewPostPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tags, setTags] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [saveAs, setSaveAs] = useState<'draft' | 'in_review'>('draft')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: cats } = await supabase.from('blog_categories').select('*').order('name')
      setCategories((cats as Category[]) || [])
    }
    load()
  }, [])

  const makeSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const handleTitleChange = (v: string) => {
    setTitle(v)
    if (!slug || slug === makeSlug(title)) setSlug(makeSlug(v))
  }

  const handleSave = async (status: 'draft' | 'in_review') => {
    if (!title.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)

    const { data: inserted } = await supabase.from('blog_posts').insert({
      title: title.trim(),
      slug: slug || makeSlug(title),
      excerpt: excerpt.trim() || null,
      content: content.trim(),
      cover_image_url: coverUrl.trim() || null,
      category_id: categoryId || null,
      tags: tagList,
      status,
      author_name: 'Otto',
      created_by: user.id,
      published_at: null,
    }).select().single()

    setSaving(false)
    if (inserted) router.push(status === 'in_review' ? `/cms/${inserted.id}/review` : '/cms')
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
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/cms" className="flex items-center gap-2 text-lg font-bold" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>
            Otto<span className="inline-block w-2 h-2 bg-[#ccff00] rounded-full mb-2" />
            <span className="text-xs text-[#9a9a9a] font-normal">/ New Post</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/cms" className="text-sm text-[#6b6b6b] hover:text-[#363535]">← CMS</Link>
            <button onClick={handleSignOut} className="text-sm text-[#6b6b6b] hover:text-[#363535]">Sign out</button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main editor */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <input
                type="text"
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Post title..."
                className="w-full text-3xl font-bold bg-transparent border-none outline-none text-[#363535] placeholder-[#d0d0cc]"
                style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-2px', lineHeight: 1.1 }}
              />
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(makeSlug(e.target.value))}
                placeholder="url-slug"
                className="w-full text-sm bg-transparent border-none outline-none text-[#9a9a9a] mt-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6b6b6b] mb-1.5">Excerpt <span className="font-normal text-[#9a9a9a]">(optional — shown in listings)</span></label>
              <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2}
                placeholder="A short summary of what this post is about..."
                className="w-full px-4 py-3 bg-white border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00] resize-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6b6b6b] mb-1.5">Content <span className="font-normal text-[#9a9a9a]">(markdown supported)</span></label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={20}
                placeholder="Write your post here. Markdown is supported..."


                className="w-full px-4 py-3 bg-white border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00] resize-none font-mono" />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Publish controls */}
            <div className="card">
              <p className="text-xs font-semibold text-[#6b6b6b] mb-3">Save & Publish</p>
              <div className="space-y-2">
                <button onClick={() => handleSave('draft')} disabled={saving || !title.trim()}
                  className="w-full btn-ghost text-sm justify-center disabled:opacity-50">
                  Save as Draft
                </button>
                <button onClick={() => handleSave('in_review')} disabled={saving || !title.trim()}
                  className="w-full btn-primary text-sm justify-center disabled:opacity-50">
                  {saving ? 'Saving...' : 'Submit for Review →'}
                </button>
              </div>
              <p className="text-xs text-[#9a9a9a] mt-2 text-center">Posts go live only after Ed approves them.</p>
            </div>

            {/* Cover image */}
            <div className="card">
              <label className="block text-xs font-semibold text-[#6b6b6b] mb-1.5">Cover Image URL</label>
              <input type="url" value={coverUrl} onChange={e => setCoverUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-xs text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00] mb-2" />
              {coverUrl && (
                <div className="rounded-xl overflow-hidden border border-[#e8e8e4] aspect-video">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Category */}
            <div className="card">
              <label className="block text-xs font-semibold text-[#6b6b6b] mb-1.5">Category</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] focus:outline-none focus:ring-2 focus:ring-[#ccff00]">
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Tags */}
            <div className="card">
              <label className="block text-xs font-semibold text-[#6b6b6b] mb-1.5">Tags <span className="font-normal text-[#9a9a9a]">(comma-separated)</span></label>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)}
                placeholder="ai, tools, productivity"
                className="w-full px-3 py-2.5 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-xs text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
