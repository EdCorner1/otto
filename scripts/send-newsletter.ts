/**
 * scripts/send-newsletter.ts
 * Sends the prepared newsletter editions from memory/newsletter-pending.md
 * to both creator and brand waitlist segments.
 *
 * Usage:
 *   npx tsx scripts/send-newsletter.ts
 *   npx tsx scripts/send-newsletter.ts --dry-run
 *   npx tsx scripts/send-newsletter.ts --segment creators
 */

import * as fs from 'fs'
import * as path from 'path'

const DRY_RUN = process.argv.includes('--dry-run')
const SEGMENT_ARG = (() => {
  const idx = process.argv.indexOf('--segment')
  return idx >= 0 ? process.argv[idx + 1] : null
})()

const GATEWAY_TOKEN = process.env.MATON_API_KEY!
const SUPABASE_GATEWAY = 'https://gateway.maton.ai/supabase/rest/v1'
const RESEND_GATEWAY = 'https://gateway.maton.ai/resend'

async function gateway<T = unknown>(base: string, urlPath: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${base}${urlPath}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`Gateway ${urlPath} → ${res.status}: ${await res.text()}`)
  return res.json()
}

async function supabase<T = unknown>(urlPath: string, options: RequestInit = {}) {
  return gateway<T>(SUPABASE_GATEWAY, urlPath, options)
}

async function resend<T = unknown>(urlPath: string, options: RequestInit = {}) {
  return gateway<T>(RESEND_GATEWAY, urlPath, options)
}

function buildEmailHtml({ title, body, footerNote, sentDate }: {
  title: string
  body: string
  footerNote: string
  sentDate: string
}) {
  // Convert markdown-style bold headers to HTML
  // Bricolage Grotesque for headlines (via Google Fonts import), Georgia for body
  const htmlBody = body
    .replace(/\*\*(.*?)\*\*/g, '<p style="margin:28px 0 10px;font-family:\'Bricolage Grotesque\',\'Bricolage Grotesque\',system-ui,sans-serif;font-size:18px;font-weight:700;color:#1c1c1e;letter-spacing:-0.5px;line-height:1.2;">$1</p>')
    .replace(/\n\n/g, '</p><p style="margin:0 0 18px;font-family:Georgia,\'Georgia\',serif;font-size:16px;line-height:1.75;color:#363535;">')
    .replace(/\n/g, '<br>')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f5f5f2;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f2;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#1c1c1e;padding:28px 40px;border-radius:12px 12px 0 0;">
              <p style="margin:0;font-family:\'Bricolage Grotesque\',\'Bricolage Grotesque\',system-ui,sans-serif;font-size:22px;font-weight:700;color:#ccff00;letter-spacing:-0.5px;">Otto</p>
              <p style="margin:6px 0 0;font-family:system-ui,sans-serif;font-size:12px;color:#8a8a86;">${sentDate}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px 32px;border-radius:0 0 12px 12px;">
              <p style="margin:0;font-family:Georgia,serif;font-size:16px;line-height:1.75;color:#363535;">${htmlBody}</p>
            </td>
          </tr>
          <!-- Unsubscribe -->
          <tr>
            <td style="padding:20px 40px;text-align:center;background:#fafaf9;border-radius:0 0 12px 12px;">
              <p style="margin:0 0 6px;font-family:system-ui,sans-serif;font-size:12px;color:#8a8a86;">${footerNote}</p>
              <p style="margin:0;font-family:system-ui,sans-serif;font-size:12px;color:#8a8a86;">
                <a href="{{{unsubscribeUrl}}}" style="color:#8a8a86;text-decoration:underline;">Unsubscribe</a> if this is no longer relevant.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  return resend('/emails', {
    method: 'POST',
    body: JSON.stringify({
      from: 'Otto <hello@ottougc.com>',
      to: [to],
      subject,
      html,
      text: html.replace(/<[^>]+>/g, ''), // plain text version
    }),
  })
}

interface WaitlistRow { email: string; role: string }
async function getWaitlistEmails(role: string) {
  const data = await supabase<WaitlistRow[]>(`/waitlist?select=email,role&role=eq.${role}&limit=500`)
  return (data ?? []).map(r => r.email)
}

async function main() {
  const pendingPath = path.join('/home/node/.openclaw/workspace/memory/newsletter-pending.md')
  const raw = fs.readFileSync(pendingPath, 'utf8')

  // Extract creator and brand editions from markdown
  const creatorMatch = raw.match(/## Creator Edition\s*\n([\s\S]*?)(?=\n---\s*\n## Brand Edition)/)
  const brandMatch = raw.match(/## Brand Edition\s*\n([\s\S]*?)(?=\n---\s*\n## Recipients)/)

  if (!creatorMatch || !brandMatch) {
    console.error('Could not parse creator/brand editions from newsletter-pending.md')
    process.exit(1)
  }

  const creatorBody = creatorMatch[1].trim()
  const brandBody = brandMatch[1].trim()
  const sentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const creatorHtml = buildEmailHtml({
    title: 'Thanks for joining Otto',
    body: creatorBody,
    footerNote: 'You are receiving this because you joined the Otto creator waitlist.',
    sentDate,
  })

  const brandHtml = buildEmailHtml({
    title: 'Thanks for joining Otto',
    body: brandBody,
    footerNote: 'You are receiving this because you joined the Otto brand waitlist.',
    sentDate,
  })

  const segments = SEGMENT_ARG
    ? [{ key: SEGMENT_ARG, html: SEGMENT_ARG === 'creators' ? creatorHtml : brandHtml, role: SEGMENT_ARG === 'creators' ? 'creator' : 'brand' }]
    : [
        { key: 'creators', html: creatorHtml, role: 'creator' },
        { key: 'brands', html: brandHtml, role: 'brand' },
      ]

  const subject = `Thanks for joining Otto — ${sentDate}`

  for (const seg of segments) {
    const emails = await getWaitlistEmails(seg.role)
    if (emails.length === 0) {
      console.log(`${seg.key}: no subscribers, skipping`)
      continue
    }

    console.log(`${seg.key}: sending to ${emails.length} email(s)...`)

    if (DRY_RUN) {
      console.log(`[DRY RUN] Would send to: ${emails.slice(0, 3).join(', ')}${emails.length > 3 ? ` (+${emails.length - 3} more)` : ''}`)
      continue
    }

    let sent = 0, failed = 0
    for (const email of emails) {
      try {
        await sendEmail({ to: email, subject, html: seg.html })
        sent++
        if (sent % 10 === 0) console.log(`  ${sent}/${emails.length} sent`)
      } catch (err) {
        failed++
        console.error(`Failed to ${email}:`, err instanceof Error ? err.message : err)
      }
    }

    console.log(`${seg.key}: ${sent} sent, ${failed} failed`)
  }

  console.log('Done.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
