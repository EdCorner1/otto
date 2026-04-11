// Maton gateway client — single credential for all third-party API calls
// Key: OPENCLAW_GATEWAY_TOKEN from /home/node/.openclaw/.env
// Base: https://gateway.maton.ai
// Note: path format is /resend/<native-resend-path> — Resend send is POST /resend/emails

const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN!

async function gateway<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`https://gateway.maton.ai${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(`Gateway ${path} → ${res.status}: ${err.message || JSON.stringify(err)}`)
  }
  return res.json()
}

// ── Resend (email) via Maton ──────────────────────────────────────
// Resend path: POST /resend/emails
// From address must be a verified domain (we use noreply@totallyremote.co)
export async function sendEmail({ to, subject, html, from }: {
  to: string; subject: string; html: string; from?: string
}) {
  return gateway(`/resend/emails`, {
    method: 'POST',
    body: JSON.stringify({
      from: from || 'Otto <noreply@totallyremote.co>',
      to,
      subject,
      html,
    }),
  })
}

// ── Vercel env vars ──────────────────────────────────────────────
export async function setVercelEnv(key: string, value: string, projectId = 'prj_918q78J24E76UzQR9rk39aPKDX44') {
  return gateway(`/vercel/v10/projects/${projectId}/env`, {
    method: 'POST',
    body: JSON.stringify({ key, value, target: 'production' }),
  })
}

// ── GitHub ───────────────────────────────────────────────────────
export async function createGitHubPR({ repo, title, body, branch, base = 'main' }: {
  repo: string; title: string; body: string; branch: string; base?: string
}) {
  return gateway('/github/repos', {
    method: 'POST',
    body: JSON.stringify({ repo, title, body, branch, base }),
  })
}

// ── Supabase Management API ──────────────────────────────────────
export const supabaseMgmt = (projectRef: string) => ({
  projectRef,
  headers: { Authorization: `Bearer ${GATEWAY_TOKEN}`, apikey: GATEWAY_TOKEN },
})
