'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { isEdUser } from '@/lib/ed-auth'

const BRAND_SWATCHES = ['#FF6B6B', '#6366F1', '#10B981', '#F59E0B', '#EC4899', '#14B8A6', '#CCFF00']

export default function NewEdClientPage() {
  const router = useRouter()
  const supabase = createClient()

  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [brandColor, setBrandColor] = useState('#FF6B6B')
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    async function bootstrap() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (!user) {
        router.replace('/login?redirectTo=/ed/clients/new')
        return
      }

      if (!isEdUser(user)) {
        router.replace('/dashboard')
        return
      }

      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        router.replace('/login?redirectTo=/ed/clients/new')
        return
      }

      setToken(accessToken)
    }

    bootstrap()
  }, [router, supabase])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return

    try {
      setSaving(true)
      setError('')

      const response = await fetch('/api/ed/clients', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          brand_color: brandColor,
          logo_url: logoUrl || null,
        }),
      })

      const body = (await response.json()) as { client?: { id: string }; error?: string }
      if (!response.ok || !body.client?.id) {
        throw new Error(body.error || 'Could not create client.')
      }

      router.push(`/ed/clients/${body.client.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create client.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-6 pb-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <p className="section-label mb-2">Ed command center</p>
          <h1 className="text-4xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>Add Client</h1>
        </div>
        <Link href="/ed" className="btn-ghost text-sm px-4 py-2">← Back</Link>
      </div>

      {error ? <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      <form onSubmit={onSubmit} className="card space-y-4">
        <div>
          <label className="text-sm font-medium text-[#1c1c1e]">Client name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Detris" className="mt-1 w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium text-[#1c1c1e]">Brand color</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {BRAND_SWATCHES.map((swatch) => {
              const active = brandColor.toLowerCase() === swatch.toLowerCase()
              return (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setBrandColor(swatch)}
                  className={`h-9 w-9 rounded-full border-2 ${active ? 'border-[#1c1c1e]' : 'border-white'}`}
                  style={{ backgroundColor: swatch }}
                  aria-label={`Select ${swatch}`}
                />
              )
            })}
          </div>
          <input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium text-[#1c1c1e]">Logo URL (optional)</label>
          <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className="mt-1 w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
        </div>

        <button disabled={saving} className="btn-primary text-sm px-4 py-2 disabled:opacity-60">
          {saving ? 'Creating...' : 'Create Client'}
        </button>
      </form>
    </div>
  )
}
