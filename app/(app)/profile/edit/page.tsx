'use client'

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, LoaderCircle, Play, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import {
  DIRECT_VIDEO_PLATFORM,
  buildYouTubeEmbedUrl,
  detectPortfolioPlatform,
  inferPortfolioThumbnail,
  isDirectVideoUrl,
  isManagedPortfolioVideoUrl,
} from '@/lib/portfolio-media'

type Role = 'creator' | 'brand'

type PortfolioDraft = {
  id: string
  url: string
  platform: string
  caption: string
  thumbnailUrl?: string | null
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
    thumbnail_url?: string | null
  }>
}

type CreatorDraftSnapshot = {
  fullName: string
  handle: string
  bio: string
  avatarUrl: string
  mainPlatform: string
  followerRange: string
  incomeRange: string
  nicheInput: string
  portfolioItems: Array<{ url: string; platform: string; caption: string }>
}

type BrandDraftSnapshot = {
  companyName: string
  companyDescription: string
  logoUrl: string
  industry: string
  websiteUrl: string
}

const MAIN_PLATFORMS = ['tiktok', 'instagram', 'youtube'] as const
const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.webm,.m4v'
const FOLLOWER_RANGES = ['< 1K', '1K – 10K', '10K – 50K', '50K – 250K', '250K – 500K', '500K +']
const INCOME_RANGES = ['Not sharing', '$0 – $500/mo', '$500 – $2K/mo', '$2K – $5K/mo', '$5K+/mo']
const STEPS = ['Basic Info', 'Stats', 'Portfolio', 'Review'] as const
const MAX_PORTFOLIO_ITEMS = 6
const MAX_VIDEO_SIZE = 500 * 1024 * 1024
const AVATAR_BUCKET = 'avatars'

function labelPlatform(platform: string) {
  if (platform === 'tiktok') return 'TikTok'
  if (platform === 'instagram') return 'Instagram'
  if (platform === 'youtube') return 'YouTube'
  if (platform === DIRECT_VIDEO_PLATFORM) return 'Direct upload'
  return platform
}

function normalizePortfolioDrafts(items: PortfolioDraft[]) {
  return items
    .map((item) => ({
      url: item.url.trim(),
      platform: item.platform.trim().toLowerCase(),
      caption: item.caption.trim(),
    }))
    .filter((item) => item.url && item.platform)
    .slice(0, MAX_PORTFOLIO_ITEMS)
}

function createCreatorSnapshot(input: CreatorDraftSnapshot): string {
  return JSON.stringify({
    fullName: input.fullName.trim(),
    handle: input.handle.trim().replace(/^@+/, ''),
    bio: input.bio.trim(),
    avatarUrl: input.avatarUrl.trim(),
    mainPlatform: input.mainPlatform.trim().toLowerCase(),
    followerRange: input.followerRange.trim(),
    incomeRange: input.incomeRange.trim(),
    nicheInput: input.nicheInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8),
    portfolioItems: input.portfolioItems,
  })
}

function createBrandSnapshot(input: BrandDraftSnapshot): string {
  return JSON.stringify({
    companyName: input.companyName.trim(),
    companyDescription: input.companyDescription.trim(),
    logoUrl: input.logoUrl.trim(),
    industry: input.industry.trim(),
    websiteUrl: input.websiteUrl.trim(),
  })
}

function derivePortfolioThumbnail(item: PortfolioDraft) {
  return item.thumbnailUrl || inferPortfolioThumbnail(item.url, item.platform)
}

