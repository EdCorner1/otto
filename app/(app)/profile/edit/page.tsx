'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Role = 'creator' | 'brand'

type PortfolioDraft = {
  id: string
  url: string
  platform: string
  caption: string
}

type CreatorProfileResponse = {
  id: string
  userId: string
  fullName: string
  handle: string
  bio: string
  avatarUrl: string | null
  mainPlatform: string
  followerRange: string
  incomeRange: string
  nicheTags: string[]
  portfolioItems: Array<{
    id: string
    url: string
    platform: string | null
    caption: string | null
  }>
}

const MAIN_PLATFORMS = ['tiktok', 'instagram', 'youtube'] as const
const FOLLOWER_RANGES = ['< 1K', '1K – 10K', '10K – 50K', '50K – 250K', '250K – 500K', '500K +']
const INCOME_RANGES = ['Not sharing', '$0 – $500/mo', '$500 – $2K/mo', '$2K – $5K/mo', '$5K+/mo']
const STEPS = ['Basic Info', 'Stats', 'Portfolio', 'Review'] as const

function labelPlatform(platform: string) {
  if (platform === 'tiktok') return 'TikTok'
  if (platform === 'instagram') return 'Instagram'
  if (platform === 'youtube') return 'YouTube'
  return platform
}

export default function ProfileEditPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [role, setRole] = useState<Role | null>(null)

  // shared identity
  const [brandId, setBrandId] = useState('')
  const [creatorId, setCreatorId] = useState('')

  // creator mode state
  const [step, setStep] = useState(0)
  const [fullName, setFullName] = useState('')
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [mainPlatform, setMainPlatform] = useState<string>('tiktok')
  const [followerRange, setFollowerRange] = useState('')
  const [incomeRange, setIncomeRange] = useState('')
  const [nicheInput, setNicheInput] = useState('')
  const [portfolioItems, setPortfolioItems] = useState<PortfolioDraft[]>([])

  // brand mode state
  const [companyName, setCompanyName] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [industry, setIndustry] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (!user) {
        router.push('/login')
        return
      }

      let resolvedRole = (user.user_metadata?.role as Role | undefined) || null
      if (!resolvedRole) {
        const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
        const roleFromUsers = userRow?.role as Role | undefined
        resolvedRole = roleFromUsers || null
      }

      const [{ data: creatorRow }, { data: brandRow }] = await Promise.all([
        supabase.from('creators').select('id').eq('user_id', user.id).maybeSingle(),
        supabase.from('brands').select('id, company_name, bio, logo_url, industry, website').eq('user_id', user.id).maybeSingle(),
      ])

      if (!resolvedRole) {
        if (brandRow && !creatorRow) resolvedRole = 'brand'
        if (creatorRow && !brandRow) resolvedRole = 'creator'
      }

      setRole(resolvedRole)

      if (resolvedRole === 'brand') {
        if (!brandRow?.id) {
          setStatusMessage('No brand profile found yet. Complete onboarding first.')
          setLoading(false)
          return
        }

        setBrandId(brandRow.id)
        setCompanyName(brandRow.company_name || '')
        setCompanyDescription(brandRow.bio || '')
        setLogoUrl(brandRow.logo_url || '')
        setIndustry(brandRow.industry || '')
        setWebsiteUrl(brandRow.website || '')
        setLoading(false)
        return
      }

      if (!creatorRow?.id) {
        setStatusMessage('No creator profile found yet. Complete onboarding first.')
        setLoading(false)
        return
      }

      setCreatorId(creatorRow.id)
      const response = await fetch(`/api/creators/${creatorRow.id}`)
      if (!response.ok) {
        setStatusMessage('Could not load creator profile.')
        setLoading(false)
        return
      }

      const profile = (await response.json()) as CreatorProfileResponse
      setFullName(profile.fullName || '')
      setHandle(profile.handle || '')
      setBio(profile.bio || '')
      setAvatarUrl(profile.avatarUrl || '')
      setMainPlatform(profile.mainPlatform || 'tiktok')
      setFollowerRange(profile.followerRange || '')
      setIncomeRange(profile.incomeRange || '')
      setNicheInput(profile.nicheTags.join(', '))
      setPortfolioItems(
        (profile.portfolioItems || []).slice(0, 6).map((item) => ({
          id: item.id,
          url: item.url,
          platform: (item.platform || profile.mainPlatform || 'tiktok').toLowerCase(),
          caption: item.caption || '',
        }))
      )
      setLoading(false)
    }

    void load()
  }, [router, supabase])

  const canMoveForward = useMemo(() => {
    if (role !== 'creator') return true
    if (step === 0) {
      return Boolean(fullName.trim() && handle.trim() && bio.trim() && mainPlatform)
    }
    return true
  }, [bio, fullName, handle, mainPlatform, role, step])

  const addPortfolioItem = () => {
    if (portfolioItems.length >= 6) return
    setPortfolioItems((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        url: '',
        platform: mainPlatform || 'tiktok',
        caption: '',
      },
    ])
  }

  const updatePortfolioItem = (id: string, key: keyof PortfolioDraft, value: string) => {
    setPortfolioItems((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)))
  }

  const removePortfolioItem = (id: string) => {
    setPortfolioItems((prev) => prev.filter((item) => item.id !== id))
  }

  const uploadCreatorAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !creatorId) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
    if (!allowedTypes.includes(file.type)) {
      setStatusMessage('Please upload a JPG, PNG, WebP, GIF, or AVIF image.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage('Profile photos must be 5MB or smaller.')
      return
    }

    setAvatarUploading(true)
    setStatusMessage('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        setStatusMessage('You need to sign in again before uploading a profile photo.')
        return
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/creators/${creatorId}/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })

      const result = (await response.json()) as { error?: string; avatarUrl?: string | null }
      if (!response.ok || !result.avatarUrl) {
        setStatusMessage(result.error || 'Could not upload profile photo.')
        return
      }

      setAvatarUrl(result.avatarUrl)
      setStatusMessage('Profile photo uploaded. Save profile to keep it.')
    } catch {
      setStatusMessage('Could not upload profile photo.')
    } finally {
      setAvatarUploading(false)
    }
  }

  const submitCreator = async () => {
    if (!creatorId) return
    setSaving(true)
    setStatusMessage('')

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (!accessToken) {
      setStatusMessage('You need to sign in again before saving.')
      setSaving(false)
      return
    }

    const payload = {
      fullName: fullName.trim(),
      handle: handle.trim().replace(/^@+/, ''),
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim() || null,
      mainPlatform,
      followerRange,
      incomeRange,
      nicheTags: nicheInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 8),
      portfolioItems: portfolioItems
        .map((item) => ({
          url: item.url.trim(),
          platform: item.platform,
          caption: item.caption.trim(),
        }))
        .filter((item) => item.url && item.platform)
        .slice(0, 6),
    }

    const response = await fetch(`/api/creators/${creatorId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })

    const result = (await response.json()) as { error?: string }
    if (!response.ok) {
      setStatusMessage(result.error || 'Could not save profile.')
      setSaving(false)
      return
    }

    setSaving(false)
    setStatusMessage('Profile updated.')
  }

  const submitBrand = async () => {
    if (!brandId) return
    setSaving(true)
    setStatusMessage('')

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (!accessToken) {
      setStatusMessage('You need to sign in again before saving.')
      setSaving(false)
      return
    }

    const payload = {
      company_name: companyName,
      bio: companyDescription,
      logo_url: logoUrl,
      industry,
      website: websiteUrl,
    }

    const response = await fetch(`/api/brands/${brandId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })

    const result = (await response.json()) as { error?: string }
    if (!response.ok) {
      setStatusMessage(result.error || 'Could not save brand profile.')
      setSaving(false)
      return
    }

    setSaving(false)
    setStatusMessage('Brand profile updated.')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (role === 'brand') {
    return (
      <div className="min-h-screen bg-[#fafaf9] text-[#1c1c1e]">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="mb-7 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="section-label mb-1">Brand profile</p>
              <h1 className="font-display text-[#1c1c1e]" style={{ fontSize: 'clamp(28px, 5vw, 40px)', letterSpacing: '-0.04em', lineHeight: 1.0 }}>
                Edit profile
              </h1>
            </div>
            <Link href={brandId ? `/brands/${brandId}` : '/brands'} className="btn-ghost border border-[#e8e8e4]">View public profile</Link>
          </div>

          <div className="card space-y-4">
            <div>
              <label className="block text-xs text-[#6b6b6b] mb-1">Brand name</label>
              <input
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#6b6b6b] mb-1">Company description</label>
              <textarea
                value={companyDescription}
                onChange={(event) => setCompanyDescription(event.target.value)}
                rows={5}
                className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00] resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[#6b6b6b] mb-1">Logo URL</label>
              <input
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Industry</label>
                <input
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                  placeholder="SaaS, AI tools, Fintech..."
                  className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Website URL</label>
                <input
                  value={websiteUrl}
                  onChange={(event) => setWebsiteUrl(event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                />
              </div>
            </div>
          </div>

          {statusMessage && (
            <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${statusMessage.includes('updated') ? 'bg-[#ccff00] text-[#1c1c1e]' : 'bg-white border border-[#e8e8e4] text-[#6b6b6b]'}`}>
              {statusMessage}
            </div>
          )}

          <div className="mt-5 flex items-center justify-end">
            <button onClick={submitBrand} disabled={saving} className="btn-primary disabled:opacity-40">
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1c1e]">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-7 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="section-label mb-1">Creator profile</p>
            <h1 className="font-display text-[#1c1c1e]" style={{ fontSize: 'clamp(28px, 5vw, 40px)', letterSpacing: '-0.04em', lineHeight: 1.0 }}>
              Edit profile
            </h1>
          </div>
          <Link href={creatorId ? `/creators/${creatorId}` : '/creators'} className="btn-ghost border border-[#e8e8e4]">View public profile</Link>
        </div>

        <div className="mb-6 rounded-2xl border border-[#e8e8e4] bg-white p-4">
          <div className="flex items-center gap-2">
            {STEPS.map((stepLabel, index) => (
              <div key={stepLabel} className="flex items-center gap-2 flex-1">
                <div className={`h-8 w-8 rounded-full text-xs font-semibold flex items-center justify-center ${step >= index ? 'bg-[#ccff00] text-[#1c1c1e]' : 'bg-[#f0f0ec] text-[#8a8a86]'}`}>
                  {index + 1}
                </div>
                <p className={`text-xs hidden sm:block ${step === index ? 'text-[#1c1c1e] font-semibold' : 'text-[#8a8a86]'}`}>{stepLabel}</p>
                {index < STEPS.length - 1 && <div className="h-px flex-1 bg-[#ecece7]" />}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl text-[#1c1c1e]" style={{ letterSpacing: '-0.03em' }}>Basic info</h2>
              <div className="rounded-2xl border border-[#e8e8e4] bg-[#fcfcfa] p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={fullName || 'Creator avatar'} className="h-20 w-20 rounded-full object-cover border border-[#e8e8e4] bg-white" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-[#d8d8d2] bg-white text-xl font-semibold text-[#8a8a86]">
                      {(fullName || handle || 'U').replace(/^@+/, '').charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1c1c1e]">Profile photo</p>
                    <p className="mt-1 text-xs text-[#6b6b6b]">Upload a square image. JPG, PNG, WebP, GIF, or AVIF up to 5MB.</p>
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      <label className={`inline-flex cursor-pointer items-center rounded-xl border border-[#e8e8e4] bg-white px-4 py-2 text-sm font-medium text-[#1c1c1e] transition hover:border-[#ccff00] ${avatarUploading ? 'pointer-events-none opacity-60' : ''}`}>
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={uploadCreatorAvatar} disabled={avatarUploading || saving} />
                        {avatarUploading ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Upload photo'}
                      </label>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          disabled={avatarUploading || saving}
                          className="text-sm text-[#6b6b6b] hover:text-[#1c1c1e] disabled:opacity-40"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Full name</label>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Handle</label>
                <input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@yourhandle" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Bio</label>
                <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00] resize-none" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Main platform</label>
                <select value={mainPlatform} onChange={(event) => setMainPlatform(event.target.value)} className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]">
                  {MAIN_PLATFORMS.map((platform) => (
                    <option key={platform} value={platform}>{labelPlatform(platform)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl text-[#1c1c1e]" style={{ letterSpacing: '-0.03em' }}>Stats</h2>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Follower count range</label>
                <select value={followerRange} onChange={(event) => setFollowerRange(event.target.value)} className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]">
                  <option value="">Select a range</option>
                  {FOLLOWER_RANGES.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Monthly UGC income range (optional)</label>
                <select value={incomeRange} onChange={(event) => setIncomeRange(event.target.value)} className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]">
                  <option value="">Select a range</option>
                  {INCOME_RANGES.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Niche tags</label>
                <input
                  value={nicheInput}
                  onChange={(event) => setNicheInput(event.target.value)}
                  placeholder="AI tools, SaaS, productivity"
                  className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                />
                <p className="text-xs text-[#9a9a9a] mt-1">Comma-separated</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="font-display text-2xl text-[#1c1c1e]" style={{ letterSpacing: '-0.03em' }}>Portfolio links</h2>
                <button onClick={addPortfolioItem} disabled={portfolioItems.length >= 6} className="btn-ghost border border-[#e8e8e4] disabled:opacity-40">
                  Add item ({portfolioItems.length}/6)
                </button>
              </div>

              {portfolioItems.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#dbdbd5] bg-[#fcfcfa] p-4 text-sm text-[#6b6b6b]">
                  Add up to 6 links from TikTok, Instagram, or YouTube.
                </div>
              )}

              <div className="space-y-3">
                {portfolioItems.map((item, index) => (
                  <div key={item.id} className="rounded-xl border border-[#e8e8e4] bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide">Item {index + 1}</p>
                      <button onClick={() => removePortfolioItem(item.id)} className="text-xs text-[#8a8a86] hover:text-[#1c1c1e]">Remove</button>
                    </div>
                    <div className="space-y-3">
                      <input
                        value={item.url}
                        onChange={(event) => updatePortfolioItem(item.id, 'url', event.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-[#e8e8e4] bg-[#fafaf9] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                      />
                      <div className="grid sm:grid-cols-2 gap-3">
                        <select
                          value={item.platform}
                          onChange={(event) => updatePortfolioItem(item.id, 'platform', event.target.value)}
                          className="w-full rounded-xl border border-[#e8e8e4] bg-[#fafaf9] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                        >
                          {MAIN_PLATFORMS.map((platform) => (
                            <option key={platform} value={platform}>{labelPlatform(platform)}</option>
                          ))}
                        </select>
                        <input
                          value={item.caption}
                          onChange={(event) => updatePortfolioItem(item.id, 'caption', event.target.value)}
                          placeholder="Caption"
                          className="w-full rounded-xl border border-[#e8e8e4] bg-[#fafaf9] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl text-[#1c1c1e]" style={{ letterSpacing: '-0.03em' }}>Review</h2>
              <div className="rounded-xl border border-[#e8e8e4] bg-white p-4 space-y-2 text-sm text-[#4f4f4f]">
                <p><span className="font-semibold text-[#1c1c1e]">Name:</span> {fullName || '—'}</p>
                <p><span className="font-semibold text-[#1c1c1e]">Handle:</span> @{handle.replace(/^@+/, '') || '—'}</p>
                <p><span className="font-semibold text-[#1c1c1e]">Main platform:</span> {labelPlatform(mainPlatform)}</p>
                <p><span className="font-semibold text-[#1c1c1e]">Followers:</span> {followerRange || 'Not set'}</p>
                <p><span className="font-semibold text-[#1c1c1e]">Income:</span> {incomeRange || 'Not set'}</p>
                <p><span className="font-semibold text-[#1c1c1e]">Portfolio links:</span> {portfolioItems.filter((item) => item.url.trim()).length}</p>
              </div>
              <p className="text-xs text-[#8a8a86]">This will save to your public creator profile.</p>
            </div>
          )}
        </div>

        {statusMessage && (
          <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${statusMessage.includes('updated') ? 'bg-[#ccff00] text-[#1c1c1e]' : 'bg-white border border-[#e8e8e4] text-[#6b6b6b]'}`}>
            {statusMessage}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            onClick={() => setStep((prev) => Math.max(0, prev - 1))}
            disabled={step === 0 || saving}
            className="btn-ghost border border-[#e8e8e4] disabled:opacity-40"
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((prev) => Math.min(STEPS.length - 1, prev + 1))}
              disabled={!canMoveForward || saving}
              className="btn-primary disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button onClick={submitCreator} disabled={saving || !canMoveForward} className="btn-primary disabled:opacity-40">
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
