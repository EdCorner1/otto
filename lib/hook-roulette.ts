export type HookRouletteItem = {
  id: string
  hookText: string
  type: string
  sourceUrl: string
  suggestedScriptAngle: string
  ctaBeat: string
  platform?: string
  niche?: string
  styleKeywords?: string[]
}

export const FALLBACK_HOOK_ROULETTE_ITEMS: HookRouletteItem[] = [
  {
    id: 'myth-breaker',
    hookText: 'Everyone says you need 100K followers. You don’t.',
    type: 'myth-breaker',
    sourceUrl: 'https://ottougc.com/resources/hooks',
    suggestedScriptAngle: 'Break down one paid deal you closed with a small audience and show the DM flow + deliverable that won the yes.',
    ctaBeat: 'Invite creators to comment “DM script” if they want your exact outreach template.',
    styleKeywords: ['no-bs', 'proof'],
  },
  {
    id: 'before-after-workflow',
    hookText: 'My videos looked average until I changed this one 7-second sequence.',
    type: 'before-after',
    sourceUrl: 'https://ottougc.com/resources/hooks',
    suggestedScriptAngle: 'Show a side-by-side of old vs new opening, then explain the hook → proof → payoff structure that lifted watch time.',
    ctaBeat: 'End with: “Want my 7-second framework? I put it in my notes.”',
    styleKeywords: ['educational', 'framework'],
  },
  {
    id: 'tool-proof',
    hookText: 'I tested this AI tool for 7 days so you don’t waste your budget.',
    type: 'experiment',
    sourceUrl: 'https://ottougc.com/resources/hooks',
    suggestedScriptAngle: 'Narrate day-by-day results, include what failed, and frame who this tool is actually for.',
    ctaBeat: 'Ask viewers to vote: “Should I test another tool or publish the full workflow next?”',
    styleKeywords: ['data', 'review'],
  },
  {
    id: 'client-perspective',
    hookText: 'If I were a brand hiring UGC today, this is the first thing I’d check.',
    type: 'client-perspective',
    sourceUrl: 'https://ottougc.com/resources/hooks',
    suggestedScriptAngle: 'Walk through your creator profile as if you were the brand, pointing out what builds trust in the first 10 seconds.',
    ctaBeat: 'Offer a quick profile teardown in comments for 3 creators.',
    styleKeywords: ['authority', 'teardown'],
  },
  {
    id: 'mistake-led',
    hookText: 'This one sentence in my pitch cost me three deals.',
    type: 'mistake-led',
    sourceUrl: 'https://ottougc.com/resources/hooks',
    suggestedScriptAngle: 'Reveal the sentence, why it triggered brand hesitation, and the replacement line that improved response rate.',
    ctaBeat: 'Prompt: “Reply ‘pitch’ and I’ll share my updated opener.”',
    styleKeywords: ['story', 'lessons'],
  },
  {
    id: 'speed-run',
    hookText: 'Give me 20 minutes and I’ll plan a week of creator content from scratch.',
    type: 'speed-run',
    sourceUrl: 'https://ottougc.com/resources/hooks',
    suggestedScriptAngle: 'Live speed-run your planning board: hook bank, proof moments, CTA variations, and repurposing plan.',
    ctaBeat: 'Point to your planning checklist and tell viewers to steal it.',
    styleKeywords: ['systems', 'tutorial'],
  },
  {
    id: 'hot-take',
    hookText: 'Hot take: polished UGC is usually less persuasive than this.',
    type: 'hot-take',
    sourceUrl: 'https://ottougc.com/resources/hooks',
    suggestedScriptAngle: 'Demonstrate raw vs polished footage and explain when “too produced” reduces trust for conversion-first ads.',
    ctaBeat: 'Ask viewers whether they want a “raw-first shot list.”',
    styleKeywords: ['opinion', 'conversion'],
  },
]
