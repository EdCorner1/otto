'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function ProfileEditPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, unknown> } | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Creator fields
  const [displayName, setDisplayName] = useState('')
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [availability, setAvailability] = useState('open')
  const [instagram, setInstagram] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [youtube, setYoutube] = useState('')
  const [twitter, setTwitter] = useState('')
  const [website, setWebsite] = useState('')

  // Brand fields
  const [companyName, setCompanyName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [industry, setIndustry] = useState('')
  const [companyBio, setCompanyBio] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const r = user.user_metadata?.role
      setRole(r)

      if (r === 'creator') {
        const { data: c } = await supabase
          .from('creators').select('*, creator_socials(*)')
          .eq('user_id', user.id).single()
        if (c) {
          setDisplayName(c.display_name || '')
          setHeadline(c.headline || '')
          setBio(c.bio || '')
          setLocation(c.location || '')
          setHourlyRate(c.hourly_rate || '')
          setAvailability(c.availability || 'open')
          setAvatarPreview(c.avatar_url || '')
          const socials = ((c as { creator_socials?: Array<{ platform: string; url: string }> }).creator_socials ?? [])
          socials.forEach((s) => {
            if (s.platform === 'instagram') setInstagram(s.url)
            if (s.platform === 'tiktok') setTiktok(s.url)
            if (s.platform === 'youtube') setYoutube(s.url)
            if (s.platform === 'twitter') setTwitter(s.url)
            if (s.platform === 'website') setWebsite(s.url)
          })
        }
      } else if (r === 'brand') {
        const { data: b } = await supabase.from('brands').select('*').eq('user_id', user.id).single()
        if (b) {
          setCompanyName((b as { company_name?: string }).company_name ?? '')
          setWebsiteUrl(b.website || '')
          setIndustry(b.industry || '')
          setCompanyBio((b as { bio?: string }).bio ?? '')
          setAvatarPreview(b.logo_url || '')
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) { setMsg('Image must be under 5MB'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const path = `avatars/${userId}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) { console.error('Avatar upload error:', error); return null }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  }

  const upsertSocial = async (creatorId: string, platform: string, url: string) => {
    const { data: existing } = await supabase
      .from('creator_socials').select('id').eq('creator_id', creatorId).eq('platform', platform).single()
    if (existing) {
      if (url) await supabase.from('creator_socials').update({ url }).eq('id', existing.id)
      else await supabase.from('creator_socials').delete().eq('id', existing.id)
    } else if (url) {
      await supabase.from('creator_socials').insert({ creator_id: creatorId, platform, url })
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setMsg('')

    try {
      let avatarUrl = avatarPreview

      // Upload avatar if changed
      if (avatarFile) {
        const url = await uploadAvatar(user.id, avatarFile)
        if (url) avatarUrl = url
      }

      if (role === 'creator') {
        const { data: existing } = await supabase.from('creators').select('id').eq('user_id', user.id).single()
        if (existing) {
          await supabase.from('creators').update({
            display_name: displayName.trim() || null,
            headline: headline.trim() || null,
            bio: bio.trim() || null,
            location: location.trim() || null,
            hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
            availability,
            avatar_url: avatarUrl || null,
          }).eq('id', existing.id)

          await upsertSocial(existing.id, 'instagram', instagram)
          await upsertSocial(existing.id, 'tiktok', tiktok)
          await upsertSocial(existing.id, 'youtube', youtube)
          await upsertSocial(existing.id, 'twitter', twitter)
          await upsertSocial(existing.id, 'website', website)
        }

        // Update auth metadata
        await supabase.auth.updateUser({ data: { display_name: displayName.trim(), role: 'creator' } })
      } else if (role === 'brand') {
        const { data: existing } = await supabase.from('brands').select('id').eq('user_id', user.id).single()
        if (existing) {
          await supabase.from('brands').update({
            company_name: companyName.trim() || null,
            website: websiteUrl.trim() || null,
            industry: industry.trim() || null,
            bio: companyBio.trim() || null,
            logo_url: avatarUrl || null,
          }).eq('id', existing.id)
        }
        await supabase.auth.updateUser({ data: { company_name: companyName.trim(), role: 'brand' } })
      }

      setMsg('Profile saved!')
    } catch (err: unknown) {
      setMsg(`Error saving: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
    setSaving(false)
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

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Nav */}
      <header className="fixed top-4 left-4 right-4 z-50 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#e8e8e4]">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>
            Otto<span className="inline-block w-2 h-2 bg-[#ccff00] rounded-full mb-2" />
            <span className="text-xs text-[#9a9a9a] font-normal ml-1">/ Edit Profile</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-[#6b6b6b] hover:text-[#363535]">← Dashboard</Link>
            <button onClick={handleSignOut} className="text-sm text-[#6b6b6b] hover:text-[#363535]">Sign out</button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-28 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', lineHeight: 1.0, letterSpacing: '-3px', color: '#363535' }}>
            Edit Profile
          </h1>
          {role === 'creator' && (
            <Link href={`/creators/${user?.id}`} target="_blank"
              className="text-sm text-[#6b6b6b] hover:text-[#363535] flex items-center gap-1">
              View public profile ↗
            </Link>
          )}
          {role === 'brand' && (
            <Link href={`/brands/${user?.id}`} target="_blank"
              className="text-sm text-[#6b6b6b] hover:text-[#363535] flex items-center gap-1">
              View public profile ↗
            </Link>
          )}
        </div>

        {/* Avatar */}
        <div className="card mb-6">
          <p className="text-xs font-semibold text-[#6b6b6b] mb-3">Profile Photo</p>
          <div className="flex items-center gap-4">
            <button onClick={() => fileRef.current?.click()}
              className="w-16 h-16 rounded-2xl overflow-hidden bg-[#f0f0ec] border-2 border-dashed border-[#d0d0cc] flex items-center justify-center text-2xl hover:border-[#ccff00] transition-colors flex-shrink-0">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : '+'}
            </button>
            <div>
              <p className="text-sm font-medium text-[#363535]">Click to upload photo</p>
              <p className="text-xs text-[#9a9a9a]">JPG, PNG or GIF · max 5MB · square works best</p>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
          </div>
        </div>

        {/* Creator fields */}
        {role === 'creator' && (
          <>
            <div className="card mb-5">
              <p className="text-xs font-semibold text-[#6b6b6b] mb-4">Basic Info</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-[#6b6b6b] mb-1">Display Name</label>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)} type="text"
                    className="w-full px-4 py-2.5 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] focus:outline-none focus:ring-2 focus:ring-[#ccff00]" />
                </div>
                <div>
                  <label className="block text-xs text-[#6b6b6b] mb-1">Headline <span className="text-[#9a9a9a]">(shown under your name)</span></label>
                  <input value={headline} onChange={e => setHeadline(e.target.value)} type="text"
                    placeholder="e.g. Tech UGC Creator · 500K+ TikTok"
                    className="w-full px-4 py-2.5 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00]" />
                </div>
                <div>
                  <label className="block text-xs text-[#6b6b6b] mb-1">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                    placeholder="Tell brands who you are and what you make..."
                    className="w-full px-4 py-2.5 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00] resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#6b6b6b] mb-1">Location</label>
                    <input value={location} onChange={e => setLocation(e.target.value)} type="text"
                      placeholder="e.g. London, UK"
                      className="w-full px-4 py-2.5 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00]" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6b6b6b] mb-1">Hourly Rate (£)</label>
                    <input value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} type="number"
                      placeholder="e.g. 150"
                      className="w-full px-4 py-2.5 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#6b6b6b] mb-1">Availability</label>
                  <select value={availability} onChange={e => setAvailability(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] focus:outline-none focus:ring-2 focus:ring-[#ccff00]">
                    <option value="open">🟢 Open to work</option>
                    <option value="limited">🟡 Limited availability</option>
                    <option value="unavailable">⚫ Unavailable</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card mb-5">
              <p className="text-xs font-semibold text-[#6b6b6b] mb-4">Social Links</p>
              <div className="space-y-3">
                {[
                  { platform: 'TikTok', key: 'tiktok', value: tiktok, onChange: setTiktok, placeholder: 'https://tiktok.com/@yourhandle' },
                  { platform: 'YouTube', key: 'youtube', value: youtube, onChange: setYoutube, placeholder: 'https://youtube.com/@yourchannel' },
                  { platform: 'Instagram', key: 'instagram', value: instagram, onChange: setInstagram, placeholder: 'https://instagram.com/yourhandle' },
                  { platform: 'Twitter / X', key: 'twitter', value: twitter, onChange: setTwitter, placeholder: 'https://x.com/yourhandle' },
                  { platform: 'Website', key: 'website', icon: '🌐', value: website, onChange: setWebsite, placeholder: 'https://yoursite.com' },
                ].map(({ platform, key, icon, value, onChange, placeholder }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#f0f0ec] flex items-center justify-center text-xs flex-shrink-0">{icon}</span>
                    <input value={value} onChange={e => onChange(e.target.value)} type="url"
                      placeholder={placeholder}
                      className="flex-1 px-3 py-2 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-xs text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00]" />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Brand fields */}
        {role === 'brand' && (
          <div className="card mb-5">
            <p className="text-xs font-semibold text-[#6b6b6b] mb-4">Company Info</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Company Name</label>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} type="text"
                  className="w-full px-4 py-2.5 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] focus:outline-none focus:ring-2 focus:ring-[#ccff00]" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Website</label>
                <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} type="url"
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00]" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Industry</label>
                <input value={industry} onChange={e => setIndustry(e.target.value)} type="text"
                  placeholder="e.g. SaaS, Fintech, AI Tools"
                  className="w-full px-4 py-2.5 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00]" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">About</label>
                <textarea value={companyBio} onChange={e => setCompanyBio(e.target.value)} rows={3}
                  placeholder="Tell creators about your brand..."
                  className="w-full px-4 py-2.5 bg-[#fafaf9] border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00] resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* Save */}
        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold ${msg.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-[#ccff00] text-[#1c1c1c]'}`}>
            {msg}
          </div>
        )}

        <button onClick={handleSave} disabled={saving}
          className="w-full btn-primary justify-center py-3 text-sm disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
