#!/usr/bin/env node

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const fallbackKey = process.env.RESEND_API_KEY
const apiKey = serviceRoleKey || fallbackKey

if (!url || !apiKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL and/or key (SUPABASE_SERVICE_ROLE_KEY or RESEND_API_KEY).')
  process.exit(1)
}

const clientsSeed = [
  { name: 'Detris', brand_color: '#FF6B6B' },
  { name: 'Clawbite', brand_color: '#6366F1' },
]

const campaignsSeed = [
  {
    client_name: 'Detris',
    name: 'Detris Creator Growth',
    start_date: '2026-04-01',
    end_date: null,
    status: 'active',
    platforms: ['TikTok', 'Instagram/Reels', 'YouTube', 'Facebook'],
    notes: 'Seeded campaign for Ed dashboard.',
    tiktok_url: 'https://tiktok.com/@detris',
    instagram_url: 'https://instagram.com/detris',
    youtube_url: 'https://youtube.com/@detris',
    facebook_url: 'https://facebook.com/detris',
  },
  {
    client_name: 'Clawbite',
    name: 'Clawbite Product Awareness',
    start_date: '2026-04-01',
    end_date: null,
    status: 'active',
    platforms: ['TikTok', 'Instagram/Reels', 'YouTube', 'Facebook'],
    notes: 'Seeded campaign for Ed dashboard.',
    tiktok_url: 'https://tiktok.com/@clawbite',
    instagram_url: 'https://instagram.com/clawbite',
    youtube_url: 'https://youtube.com/@clawbite',
    facebook_url: 'https://facebook.com/clawbite',
  },
]

const goalRowsFor = (campaignId) => [
  { campaign_id: campaignId, platform: 'All', target_per_month: 10 },
]

const headers = {
  apikey: apiKey,
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
}

async function http(path, options = {}) {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Request failed (${response.status}) ${path}: ${text}`)
  }

  if (response.status === 204) return null
  return response.json()
}

const run = async () => {
  await http('clients?on_conflict=name', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(clientsSeed),
  })

  const clients = await http('clients?select=id,name&name=in.(Detris,Clawbite)')
  const clientIdByName = new Map(clients.map((client) => [client.name, client.id]))

  const existingCampaigns = await http('campaigns?select=id,client_id,name')
  const existingKeyToId = new Map(existingCampaigns.map((row) => [`${row.client_id}::${row.name}`, row.id]))

  const toInsert = campaignsSeed
    .map((campaign) => {
      const clientId = clientIdByName.get(campaign.client_name)
      if (!clientId) return null
      const key = `${clientId}::${campaign.name}`
      if (existingKeyToId.has(key)) return null
      return {
        client_id: clientId,
        name: campaign.name,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        status: campaign.status,
        platforms: campaign.platforms,
        notes: campaign.notes,
        tiktok_url: campaign.tiktok_url,
        instagram_url: campaign.instagram_url,
        youtube_url: campaign.youtube_url,
        facebook_url: campaign.facebook_url,
      }
    })
    .filter(Boolean)

  if (toInsert.length) {
    await http('campaigns', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(toInsert),
    })
  }

  const allCampaigns = await http('campaigns?select=id,client_id,name')

  const goalRows = []
  for (const campaign of campaignsSeed) {
    const clientId = clientIdByName.get(campaign.client_name)
    if (!clientId) continue
    const row = allCampaigns.find((item) => item.client_id === clientId && item.name === campaign.name)
    if (!row?.id) continue
    goalRows.push(...goalRowsFor(row.id))
  }

  if (goalRows.length) {
    await http('campaign_goals?on_conflict=campaign_id,platform', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(goalRows),
    })
  }

  console.log('Seed complete for Ed clients/campaigns/goals.')
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
