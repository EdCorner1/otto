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
    logo_initials?: string
  }
}

const demoBrands = [
  { company_name: 'Otto UGC', industry: 'Creator Platform', website: 'https://ottougc.com', logo_initials: 'O' },
  { company_name: 'Raycon', industry: 'Consumer Electronics', website: 'https://www.rayconglobal.com', logo_initials: 'R' },
  { company_name: 'Pingo', industry: 'Smart Home', website: 'https://www.pingo.io', logo_initials: 'P' },
  { company_name: 'Detris', industry: 'Fitness Tech', website: 'https://detris.com', logo_initials: 'D' },
  { company_name: 'Lingika', industry: 'Language Learning', website: 'https://lingika.com', logo_initials: 'L' },
  { company_name: 'Airalo', industry: 'Travel Tech', website: 'https://www.airalo.com', logo_initials: 'A' },
  { company_name: 'Pipo AI', industry: 'AI Productivity', website: 'https://pipo.ai', logo_initials: 'P' },
  { company_name: 'Clawbite', industry: 'Creator Tools', website: 'https://clawbite.com', logo_initials: 'C' },
  { company_name: 'Nomad Health', industry: 'Health & Wellness', website: 'https://nomadhealth.co', logo_initials: 'N' },
  { company_name: 'Stackra', industry: 'SaaS Tools', website: 'https://stackra.io', logo_initials: 'S' },
  { company_name: 'Wyze', industry: 'Smart Home', website: 'https://www.wyze.com', logo_initials: 'W' },
  { company_name: 'Twelve South', industry: 'Tech Accessories', website: 'https://twelvesouth.com', logo_initials: 'T' },
]

function daysAgo(n: number) {
  return new Date(Date.now() - 1000 * 60 * 60 * 24 * n).toISOString()
}

