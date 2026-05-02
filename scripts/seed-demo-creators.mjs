#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const creators = [
  {
    email: 'demo+lorenzo@ottougc.com',
    displayName: 'Lorenzo Vale',
    handle: 'lorenzoai',
    headline: 'AI app demos with founder-led clarity and sharp launch hooks.',
    bio: 'Lorenzo turns complex AI products into simple short-form demos brands can actually use: hooks, walkthroughs, objection handling, and clear CTAs for technical buyers.',
    location: 'London, UK',
    hourlyRate: 550,
    platform: 'tiktok',
    followers: '50K – 250K',
    income: '$5K+/mo',
    profileViews: 428,
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Lorenzo&backgroundColor=ccff00',
    socials: [
      ['tiktok', 'https://www.tiktok.com/@lorenzoai'],
      ['youtube', 'https://www.youtube.com/@lorenzoai'],
    ],
    niches: ['SaaS & AI', 'Tech & Apps', 'Productivity'],
    skills: ['AI demos', 'SaaS explainers', 'Founder-style hooks', 'Launch videos'],
    experience: 'Has produced demo-led UGC for AI note-taking tools, workflow automation apps, and early-stage SaaS launches.',
    portfolio: [
      ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'AI workflow app demo with a 3-second pain-point hook', 'youtube'],
      ['https://www.youtube.com/watch?v=ysz5S6PUM-U', 'Productivity SaaS walkthrough for busy solo founders', 'youtube'],
      ['https://www.youtube.com/watch?v=jNQXAC9IVRw', 'Automation tool explainer built around before-and-after outcomes', 'youtube'],
    ],
  },
  {
    email: 'demo+friday@ottougc.com',
    displayName: 'Friday Lane',
    handle: 'fridaycreates',
    headline: 'Clean app tutorials and lifestyle-integrated tech content.',
    bio: 'Friday makes tech feel useful without sounding scripted. Strong fit for consumer apps, productivity tools, creator software, and everyday AI use cases.',
    location: 'Manchester, UK',
    hourlyRate: 425,
    platform: 'instagram',
    followers: '10K – 50K',
    income: '$2K – $5K/mo',
    profileViews: 316,
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Friday&backgroundColor=f5f5f0',
    socials: [
      ['instagram', 'https://www.instagram.com/fridaycreates'],
      ['tiktok', 'https://www.tiktok.com/@fridaycreates'],
    ],
    niches: ['Tech & Apps', 'Lifestyle & Vlogs', 'Productivity'],
    skills: ['App tutorials', 'Lifestyle UGC', 'Voiceover demos', 'Creator tools'],
    experience: 'Comfortable creating screen-record-led tutorials, talking-head intros, and lifestyle cutaways for mobile apps.',
    portfolio: [
      ['https://www.youtube.com/watch?v=ScMzIvxBSi4', 'Morning routine app integration with natural CTA', 'youtube'],
      ['https://www.youtube.com/watch?v=ysz5S6PUM-U', 'Creator tool tutorial with screen-record sections', 'youtube'],
      ['https://www.youtube.com/watch?v=jNQXAC9IVRw', 'Mobile app review framed around everyday use', 'youtube'],
    ],
  },
  {
    email: 'demo+ed@ottougc.com',
    displayName: 'Ed Corner',
    handle: 'edcornerugc',
    headline: 'Tech UGC creator focused on AI apps, creator tools, and practical demos.',
    bio: 'Ed creates no-fluff tech UGC that explains why an app matters, shows the product clearly, and gives brands content they can run as organic, paid, or founder-social creative.',
    location: 'New York, US',
    hourlyRate: 650,
    platform: 'tiktok',
    followers: '10K – 50K',
    income: '$5K+/mo',
    profileViews: 612,
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Ed&backgroundColor=ccff00',
    socials: [
      ['tiktok', 'https://www.tiktok.com/@edcornerugc'],
      ['youtube', 'https://www.youtube.com/@edcornerugc'],
    ],
    niches: ['AI Tools', 'Tech & Apps', 'Creator Economy'],
    skills: ['Tech UGC', 'AI app reviews', 'Paid social hooks', 'Product walkthroughs'],
    experience: 'Built tech UGC revenue from zero to consistent monthly deals by packaging product demos, creator POV content, and client-ready usage angles.',
    portfolio: [
      ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'AI language app review with practical creator use case', 'youtube'],
      ['https://www.youtube.com/watch?v=ScMzIvxBSi4', 'Short-form tech ad with direct-response hook', 'youtube'],
      ['https://www.youtube.com/watch?v=ysz5S6PUM-U', 'Creator workflow app walkthrough for TikTok audience', 'youtube'],
    ],
  },
  {
    email: 'demo+sage@ottougc.com',
    displayName: 'Sage Morgan',
    handle: 'sagemakesugc',
    headline: 'Wellness, wearable tech, and health app UGC with a calm premium feel.',
    bio: 'Sage is strongest where health, routines, and tech overlap. Good fit for fitness apps, habit trackers, wearables, supplements, and wellness tools that need trustworthy creator-led demos.',
    location: 'Bristol, UK',
    hourlyRate: 375,
    platform: 'instagram',
    followers: '1K – 10K',
    income: '$500 – $2K/mo',
    profileViews: 184,
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Sage&backgroundColor=e8f5e9',
    socials: [
      ['instagram', 'https://www.instagram.com/sagemakesugc'],
      ['tiktok', 'https://www.tiktok.com/@sagemakesugc'],
    ],
    niches: ['Health & Fitness', 'Lifestyle & Vlogs', 'Tech & Apps'],
    skills: ['Wellness UGC', 'Wearable tech', 'Routine content', 'Soft-sell reviews'],
    experience: 'Creates warm, trust-led product stories for habit apps, wellness platforms, fitness tools, and wearable tech brands.',
    portfolio: [
      ['https://www.youtube.com/watch?v=jNQXAC9IVRw', 'Fitness app check-in framed around habit building', 'youtube'],
      ['https://www.youtube.com/watch?v=ScMzIvxBSi4', 'Wearable tech routine video for busy professionals', 'youtube'],
      ['https://www.youtube.com/watch?v=ysz5S6PUM-U', 'Health app walkthrough with soft testimonial angle', 'youtube'],
    ],
  },
  {
    email: 'demo+willow@ottougc.com',
    displayName: 'Willow Hart',
    handle: 'willowontheroad',
    headline: 'Travel, lifestyle, and mobile tech creator for apps people use on the move.',
    bio: 'Willow creates bright travel-led UGC for booking apps, language tools, fintech, eSIMs, creator gear, and mobile productivity products.',
    location: 'Lisbon, PT',
    hourlyRate: 500,
    platform: 'youtube',
    followers: '50K – 250K',
    income: '$2K – $5K/mo',
    profileViews: 537,
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Willow&backgroundColor=e0f2fe',
    socials: [
      ['youtube', 'https://www.youtube.com/@willowontheroad'],
      ['instagram', 'https://www.instagram.com/willowontheroad'],
    ],
    niches: ['Travel', 'Tech & Apps', 'Lifestyle & Vlogs'],
    skills: ['Travel UGC', 'Mobile app demos', 'UGC storytelling', 'Location shoots'],
    experience: 'Pairs location-based footage with app demos for travel tools, mobile fintech, eSIM products, and creator workflow apps.',
    portfolio: [
      ['https://www.youtube.com/watch?v=ysz5S6PUM-U', 'Travel planning app demo from airport to hotel', 'youtube'],
      ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'eSIM app walkthrough with real travel context', 'youtube'],
      ['https://www.youtube.com/watch?v=ScMzIvxBSi4', 'Creator gear review shot as a travel day vlog', 'youtube'],
    ],
  },
]

