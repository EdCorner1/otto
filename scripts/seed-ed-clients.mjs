#!/usr/bin/env node

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const fallbackKey = process.env.RESEND_API_KEY
const apiKey = serviceRoleKey || fallbackKey

if (!url || !apiKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL and/or key (SUPABASE_SERVICE_ROLE_KEY or RESEND_API_KEY).')
  process.exit(1)
}

const rows = [
  { name: 'Detris', brand_color: '#FF6B6B' },
  { name: 'Clawbite', brand_color: '#6366F1' },
]

const run = async () => {
  const response = await fetch(`${url}/rest/v1/clients?on_conflict=name`, {
    method: 'POST',
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Seed failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  console.log('Seeded clients:', data)
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
