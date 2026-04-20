/**
 * scripts/send-newsletter.ts
 * Sends a human-voiced platform update email to waitlist members (creators + brands separately).
 * Uses GitHub commit log for changelog. Queries waitlist via Maton→Supabase REST API.
 *
 * Usage:
 *   npx tsx scripts/send-newsletter.ts
 *   npx tsx scripts/send-newsletter.ts --dry-run
 *   npx tsx scripts/send-newsletter.ts --segment creators
 *   npx tsx scripts/send-newsletter.ts --changelog "• Built portfolio category tabs"
 */

const DRY_RUN = process.argv.includes('--dry-run')
const FORCE_CHANGELOG = (() => {
  const idx = process.argv.indexOf('--changelog')
  return idx >= 0 ? process.argv[idx + 1] : null
})()
const SEGMENT_ARG = (() => {
  const idx = process.argv.indexOf('--segment')
  return idx >= 0 ? process.argv[idx + 1] : null
})()

// ── Config ──────────────────────────────────────────────────────────
const GATEWAY_TOKEN = process.env.MATON_API_KEY // Maton key, not the short gateway token
const GATEWAY_BASE = 'https://gateway.maton.ai'
const CREATORS_AUDIENCE_ID = process.env.RESEND_OTTO_CREATORS_AUDIENCE_ID!
const BRANDS_AUDIENCE_ID = process.env.RESEND_OTTO_BRANDS_AUDIENCE_ID!

// ── HTTP helper ────────────────────────────────────────────────────
async function gateway<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${GATEWAY_BASE}${path}`, {
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

// ── GitHub recent commits ──────────────────────────────────────────
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
    sha: string; commit: { message: string; author: { name: string } }; html_url: string
  }>
  return commits.map(c => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split('\n')[0].trim(),
    author: c.commit.author.name,
    url: c.html_url,
  }))
}

// ── Format changelog ──────────────────────────────────────────────
function formatChangelog(commits: { message: string; sha: string; url: string }[]) {
  return commits
    .map(c => `• <a href="${c.url}" style="color:#363535;text-decoration:none;">${c.message}</a> <span style="color:#8a8a86;font-size:12px;">(${c.sha})</span>`)
    .join('<br>')
}

// ── Build email HTML ────────────────────────────────────────────────
function buildEmailHtml({ segment, changelog, sentDate }: {
  segment: string; changelog: string; sentDate: string
}) {
  const greeting = segment === 'creators' ? 'Hey creator,' : 'Hey there,'
  const intro = segment === 'creators'
    ? 'Saw something cool on Reddit the other day, so we went and built it. Here\'s what shipped.'
    : 'Quick update from the Otto shop — here\'s what\'s been added for brands.'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Otto — Platform Update</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f2;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f2;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="background:#1c1c1e;padding:32px 40px;border-radius:12px 12px 0 0;">
              <p style="margin:0;font-family:system-ui,sans-serif;font-size:22px;font-weight:700;color:#ccff00;letter-spacing:-0.5px;">Otto</p>
              <p style="margin:8px 0 0;font-family:system-ui,sans-serif;font-size:13px;color:#8a8a86;">Platform Update · ${sentDate}</p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;border-radius:0 0 12px 12px;">
              <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:17px;line-height:1.7;color:#363535;">${greeting}</p>
              <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:17px;line-height:1.7;color:#363535;">${intro}</p>
              <div style="background:#f5f5f2;border-left:4px solid #ccff00;padding:20px 24px;margin:0 0 28px;border-radius:0 8px 8px 0;">
                <p style="margin:0;font-family:system-ui,sans-serif;font-size:14px;line-height:2;color:#363535;">${changelog}</p>
              </div>
              <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:17px;line-height:1.7;color:#363535;">We'll keep building. See you in the next one.</p>
              <p style="margin:0;font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#363535;">— Otto<br><span style="font-size:13px;color:#8a8a86;">ottougc.com</span></p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;text-align:center;">
              <p style="margin:0;font-family:system-ui,sans-serif;font-size:12px;color:#8a8a86;">You're getting this because you joined the Otto waitlist.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Send email via Maton → Resend ────────────────────────────────
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  return gateway(`/resend/emails`, {
    method: 'POST',
    body: JSON.stringify({
      from: 'Otto <noreply@ottougc.com>',
      to: [to],
      subject,
      html,
    }),
  })
}

// ── Waitlist emails via Maton → Supabase REST ─────────────────────
async function getWaitlistEmails(role: 'creator' | 'brand') {
  const params = new URLSearchParams({
    select: 'email',
    role: `eq.${role}`,

    limit: '500',
  })
  const data = await gateway<Array<{ email: string }>>(`/supabase/rest/v1/waitlist?${params}`)
  return (data ?? []).map(r => r.email)
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  const since = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)

  let changelog = FORCE_CHANGELOG
  if (!changelog) {
    console.log(`Fetching commits since ${since.toLocaleDateString('en-GB')}...`)
    const commits = await getRecentCommits(since)
    if (commits.length > 0) {
      changelog = formatChangelog(commits)
      console.log(`${commits.length} commits found`)
    } else {
      console.log('No commits in last 5 days. Use --changelog to override.')
      process.exit(0)
    }
  } else {
    console.log('Using forced changelog:', changelog)
  }

  const sentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const segments: Array<'creators' | 'brands'> =
    SEGMENT_ARG === 'creators' || SEGMENT_ARG === 'brands'
      ? [SEGMENT_ARG as 'creators' | 'brands']
      : ['creators', 'brands']

  for (const seg of segments) {
    const role = seg === 'creators' ? 'creator' : 'brand'
    console.log(`${seg}: fetching waitlist...`)
    const emails = await getWaitlistEmails(role)
    if (emails.length === 0) {
      console.log(`${seg}: no active subscribers, skipping`)
      continue
    }
    console.log(`${seg}: ${emails.length} subscriber(s)`)

    if (DRY_RUN) {
      console.log(`[DRY RUN] Would send to: ${emails.slice(0, 3).join(', ')}${emails.length > 3 ? ` (+${emails.length - 3} more)` : ''}`)
      continue
    }

    const html = buildEmailHtml({ segment: seg, changelog, sentDate })
    const subject = `Otto update — ${sentDate}`
    let sent = 0, failed = 0

    for (const email of emails) {
      try {
        await sendEmail({ to: email, subject, html })
        sent++
        if (sent % 10 === 0) console.log(`  ${sent}/${emails.length} sent`)
      } catch (err) {
        console.error(`Failed to ${email}:`, err instanceof Error ? err.message : err)
        failed++
      }
    }

    console.log(`${seg}: ${sent} sent, ${failed} failed`)
  }

  console.log('Done.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
