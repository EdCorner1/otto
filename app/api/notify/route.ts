import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/maton'

export const runtime = 'nodejs'

const HEADLINE_STYLE = 'font-family:system-ui,sans-serif;font-weight:700;letter-spacing:-2px;line-height:1.0;color:#363535'
const BODY_STYLE = 'font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#363535'

function emailShell(content: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f0;font-family:system-ui,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e8e4">
    <div style="padding:28px 32px;border-bottom:1px solid #f0f0ec">
      <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:-2px;color:#363535">Otto<span style="display:inline-block;width:8px;height:8px;background:#ccff00;border-radius:50%;margin-left:3px;margin-bottom:2px;vertical-align:middle"></span></p>
    </div>
    <div style="padding:32px">${content}</div>
    <div style="padding:20px 32px;background:#fafaf9;border-top:1px solid #f0f0ec;text-align:center">
      <p style="margin:0;font-size:12px;color:#9a9a9a">© Otto — UGC Marketplace for Tech Brands & Creators</p>
    </div>
  </div></body></html>`
}

function ctaButton(text: string, href: string) {
  return `<div style="margin-top:24px"><a href="${href}" style="display:inline-block;padding:12px 28px;background:#ccff00;color:#1c1c1c;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none">${text} →</a></div>`
}

// POST /api/notify — internal-only body: { event: string, data: object }
export async function POST(req: NextRequest) {
  try {
    const internalSecret = process.env.OTTO_INTERNAL_NOTIFY_SECRET
    const providedSecret = req.headers.get('x-otto-internal-secret') || ''

    if (!internalSecret || providedSecret !== internalSecret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { event, data } = await req.json()
    const supabase = createClient()

    switch (event) {

      case 'new_proposal': {
        const { dealId, brandId, jobTitle, creatorName } = data
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ottougc.com'

        // Get brand user email via users table
        const { data: brandUser } = await supabase
          .from('users').select('email').eq('id', brandId).maybeSingle()
        const brandEmail = brandUser?.email

        if (brandEmail) {
          const html = emailShell(`
            <p style="margin:0 0 8px;font-size:13px;color:#6b6b6b">New Proposal</p>
            <h1 style="${HEADLINE_STYLE};font-size:28px;margin:0 0 16px">${creatorName} wants to work with you</h1>
            <p style="${BODY_STYLE};margin:0 0 8px"><strong>${jobTitle}</strong></p>
            <p style="${BODY_STYLE};color:#6b6b6b;font-size:14px">You have a new proposal waiting. Review it and accept or pass.</p>
            ${ctaButton('Review Proposal', `${appUrl}/deals/${dealId}`)}
          `)
          await sendEmail({ to: brandEmail, subject: `New proposal for "${jobTitle}"`, html })
        }
        break
      }

      case 'work_submitted': {
        const { dealId, brandId, jobTitle, creatorName } = data
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ottougc.com'

        const { data: brandUser } = await supabase
          .from('users').select('email').eq('id', brandId).maybeSingle()
        const brandEmail = brandUser?.email

        if (brandEmail) {
          const html = emailShell(`
            <p style="margin:0 0 8px;font-size:13px;color:#6b6b6b">Work Submitted</p>
            <h1 style="${HEADLINE_STYLE};font-size:28px;margin:0 0 16px">${creatorName} submitted their work</h1>
            <p style="${BODY_STYLE};margin:0 0 8px"><strong>${jobTitle}</strong></p>
            <p style="${BODY_STYLE};color:#6b6b6b;font-size:14px">Head over and review it — approve or request changes.</p>
            ${ctaButton('Review Work', `${appUrl}/deals/${dealId}/review`)}
          `)
          await sendEmail({ to: brandEmail, subject: `Work submitted for "${jobTitle}" — review now`, html })
        }
        break
      }

      case 'deal_approved': {
        const { dealId, creatorId, jobTitle, brandName } = data
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ottougc.com'

        const { data: creatorUser } = await supabase
          .from('users').select('email').eq('id', creatorId).maybeSingle()
        const creatorEmail = creatorUser?.email

        if (creatorEmail) {
          const html = emailShell(`
            <p style="margin:0 0 8px;font-size:13px;color:#6b6b6b">Deal Approved</p>
            <h1 style="${HEADLINE_STYLE};font-size:28px;margin:0 0 16px">${brandName} approved your work</h1>
            <p style="${BODY_STYLE};margin:0 0 8px"><strong>${jobTitle}</strong></p>
            <p style="${BODY_STYLE};color:#6b6b6b;font-size:14px">Great work. Payment will be released shortly.</p>
            ${ctaButton('View Deal', `${appUrl}/deals/${dealId}`)}
          `)
          await sendEmail({ to: creatorEmail, subject: `Your work on "${jobTitle}" was approved`, html })
        }
        break
      }

      case 'revision_requested': {
        const { dealId, creatorId, jobTitle, brandName, revisionNotes } = data
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ottougc.com'

        const { data: creatorUser } = await supabase
          .from('users').select('email').eq('id', creatorId).maybeSingle()
        const creatorEmail = creatorUser?.email

        if (creatorEmail) {
          const html = emailShell(`
            <p style="margin:0 0 8px;font-size:13px;color:#6b6b6b">Revision Requested</p>
            <h1 style="${HEADLINE_STYLE};font-size:28px;margin:0 0 16px">Changes requested on "${jobTitle}"</h1>
            <p style="${BODY_STYLE};margin:0 0 12px"><strong>From ${brandName}:</strong></p>
            <div style="background:#fafaf9;border-left:3px solid #ccff00;padding:12px 16px;border-radius:0 8px 8px 0">
              <p style="${BODY_STYLE};margin:0;font-size:14px">${revisionNotes}</p>
            </div>
            ${ctaButton('View & Respond', `${appUrl}/deals/${dealId}`)}
          `)
          await sendEmail({ to: creatorEmail, subject: `Revision requested on "${jobTitle}"`, html })
        }
        break
      }

      case 'new_message': {
        // Lightweight ping — recipientEmail passed directly from caller
        const { dealId, recipientEmail, senderName, preview, jobTitle } = data
        if (!recipientEmail) break
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ottougc.com'
        const html = emailShell(`
          <p style="margin:0 0 8px;font-size:13px;color:#6b6b6b">New Message</p>
          <h1 style="${HEADLINE_STYLE};font-size:28px;margin:0 0 16px">${senderName} sent you a message</h1>
          <p style="${BODY_STYLE};color:#6b6b6b;font-size:14px;margin:0 0 16px">"${preview.slice(0, 120)}${preview.length > 120 ? '…' : ''}"</p>
          ${ctaButton('View Message', `${appUrl}/deals/${dealId}`)}
        `)
        await sendEmail({ to: recipientEmail, subject: `New message from ${senderName} — ${jobTitle}`, html })
        break
      }

      default:
        return NextResponse.json({ error: 'Unknown event' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('/api/notify error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