export const DEMO_JOBS: DemoJob[] = [
  {
    id: 'demo-raycon-earbuds-1',
    title: 'Raycon Everyday Earbuds — 3 Video Testimonials',
    description:
      'We need authentic testimonial videos from everyday people sharing how Raycon earbuds fit into their daily commute, gym session, or work-from-home routine.',
    platforms: ['TikTok', 'Instagram Reels'],
    deliverables: ['Testimonial', 'Sponsored post'],
    budget_range: '£200–400',
    timeline: 'Within 1 week',
    status: 'open',
    created_at: daysAgo(0),
    requirements: [
      'Comfortable on camera, natural speaking style',
      'Ability to show product in a real-world context',
      'UK or US based preferred',
    ],
    brand: demoBrands[1],
  },
  {
    id: 'demo-pingo-smart-2',
    title: 'Pingo Smart Home Hub — Unboxing + Setup Tour',
    description:
      'Create a clean unboxing and first-setup video for Pingo\'s smart home hub. Show it being unboxed, set up in under 3 minutes, and connected to one device.',
    platforms: ['YouTube', 'TikTok'],
    deliverables: ['Unboxing', 'Tutorial/how-to'],
    budget_range: '£300–600',
    timeline: 'Within 2 weeks',
    status: 'open',
    created_at: daysAgo(1),
    requirements: [
      'Clean video production (good lighting, clear audio)',
      'A home or workspace to demonstrate in',
      'Comfortable doing a voiceover + screen/wiring shots',
    ],
    brand: demoBrands[2],
  },
  {
    id: 'demo-detris-fitness-3',
    title: 'Detris Fitness Tracker — 5-Day Challenge Series',
    description:
      'Film yourself using Detris over 5 days as part of a fitness challenge. Show the tracker tracking steps, heart rate, and sleep. Give honest mini-reviews each day.',
    platforms: ['TikTok', 'Instagram Reels'],
    deliverables: ['Day-in-the-life', 'Sponsored post'],
    budget_range: '£500–1,000',
    timeline: 'Within 2 weeks',
    status: 'open',
    created_at: daysAgo(1),
    requirements: [
      'Must have or be willing to use Detris tracker for 5 days',
      'A fitness/gym context to shoot in',
      'Consistent posting over 5 consecutive days',
    ],
    brand: demoBrands[3],
  },
  {
    id: 'demo-lingika-app-4',
    title: 'Lingika Language App — "Day 1 With Lingika" UGC',
    description:
      'Record your authentic first experience using Lingika. Show the onboarding, your first lesson, and your honest reaction. We want real, not polished.',
    platforms: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
    deliverables: ['Day-in-the-life', 'Tutorial/how-to'],
    budget_range: '£150–300',
    timeline: 'Flexible',
    status: 'open',
    created_at: daysAgo(2),
    requirements: [
      'Someone learning a language or interested in language learning',
      'Mobile-first vertical footage',
      'Honest reaction — no script needed',
    ],
    brand: demoBrands[4],
  },
  {
    id: 'demo-airalo-travel-5',
    title: 'Airalo eSIM — "I used Airalo instead of roaming" Reel',
    description:
      'Share your honest experience using Airalo eSIM on a recent trip. Show how easy it was to set up vs. traditional roaming. Focus on convenience and cost savings.',
    platforms: ['TikTok', 'Instagram Reels'],
    deliverables: ['Sponsored post', 'Demo/review'],
    budget_range: '£200–500',
    timeline: 'Within 2 weeks',
    status: 'open',
    created_at: daysAgo(2),
    requirements: [
      'Recent or upcoming international trip (within next 30 days)',
      'Can show phone settings / setup process',
      'Audience interested in travel or digital nomad lifestyle',
    ],
    brand: demoBrands[5],
  },
  {
    id: 'demo-pipo-ai-6',
    title: 'Pipo AI — "My most productive day using Pipo" Video',
    description:
      'Document a full workday using Pipo AI to manage tasks, notes, and team communication. Show the tool in action and your honest productivity win.',
    platforms: ['TikTok', 'YouTube Shorts'],
    deliverables: ['Tutorial/how-to', 'Sponsored post'],
    budget_range: '£400–700',
    timeline: 'Within 1 week',
    status: 'open',
    created_at: daysAgo(3),
    requirements: [
      'Productivity-focused content style',
      'Screen recording + camera overlay setup',
      'Can show before/after productivity outcome',
    ],
    brand: demoBrands[6],
  },
  {
    id: 'demo-clawbite-7',
    title: 'Clawbite — "How I grow my audience with Clawbite"',
    description:
      'Create a UGC piece about how you (as a creator) use Clawbite to manage content pipelines, brand deals, or audience growth. Must feel like personal insight, not a pitch.',
    platforms: ['TikTok', 'LinkedIn'],
    deliverables: ['Sponsored post', 'Tutorial/how-to'],
    budget_range: '£300–500',
    timeline: 'Within 1 week',
    status: 'open',
    created_at: daysAgo(3),
    requirements: [
      'Active creator with 1K+ following preferred',
      'Personal experience with the platform being discussed',
      'Authentic voice — no corporate tone',
    ],
    brand: demoBrands[7],
  },
  {
    id: 'demo-nomad-protein-8',
    title: 'Nomad Health Protein — Morning Routine UGC',
    description:
      'Film your morning routine featuring Nomad Health protein powder. Show mixing, drinking, and how it fits into your fitness or wellness routine.',
    platforms: ['TikTok', 'Instagram Reels'],
    deliverables: ['Day-in-the-life', 'Sponsored post'],
    budget_range: '£150–300',
    timeline: 'Within 1 week',
    status: 'open',
    created_at: daysAgo(4),
    requirements: [
      'Fitness or wellness audience/focus',
      'Can show product being consumed on camera',
      'No heavy editing — authentic feel',
    ],
    brand: demoBrands[8],
  },
  {
    id: 'demo-stackra-saas-9',
    title: 'Stackra — "Stackra replaced 3 tools I was paying for"',
    description:
      'Create an honest comparison UGC piece showing how Stackra consolidates your workflow. Show 3 tools you used before and how Stackra replaces them.',
    platforms: ['LinkedIn', 'TikTok'],
    deliverables: ['Comparison', 'Demo/review'],
    budget_range: '£400–600',
    timeline: 'Within 2 weeks',
    status: 'open',
    created_at: daysAgo(4),
    requirements: [
      'Comfortable on camera explaining a product/tool',
      'Some B2B or productivity content experience',
      'Screen recording capability',
    ],
    brand: demoBrands[9],
  },
  {
    id: 'demo-wyze-cam-10',
    title: 'Wyze Cam v4 — "I set up Wyze cam in 5 minutes"',
    description:
      'Film a real-time unboxing and setup of a Wyze camera at home. Show the app, the installation, and the first live view. Keep it fast and conversational.',
    platforms: ['TikTok', 'YouTube Shorts'],
    deliverables: ['Unboxing', 'Tutorial/how-to'],
    budget_range: '£200–400',
    timeline: 'Flexible',
    status: 'open',
    created_at: daysAgo(5),
    requirements: [
      'A home or apartment to install in',
      'Smartphone with good camera quality',
      'Comfortable doing a screen-share style demo',
    ],
    brand: demoBrands[10],
  },
  {
    id: 'demo-12south-11',
    title: 'Twelve South AirFly — "AirFly made my flight way better"',
    description:
      'Show a realistic use case for the Twelve South AirFly Pro on a flight — pair it with your phone/Nintendo Switch, watch something, and react naturally.',
    platforms: ['TikTok', 'Instagram Reels'],
    deliverables: ['Demo/review', 'Sponsored post'],
    budget_range: '£250–400',
    timeline: 'Within 1 week',
    status: 'open',
    created_at: daysAgo(5),
    requirements: [
      'Frequent traveller or someone who flies regularly',
      'Can film in a realistic travel context',
      'Tech-positive audience',
    ],
    brand: demoBrands[11],
  },
  {
    id: 'demo-raycon-work-12',
    title: 'Raycon Sound Isolation — "My WFH setup changed everything"',
    description:
      'Film your work-from-home desk setup with Raycon earbuds as the hero audio product. Show them in use, how they block distractions, and the sound quality.',
    platforms: ['TikTok', 'YouTube Shorts'],
    deliverables: ['Day-in-the-life', 'Sponsored post'],
    budget_range: '£200–350',
    timeline: 'Within 1 week',
    status: 'open',
    created_at: daysAgo(6),
    requirements: [
      'Work-from-home or remote work context',
      'Clean audio recording environment',
      'Desk setup to film in',
    ],
    brand: demoBrands[1],
  },
  {
    id: 'demo-pingo-night-13',
    title: 'Pingo Night Light — "I sleep better with Pingo" UGC',
    description:
      'Record a short honest piece about how a smart night light has improved your sleep. Show the product in a real bedroom context.',
    platforms: ['TikTok', 'Instagram Reels'],
    deliverables: ['Testimonial', 'Day-in-the-life'],
    budget_range: '£150–300',
    timeline: 'Flexible',
    status: 'open',
    created_at: daysAgo(6),
    requirements: [
      'Parent or light-sleep-user context preferred',
      'Bedroom to film in',
      'No script — just your honest experience',
    ],
    brand: demoBrands[2],
  },
  {
    id: 'demo-detris-weight-14',
    title: 'Detris Smart Scale — "I tracked my body for 30 days"',
    description:
      'Document your 30-day body composition tracking journey using the Detris Smart Scale. Show weigh-ins, app data, and honest results.',
    platforms: ['TikTok', 'Instagram Reels'],
    deliverables: ['Day-in-the-life', 'Testimonial'],
    budget_range: '£500–800',
    timeline: 'Within 1 month',
    status: 'open',
    created_at: daysAgo(7),
    requirements: [
      'Willing to commit to 30-day series (1 video per week)',
      'Honest tone — show real data, real results',
      'Health/wellness niche preferred',
    ],
    brand: demoBrands[3],
  },
  {
    id: 'demo-otto-launch-15',
    title: 'Otto UGC Launch Sprint — 4 TikTok Testimonials',
    description:
      'We\'re launching Otto UGC and need creators to produce short testimonial-style videos about how Otto helps creators land better paid brand work. Natural tone, no overproduced edits.',
    platforms: ['TikTok', 'Instagram Reels'],
    deliverables: ['Demo/review', 'Sponsored post'],
    budget_range: '£250–500',
    timeline: 'Within 1 week',
    status: 'open',
    created_at: daysAgo(0),
    requirements: [
      'Creator focused on tech tools or creator economy',
      'Comfortable speaking on camera',
      'Can deliver vertical 9:16 footage + raw files',
    ],
    brand: demoBrands[0],
  },
  {
    id: 'demo-otto-howto-16',
    title: 'Otto How-To Series — 3 Tutorial Shorts',
    description:
      'Create a mini tutorial series showing creators how to use Otto to organize briefs, send applications, and track deal flow. Clean, practical, no fluff.',
    platforms: ['YouTube Shorts', 'TikTok'],
    deliverables: ['Tutorial/how-to'],
    budget_range: '£500–1,000',
    timeline: 'Within 2 weeks',
    status: 'open',
    created_at: daysAgo(1),
    requirements: [
      'Experience making product education content',
      'Comfortable screen recording + voiceover',
      'Strong hooks in first 2 seconds',
    ],
    brand: demoBrands[0],
  },
  {
    id: 'demo-airalo-esim-17',
    title: 'Airalo Partner Series — "Best eSIM for Japan"',
    description:
      'Create a destination-focused UGC piece on why Airalo is the best eSIM option for travelling in Japan. Show the app, data speeds, and coverage in a real travel context.',
    platforms: ['TikTok', 'YouTube Shorts', 'Instagram Reels'],
    deliverables: ['Sponsored post', 'Demo/review', 'Tutorial/how-to'],
    budget_range: '£400–700',
    timeline: 'Within 2 weeks',
    status: 'open',
    created_at: daysAgo(2),
    requirements: [
      'Travel content creator with Japan travel content',
      'Or planning a trip to Japan within 60 days',
      'Audience in UK/US interested in travel tips',
    ],
    brand: demoBrands[5],
  },
  {
    id: 'demo-pipo-reminder-18',
    title: 'Pipo AI — "Pipo replaced my PA" Productivity Reel',
    description:
      'Show a real workday where Pipo AI handles your scheduling, reminders, and inbox so you can focus on actual work. Make it relatable and show the AI in action.',
    platforms: ['TikTok', 'LinkedIn'],
    deliverables: ['Demo/review', 'Tutorial/how-to'],
    budget_range: '£350–600',
    timeline: 'Within 1 week',
    status: 'open',
    created_at: daysAgo(3),
    requirements: [
      'Productivity or business audience',
      'Screen recording + camera overlay',
      'Can show measurable time saved',
    ],
    brand: demoBrands[6],
  },
  {
    id: 'demo-clawbite-deal-19',
    title: 'Clawbite — "I landed a £2K brand deal via Clawbite"',
    description:
      'Document your journey from discovering Clawbite, to applying for a brief, to landing and completing a brand deal. Show real figures, real messages, real pay.',
    platforms: ['TikTok', 'Instagram Reels'],
    deliverables: ['Testimonial', 'Tutorial/how-to'],
    budget_range: '£500–800',
    timeline: 'Within 1 month',
    status: 'open',
    created_at: daysAgo(4),
    requirements: [
      'Creator who has completed at least one paid brand deal',
      'Comfortable sharing deal value publicly',
      'Can screen-record deal messages/confirmation',
    ],
    brand: demoBrands[7],
  },
  {
    id: 'demo-nomad-supps-20',
    title: 'Nomad Health Creatine — "I tried creatine for 30 days"',
    description:
      'Document a 30-day creatine supplementation journey with honest check-ins every 10 days. Show the product, the routine, and real results — good or bad.',
    platforms: ['TikTok', 'YouTube Shorts'],
    deliverables: ['Day-in-the-life', 'Testimonial'],
    budget_range: '£400–700',
    timeline: 'Within 1 month',
    status: 'open',
    created_at: daysAgo(5),
    requirements: [
      'Fitness or health audience',
      'Willing to show real results at day 10, 20, 30',
      'Comfortable discussing supplements on camera',
    ],
    brand: demoBrands[8],
  },
  {
    id: 'demo-stackra-pro-21',
    title: 'Stackra Pro — "I automated my entire client workflow"',
    description:
      'Show how Stackra Pro automates your freelance or agency client workflow — from onboarding to invoicing. Show the automation running live.',
    platforms: ['LinkedIn', 'TikTok'],
    deliverables: ['Demo/review', 'Tutorial/how-to'],
    budget_range: '£500–1,000',
    timeline: 'Within 2 weeks',
    status: 'open',
    created_at: daysAgo(6),
    requirements: [
      'Freelancer or agency owner using multiple tools',
      'Screen recording of automation workflows',
      'B2B or creator economy audience',
    ],
    brand: demoBrands[9],
  },
]

export function getDemoJobById(id: string) {
  return DEMO_JOBS.find((job) => job.id === id) || null
}