/**
 * scripts/prepare-newsletter.ts
 * Generates newsletter content from recent GitHub commits and saves to memory/
 * for review. Run this as a cron job — it does NOT send, just prepares.
 *
 * Usage:
 *   npx tsx scripts/prepare-newsletter.ts
 *   npx tsx scripts/prepare-newsletter.ts --changelog "• Custom changelog line"
 */

import * as fs from 'fs'
import * as path from 'path'

const FORCE_CHANGELOG = (() => {
  const idx = process.argv.indexOf('--changelog')
  return idx >= 0 ? process.argv[idx + 1] : null
})()

const SUPABASE_GATEWAY = 'https://gateway.maton.ai/supabase/rest/v1'
const RESEND_GATEWAY = 'https://gateway.maton.ai/resend'
const GATEWAY_TOKEN = process.env.MATON_API_KEY!

async function gateway<T = unknown>(base: string, path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`Gateway ${path} → ${res.status}: ${await res.text()}`)
  return res.json()
}

async function supabase<T = unknown>(path: string, options: RequestInit = {}) {
  return gateway<T>(SUPABASE_GATEWAY, path, options)
}

async function resend<T = unknown>(path: string, options: RequestInit = {}) {
  return gateway<T>(RESEND_GATEWAY, path, options)
}

async function getRecentCommits(since: Date) {
  const response = await fetch(
    `https://api.github.com/repos/EdCorner1/otto/commits?since=${since.toISOString()}&per_page=15`,
    {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Otto-Platform',
      },
    }
  )
  if (!response.ok) return []
  const commits = await response.json() as Array<{
    sha: string; commit: { message: string }; html_url: string
  }>
  return commits.map(c => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split('\n')[0].trim(),
    url: c.html_url,
  }))
}

interface WaitlistRow { role: string }
async function getWaitlistCounts() {
  const data = await supabase<WaitlistRow[]>(`/waitlist?select=role&limit=500`)
  const counts: Record<string, number> = {}
  for (const row of (data ?? [])) {
    counts[row.role] = (counts[row.role] ?? 0) + 1
  }
  return counts
}

async function main() {
  const since = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  const sentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  let changelog = FORCE_CHANGELOG
  if (!changelog) {
    const commits = await getRecentCommits(since)
    if (commits.length === 0) {
      console.log('No commits in last 5 days. Use --changelog to override.')
      process.exit(0)
    }
    changelog = commits
      .map(c => `• ${c.message} (${c.sha}) — ${c.url}`)
      .join('\n')
    console.log(`${commits.length} commits found`)
  } else {
    console.log('Using forced changelog')
  }

  const counts = await getWaitlistCounts()

  const content = {
    generated_at: new Date().toISOString(),
    sent_date: sentDate,
    changelog,
    waitlist_counts: counts,
    status: 'pending_approval',
  }

  const outDir = path.join('/home/node/.openclaw/workspace/memory')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const outPath = path.join(outDir, `newsletter-pending.md`)
  const body = `# Newsletter — Pending Approval
**Generated:** ${new Date().toLocaleString('en-GB')} (UK time)
**Sent date:** ${sentDate}
**Status:** ⏳ Awaiting your approval

---

**Changelog:**

${changelog}

---

**Recipients:**
- Creators: ${counts.creator ?? 0}
- Brands: ${counts.brand ?? 0}

---

**To send this edition, reply "send newsletter" and I'll dispatch it now.**

To edit the content, reply with your changes and I'll regenerate.
`

  fs.writeFileSync(outPath, body, 'utf8')
  console.log(`Saved to ${outPath}`)
  console.log(`Creators: ${counts.creator ?? 0} | Brands: ${counts.brand ?? 0}`)
  return content
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