function extractAvatarStoragePath(url: string) {
  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`
  if (!url.includes(marker)) return null
  const [, rawPath = ''] = url.split(marker)
  const cleanPath = rawPath.split('?')[0]
  return cleanPath || null
}

export default function ProfileEditPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const saveSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [role, setRole] = useState<Role | null>(null)

  const [brandId, setBrandId] = useState('')
  const [creatorId, setCreatorId] = useState('')

  const [step, setStep] = useState(0)
  const [fullName, setFullName] = useState('')
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [previousAvatarUrl, setPreviousAvatarUrl] = useState<string | null>(null)
  const [mainPlatform, setMainPlatform] = useState<string>('tiktok')
  const [followerRange, setFollowerRange] = useState('')
  const [incomeRange, setIncomeRange] = useState('')
  const [nicheInput, setNicheInput] = useState('')
  const [portfolioItems, setPortfolioItems] = useState<PortfolioDraft[]>([])
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoUploadProgress, setVideoUploadProgress] = useState(0)

  const [companyName, setCompanyName] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [industry, setIndustry] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')

  const [initialCreatorSnapshot, setInitialCreatorSnapshot] = useState('')
  const [initialBrandSnapshot, setInitialBrandSnapshot] = useState('')

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

        const nextBrand = {
          companyName: brandRow.company_name || '',
          companyDescription: brandRow.bio || '',
          logoUrl: brandRow.logo_url || '',
          industry: brandRow.industry || '',
          websiteUrl: brandRow.website || '',
        }

        setBrandId(brandRow.id)
        setCompanyName(nextBrand.companyName)
        setCompanyDescription(nextBrand.companyDescription)
        setLogoUrl(nextBrand.logoUrl)
        setIndustry(nextBrand.industry)
        setWebsiteUrl(nextBrand.websiteUrl)
        setInitialBrandSnapshot(createBrandSnapshot(nextBrand))
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
      const nextPortfolioItems = (profile.portfolioItems || []).slice(0, MAX_PORTFOLIO_ITEMS).map((item) => ({
        id: item.id,
        url: item.url,
        platform: detectPortfolioPlatform(item.url, item.platform || profile.mainPlatform || 'tiktok'),
        caption: item.caption || '',
        thumbnailUrl: item.thumbnail_url || null,
      }))

      const nextCreator = {
        fullName: profile.fullName || '',
        handle: profile.handle || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
        mainPlatform: profile.mainPlatform || 'tiktok',
        followerRange: profile.followerRange || '',
        incomeRange: profile.incomeRange || '',
        nicheInput: profile.nicheTags.join(', '),
        portfolioItems: normalizePortfolioDrafts(nextPortfolioItems),
      }

      setFullName(nextCreator.fullName)
      setHandle(nextCreator.handle)
      setBio(nextCreator.bio)
      setAvatarUrl(nextCreator.avatarUrl)
      setPreviousAvatarUrl(nextCreator.avatarUrl || null)
      setMainPlatform(nextCreator.mainPlatform)
      setFollowerRange(nextCreator.followerRange)
      setIncomeRange(nextCreator.incomeRange)
      setNicheInput(nextCreator.nicheInput)
      setPortfolioItems(nextPortfolioItems)
      setInitialCreatorSnapshot(createCreatorSnapshot(nextCreator))
      setLoading(false)
    }

    void load()

    return () => {
      if (saveSuccessTimeoutRef.current) clearTimeout(saveSuccessTimeoutRef.current)
    }
  }, [router, supabase])

  const canMoveForward = useMemo(() => {
    if (role !== 'creator') return true
    if (step === 0) {
      return Boolean(fullName.trim() && handle.trim() && bio.trim() && mainPlatform)
    }
    return true
  }, [bio, fullName, handle, mainPlatform, role, step])

  const currentCreatorSnapshot = useMemo(
    () => createCreatorSnapshot({
      fullName,
      handle,
      bio,
      avatarUrl,
      mainPlatform,
      followerRange,
      incomeRange,
      nicheInput,
      portfolioItems: normalizePortfolioDrafts(portfolioItems),
    }),
    [avatarUrl, bio, followerRange, fullName, handle, incomeRange, mainPlatform, nicheInput, portfolioItems]
  )

  const currentBrandSnapshot = useMemo(
    () => createBrandSnapshot({ companyName, companyDescription, logoUrl, industry, websiteUrl }),
    [companyDescription, companyName, industry, logoUrl, websiteUrl]
  )

  const creatorHasUnsavedChanges = role === 'creator' && !loading && Boolean(initialCreatorSnapshot) && currentCreatorSnapshot !== initialCreatorSnapshot
  const brandHasUnsavedChanges = role === 'brand' && !loading && Boolean(initialBrandSnapshot) && currentBrandSnapshot !== initialBrandSnapshot
  const hasUnsavedChanges = creatorHasUnsavedChanges || brandHasUnsavedChanges

  const showSaveBar = role === 'brand' ? hasUnsavedChanges : hasUnsavedChanges || step === STEPS.length - 1

  const markSaved = (snapshot: string) => {
    if (role === 'creator') setInitialCreatorSnapshot(snapshot)
    if (role === 'brand') setInitialBrandSnapshot(snapshot)
    setSaveSuccess(true)
    if (saveSuccessTimeoutRef.current) clearTimeout(saveSuccessTimeoutRef.current)
    saveSuccessTimeoutRef.current = setTimeout(() => setSaveSuccess(false), 2200)
  }

  const cleanupDirectVideo = async (videoUrl: string) => {
    if (!creatorId || !isManagedPortfolioVideoUrl(videoUrl)) return

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (!accessToken) return

    await fetch('/api/portfolio/remove-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ creatorId, videoUrl }),
    }).catch(() => undefined)
  }

  const addPortfolioItem = () => {
    if (portfolioItems.length >= MAX_PORTFOLIO_ITEMS) return
    setPortfolioItems((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        url: '',
        platform: mainPlatform || 'tiktok',
        caption: '',
        thumbnailUrl: null,
      },
    ])
    setSaveSuccess(false)
    setStatusMessage('')
  }

  const updatePortfolioItem = (id: string, key: keyof PortfolioDraft, value: string) => {
    setPortfolioItems((prev) => prev.map((item) => {
      if (item.id !== id) return item
      const next = { ...item, [key]: value }
      if (key === 'url' || key === 'platform') {
        const nextPlatform = detectPortfolioPlatform(
          key === 'url' ? value : next.url,
          key === 'platform' ? value : next.platform
        )
        next.platform = nextPlatform
        next.thumbnailUrl = inferPortfolioThumbnail(next.url, nextPlatform)
      }
      return next
    }))
    setSaveSuccess(false)
    setStatusMessage('')
  }

  const removePortfolioItem = async (id: string) => {
    const itemToRemove = portfolioItems.find((item) => item.id === id)
    setPortfolioItems((prev) => prev.filter((item) => item.id !== id))
    setSaveSuccess(false)
    setStatusMessage('')

    if (itemToRemove?.url && isManagedPortfolioVideoUrl(itemToRemove.url)) {
      await cleanupDirectVideo(itemToRemove.url)
    }
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
    setSaveSuccess(false)
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

      const result = (await response.json()) as { error?: string; avatarUrl?: string | null; previousAvatarUrl?: string | null }
      if (!response.ok || !result.avatarUrl) {
        setStatusMessage(result.error || 'Could not upload profile photo.')
        return
      }

      setPreviousAvatarUrl((current) => current || result.previousAvatarUrl || null)
      setAvatarUrl(result.avatarUrl)
      setStatusMessage('Profile photo ready to save.')
    } catch {
      setStatusMessage('Could not upload profile photo.')
    } finally {
      setAvatarUploading(false)
    }
  }

  const uploadPortfolioVideo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !creatorId) return

    if (portfolioItems.length >= MAX_PORTFOLIO_ITEMS) {
      setStatusMessage('You can only add up to 6 videos.')
      return
    }

    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    if (!allowedTypes.includes(file.type) && !['mp4', 'mov', 'webm', 'm4v'].includes(extension)) {
      setStatusMessage('Upload an MP4, MOV, or WebM video.')
      return
    }

    if (file.size > MAX_VIDEO_SIZE) {
      setStatusMessage('Videos must be 500MB or smaller.')
      return
    }

    setVideoUploading(true)
    setVideoUploadProgress(0)
    setSaveSuccess(false)
    setStatusMessage('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        setStatusMessage('You need to sign in again before uploading a video.')
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('creatorId', creatorId)

      const xhr = new XMLHttpRequest()
      const uploadResult = await new Promise<{
        status: number
        body: { error?: string; videoUrl?: string; title?: string; platform?: string; thumbnailUrl?: string | null }
      }>((resolve, reject) => {
        xhr.open('POST', '/api/portfolio/upload-video')
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
        xhr.responseType = 'json'

        xhr.upload.onprogress = (progressEvent) => {
          if (progressEvent.lengthComputable) {
            setVideoUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100))
          }
        }

        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.onload = () => {
          resolve({
            status: xhr.status,
            body: (xhr.response as { error?: string; videoUrl?: string; title?: string; platform?: string; thumbnailUrl?: string | null }) || {},
          })
        }

        xhr.send(formData)
      })

      if (uploadResult.status < 200 || uploadResult.status >= 300 || !uploadResult.body.videoUrl) {
        setStatusMessage(uploadResult.body.error || 'Could not upload video.')
        return
      }

      setPortfolioItems((prev) => [
        ...prev,
        {
          id: `new-upload-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          url: uploadResult.body.videoUrl || '',
          platform: uploadResult.body.platform || DIRECT_VIDEO_PLATFORM,
          caption: uploadResult.body.title || 'Untitled video',
          thumbnailUrl: uploadResult.body.thumbnailUrl || null,
        },
      ].slice(0, MAX_PORTFOLIO_ITEMS))
      setVideoUploadProgress(100)
      setStatusMessage('Video uploaded. Save changes to publish it to your profile.')
      setStep(2)
    } catch {
      setStatusMessage('Could not upload video.')
    } finally {
      setVideoUploading(false)
      window.setTimeout(() => setVideoUploadProgress(0), 500)
    }
  }

  const submitCreator = async () => {
    if (!creatorId) return
    setSaving(true)
    setSaveSuccess(false)
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
      portfolioItems: normalizePortfolioDrafts(portfolioItems),
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

    const previousPath = previousAvatarUrl ? extractAvatarStoragePath(previousAvatarUrl) : null
    if (previousPath && previousAvatarUrl !== avatarUrl) {
      await supabase.storage.from(AVATAR_BUCKET).remove([previousPath]).catch(() => undefined)
    }

    setPreviousAvatarUrl(avatarUrl || null)
    setSaving(false)
    setStatusMessage('Profile updated.')
    markSaved(createCreatorSnapshot({
      fullName,
      handle,
      bio,
      avatarUrl,
      mainPlatform,
      followerRange,
      incomeRange,
      nicheInput,
      portfolioItems: normalizePortfolioDrafts(portfolioItems),
    }))
  }

  const submitBrand = async () => {
    if (!brandId) return
    setSaving(true)
    setSaveSuccess(false)
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
    markSaved(createBrandSnapshot({ companyName, companyDescription, logoUrl, industry, websiteUrl }))
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
              <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]" />
            </div>

            <div>
              <label className="block text-xs text-[#6b6b6b] mb-1">Company description</label>
              <textarea value={companyDescription} onChange={(event) => setCompanyDescription(event.target.value)} rows={5} className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00] resize-none" />
            </div>

            <div>
              <label className="block text-xs text-[#6b6b6b] mb-1">Logo URL</label>
              <input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://..." className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]" />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Industry</label>
                <input value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="SaaS, AI tools, Fintech..." className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]" />
              </div>

              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Website URL</label>
                <input value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://..." className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]" />
              </div>
            </div>
          </div>

          {statusMessage && (
            <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${statusMessage.includes('updated') ? 'bg-[#ccff00] text-[#1c1c1e]' : 'bg-white border border-[#e8e8e4] text-[#6b6b6b]'}`}>
              {statusMessage}
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-3">
            {saveSuccess && (
              <div className="inline-flex items-center gap-2 rounded-full bg-[#ecffd0] px-3 py-1.5 text-xs font-semibold text-[#1c1c1e]">
                <Check className="h-3.5 w-3.5" /> Saved
              </div>
            )}
            {hasUnsavedChanges && (
              <button onClick={submitBrand} disabled={saving} className="btn-primary disabled:opacity-40 inline-flex items-center gap-2">
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {saving ? 'Saving changes...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1c1e]">
      <div className="max-w-3xl mx-auto px-6 py-8 pb-32">
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
                          onClick={() => {
                            setAvatarUrl('')
                            setSaveSuccess(false)
                            setStatusMessage('')
                          }}
                          disabled={avatarUploading || saving}
                          className="text-sm text-[#6b6b6b] hover:text-[#1c1c1e] disabled:opacity-40"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {creatorHasUnsavedChanges && (
                      <p className="mt-2 text-xs font-medium text-[#6b6b6b]">You have unsaved profile photo changes.</p>
                    )}
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
                <input value={nicheInput} onChange={(event) => setNicheInput(event.target.value)} placeholder="AI tools, SaaS, productivity" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]" />
                <p className="text-xs text-[#9a9a9a] mt-1">Comma-separated</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-display text-2xl text-[#1c1c1e]" style={{ letterSpacing: '-0.03em' }}>Portfolio videos</h2>
                  <p className="mt-1 text-sm text-[#6b6b6b]">Upload videos directly to Otto or add a YouTube link. Max 6 items.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <input ref={videoInputRef} type="file" accept={VIDEO_ACCEPT} className="hidden" onChange={uploadPortfolioVideo} disabled={videoUploading || saving || portfolioItems.length >= MAX_PORTFOLIO_ITEMS} />
                  <button type="button" onClick={() => videoInputRef.current?.click()} disabled={videoUploading || saving || portfolioItems.length >= MAX_PORTFOLIO_ITEMS} className="btn-primary disabled:opacity-40 inline-flex items-center gap-2">
                    {videoUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {videoUploading ? 'Uploading...' : 'Add video'}
                  </button>
                  <button onClick={addPortfolioItem} disabled={portfolioItems.length >= MAX_PORTFOLIO_ITEMS || saving} className="btn-ghost border border-[#e8e8e4] disabled:opacity-40">
                    Add YouTube link
                  </button>
                </div>
              </div>

              {videoUploading && (
                <div className="rounded-2xl border border-[#e8e8e4] bg-[#fcfcfa] p-4">
                  <div className="mb-2 flex items-center justify-between text-sm font-medium text-[#1c1c1e]">
                    <span>Uploading video</span>
                    <span>{videoUploadProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#ecece7]">
                    <div className="h-full rounded-full bg-[#ccff00] transition-all" style={{ width: `${videoUploadProgress}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-[#6b6b6b]">MP4, MOV, or WebM up to 500MB.</p>
                </div>
              )}

              {portfolioItems.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#dbdbd5] bg-[#fcfcfa] p-4 text-sm text-[#6b6b6b]">
                  Upload up to 6 videos directly or add YouTube links.
                </div>
              )}

              <div className="space-y-4">
                {portfolioItems.map((item, index) => {
                  const thumbnail = derivePortfolioThumbnail(item)
                  const youtubeEmbedUrl = buildYouTubeEmbedUrl(item.url)
                  const directVideo = isDirectVideoUrl(item.url)

                  return (
                    <div key={item.id} className="rounded-2xl border border-[#e8e8e4] bg-white p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide">Video {index + 1}</p>
                          <p className="mt-1 text-xs text-[#8a8a86]">{labelPlatform(item.platform)} {directVideo ? '• uploaded to Otto' : youtubeEmbedUrl ? '• YouTube embed' : '• external link'}</p>
                        </div>
                        <button onClick={() => void removePortfolioItem(item.id)} className="inline-flex items-center gap-1 text-xs text-[#8a8a86] hover:text-[#1c1c1e]">
                          <X className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[180px,1fr]">
                        <div className="overflow-hidden rounded-2xl border border-[#ecece7] bg-[#1c1c1e] aspect-[9/16]">
                          {directVideo ? (
                            <video src={item.url} controls className="h-full w-full object-cover" />
                          ) : youtubeEmbedUrl ? (
                            <iframe src={youtubeEmbedUrl} title={item.caption || `YouTube video ${index + 1}`} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                          ) : thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumbnail} alt={item.caption || 'Portfolio thumbnail'} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/75">
                              <Play className="h-6 w-6" />
                              <span className="text-xs uppercase tracking-[0.18em]">Preview</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-[#6b6b6b] mb-1">Video URL</label>
                            <input value={item.url} onChange={(event) => updatePortfolioItem(item.id, 'url', event.target.value)} placeholder="https://youtube.com/..." disabled={directVideo} className="w-full rounded-xl border border-[#e8e8e4] bg-[#fafaf9] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00] disabled:opacity-60" />
                            {directVideo && <p className="mt-1 text-xs text-[#8a8a86]">Direct-uploaded videos use a locked Supabase URL.</p>}
                          </div>

                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-[#6b6b6b] mb-1">Platform</label>
                              <input value={labelPlatform(item.platform)} readOnly className="w-full rounded-xl border border-[#e8e8e4] bg-[#f4f4f1] px-3 py-2.5 text-sm text-[#5f5f5a]" />
                            </div>
                            <div>
                              <label className="block text-xs text-[#6b6b6b] mb-1">Title</label>
                              <input value={item.caption} onChange={(event) => updatePortfolioItem(item.id, 'caption', event.target.value)} placeholder="AI app demo for a productivity tool" className="w-full rounded-xl border border-[#e8e8e4] bg-[#fafaf9] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
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
                <p><span className="font-semibold text-[#1c1c1e]">Portfolio videos:</span> {portfolioItems.filter((item) => item.url.trim()).length}</p>
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
          <button onClick={() => setStep((prev) => Math.max(0, prev - 1))} disabled={step === 0 || saving} className="btn-ghost border border-[#e8e8e4] disabled:opacity-40">
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep((prev) => Math.min(STEPS.length - 1, prev + 1))} disabled={!canMoveForward || saving} className="btn-primary disabled:opacity-40">
              Continue
            </button>
          ) : (
            <button onClick={submitCreator} disabled={saving || !canMoveForward} className="btn-primary disabled:opacity-40 inline-flex items-center gap-2">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Saving changes...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {showSaveBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e8e8e4] bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1c1c1e]">{hasUnsavedChanges ? 'You have unsaved changes' : 'Ready to publish your latest edits'}</p>
              <p className="text-xs text-[#6b6b6b]">
                {saveSuccess ? 'Saved successfully.' : avatarUploading || videoUploading ? 'Uploads finish first, then save your profile.' : 'Save to update your public profile.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#ecffd0] px-3 py-2 text-xs font-semibold text-[#1c1c1e]">
                  <Check className="h-3.5 w-3.5" /> Saved
                </span>
              )}
              {hasUnsavedChanges && (
                <button type="button" onClick={() => void submitCreator()} disabled={saving || avatarUploading || videoUploading} className="btn-primary disabled:opacity-40 inline-flex items-center gap-2">
                  {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  {saving ? 'Saving changes...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
