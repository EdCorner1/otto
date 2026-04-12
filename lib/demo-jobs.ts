export type DemoJob = {
  id: string
  title: string
  description: string
  platforms: string[]
  deliverables: string[]
  budget_range: string
  timeline: string
  status: 'open'
  created_at: string
  requirements: string[]
  brand: {
    company_name: string
    industry: string
    website?: string
  }
}

const brand = {
  company_name: 'Otto UGC',
  industry: 'Creator Platform',
  website: 'https://otto.edcorner.co.uk',
}

export const DEMO_JOBS: DemoJob[] = [
  {
    id: 'demo-otto-launch-1',
    title: 'Otto UGC Launch Sprint — 4 TikTok Testimonials',
    description:
      'We’re launching Otto UGC and need creators to produce short testimonial-style videos about how Otto helps creators land better paid brand work. Natural tone, no overproduced edits.',
    platforms: ['TikTok', 'Instagram Reels'],
    deliverables: ['Demo/review', 'Sponsored post'],
    budget_range: '£250-500',
    timeline: 'Within 1 week',
    status: 'open',
    created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    requirements: [
      'Creator focused on tech tools or creator economy',
      'Comfortable speaking on camera',
      'Can deliver vertical 9:16 footage + raw files',
    ],
    brand,
  },
  {
    id: 'demo-otto-howto-2',
    title: 'Otto How-To Series — 3 Tutorial Shorts',
    description:
      'Create a mini tutorial series showing creators how to use Otto to organize briefs, send applications, and track deal flow. Clean, practical, no fluff.',
    platforms: ['YouTube Shorts', 'TikTok'],
    deliverables: ['Tutorial/how-to'],
    budget_range: '£500-1,000',
    timeline: 'Within 2 weeks',
    status: 'open',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    requirements: [
      'Experience making product education content',
      'Comfortable screen recording + voiceover',
      'Strong hooks in first 2 seconds',
    ],
    brand,
  },
  {
    id: 'demo-otto-case-3',
    title: 'Creator Case Study UGC — “From 0 to First Paid Brief”',
    description:
      'Produce one authentic case-study style video describing a realistic journey from setting up profile to landing first paid brief on Otto.',
    platforms: ['TikTok', 'LinkedIn'],
    deliverables: ['Demo/review', 'Comparison'],
    budget_range: '£250-500',
    timeline: 'Within 1 week',
    status: 'open',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    requirements: [
      'Strong storytelling and personal-brand voice',
      'Can show clear before/after outcome framing',
    ],
    brand,
  },
  {
    id: 'demo-otto-podcast-4',
    title: 'Otto UGC Clips — Podcast-style talking head content',
    description:
      'We need 6 short clips from long-form talking points around creator rates, deal negotiation, and workflow. Punchy edits with clean subtitles.',
    platforms: ['YouTube Shorts', 'Instagram Reels'],
    deliverables: ['Tutorial/how-to', 'Sponsored post'],
    budget_range: '£500-1,000',
    timeline: 'Within 2 weeks',
    status: 'open',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
    requirements: [
      'Confident on camera delivery',
      'Can deliver subtitle-ready footage',
    ],
    brand,
  },
  {
    id: 'demo-otto-community-5',
    title: 'Community Invitation UGC — “Join Otto Creators”',
    description:
      'Record creator POV invitation videos to drive signups for Otto’s creator community. Focus on practical benefits and social proof.',
    platforms: ['TikTok', 'Twitter/X'],
    deliverables: ['Sponsored post'],
    budget_range: '£100-250',
    timeline: 'Within 1 week',
    status: 'open',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString(),
    requirements: [
      'Natural speaking style (not ad voice)',
      'Audience of aspiring or active UGC creators preferred',
    ],
    brand,
  },
  {
    id: 'demo-otto-tool-stack-6',
    title: 'Otto vs Spreadsheet Workflow Comparison',
    description:
      'Build a side-by-side short showing old spreadsheet workflow vs Otto workflow for creators managing multiple brand deals.',
    platforms: ['TikTok', 'YouTube Shorts'],
    deliverables: ['Comparison', 'Tutorial/how-to'],
    budget_range: '£250-500',
    timeline: 'Within 2 weeks',
    status: 'open',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 35).toISOString(),
    requirements: [
      'Clear communication of process improvements',
      'Can create simple screen-record visual narratives',
    ],
    brand,
  },
  {
    id: 'demo-otto-onboarding-7',
    title: 'New Creator Onboarding Explainer (UGC Friendly)',
    description:
      'Create friendly onboarding videos for new creators joining Otto. Explain profile setup, portfolio upload, and first-application flow.',
    platforms: ['Instagram Reels', 'TikTok'],
    deliverables: ['Tutorial/how-to'],
    budget_range: '£250-500',
    timeline: 'Within 1 month',
    status: 'open',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    requirements: [
      'Beginner-friendly explanatory style',
      'Can simplify product flows in under 45 seconds',
    ],
    brand,
  },
  {
    id: 'demo-otto-trust-8',
    title: 'Trust Builder UGC — “How Otto Protects Creators”',
    description:
      'We need short trust-focused clips around clear briefs, transparent scope, and safer creator-brand collaborations.',
    platforms: ['LinkedIn', 'Instagram Reels'],
    deliverables: ['Demo/review', 'Sponsored post'],
    budget_range: '£250-500',
    timeline: 'Flexible',
    status: 'open',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
    requirements: [
      'Professional tone with creator relatability',
      'Credible delivery around creator rights and quality standards',
    ],
    brand,
  },
]

export function getDemoJobById(id: string) {
  return DEMO_JOBS.find((job) => job.id === id) || null
}