function youtubeThumbnail(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match?.[1] ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null
}

async function ensureAuthUser(creator) {
  const { data: existingUsers, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) throw listError

  const existing = existingUsers.users.find((user) => user.email?.toLowerCase() === creator.email.toLowerCase())
  if (existing) return existing.id

  const { data, error } = await admin.auth.admin.createUser({
    email: creator.email,
    email_confirm: true,
    user_metadata: {
      role: 'creator',
      display_name: creator.displayName,
      handle: creator.handle,
      onboarding_complete: true,
      demo_creator: true,
    },
  })

  if (error) throw error
  return data.user.id
}

async function upsertCreator(creator) {
  const userId = await ensureAuthUser(creator)

  const { error: userError } = await admin
    .from('users')
    .upsert({ id: userId, email: creator.email, role: 'creator' }, { onConflict: 'id' })
  if (userError) throw userError

  const creatorPayload = {
    user_id: userId,
    display_name: creator.displayName,
    bio: creator.bio,
    avatar_url: creator.avatar,
    location: creator.location,
    hourly_rate: creator.hourlyRate,
    availability: 'open',
    is_verified: true,
    is_pro: false,
    profile_views: creator.profileViews,
    socials: Object.fromEntries(creator.socials),
  }

  const { data: existingCreator, error: lookupError } = await admin
    .from('creators')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  if (lookupError) throw lookupError

  let creatorId = existingCreator?.id
  if (creatorId) {
    const { error } = await admin.from('creators').update(creatorPayload).eq('id', creatorId)
    if (error) throw error
  } else {
    const { data, error } = await admin.from('creators').insert(creatorPayload).select('id').single()
    if (error) throw error
    creatorId = data.id
  }

  const { error: deleteTagsError } = await admin.from('creator_tags').delete().eq('creator_id', creatorId)
  if (deleteTagsError) throw deleteTagsError

  const tags = [
    `handle:${creator.handle}`,
    `main_platform:${creator.platform}`,
    `followers:${creator.followers}`,
    `income:${creator.income}`,
    `exp:${creator.experience}`,
    `headline:${creator.headline}`,
    ...creator.niches.map((niche) => `niche:${niche}`),
    ...creator.skills.map((skill) => `skill:${skill}`),
    ...creator.portfolio.map(([, caption]) => `content_type:${caption.toLowerCase().includes('tutorial') || caption.toLowerCase().includes('walkthrough') ? 'Tutorial / demo' : caption.toLowerCase().includes('review') ? 'Product review' : caption.toLowerCase().includes('routine') ? 'Lifestyle integrated' : 'Ad creative'}`),
  ]

  const uniqueTags = Array.from(new Set(tags))
  const { error: insertTagsError } = await admin.from('creator_tags').insert(uniqueTags.map((tag) => ({ creator_id: creatorId, tag })))
  if (insertTagsError) throw insertTagsError

  const { error: deleteSocialsError } = await admin.from('creator_socials').delete().eq('creator_id', creatorId)
  if (deleteSocialsError) throw deleteSocialsError

  const { error: insertSocialsError } = await admin.from('creator_socials').insert(
    creator.socials.map(([platform, socialUrl]) => ({ creator_id: creatorId, platform, url: socialUrl })),
  )
  if (insertSocialsError) throw insertSocialsError

  const { error: deletePortfolioError } = await admin.from('portfolio_items').delete().eq('creator_id', creatorId)
  if (deletePortfolioError) throw deletePortfolioError

  const { error: insertPortfolioError } = await admin.from('portfolio_items').insert(
    creator.portfolio.map(([itemUrl, caption, platform], index) => ({
      creator_id: creatorId,
      type: 'video',
      url: itemUrl,
      thumbnail_url: youtubeThumbnail(itemUrl),
      caption,
      platform,
      views_count: Math.round((creator.profileViews + index * 117) * 8),
      sort_order: index,
    })),
  )
  if (insertPortfolioError) throw insertPortfolioError

  return { id: creatorId, name: creator.displayName }
}

const run = async () => {
  const results = []
  for (const creator of creators) {
    results.push(await upsertCreator(creator))
  }
  console.log(`Seeded ${results.length} demo creators:`)
  for (const result of results) console.log(`- ${result.name}: ${result.id}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
