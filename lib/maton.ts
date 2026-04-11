// Maton gateway client — single credential for all third-party API calls
// Key: MATON_API_KEY from /home/node/.openclaw/.env
// Base: https://gateway.maton.ai

const MATON_KEY = process.env.OPENCLAW_GATEWAY_TOKEN!

async function matonFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`https://gateway.maton.ai${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${MATON_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Maton ${path} → ${res.status}: ${err}`)
  }
  return res.json()
}

// ── Resend (email) via Maton ──────────────────────────────────────
// Sends via Resend API key registered in Maton connections
export async function sendEmail({ to, subject, html, from }: {
  to: string; subject: string; html: string; from?: string
}) {
  return matonFetch('/resend/send', {
    method: 'POST',
    body: JSON.stringify({ to, subject, html, from }),
  })
}

// ── Vercel env vars ──────────────────────────────────────────────
export async function setVercelEnv(key: string, value: string, projectId = 'prj_918q78J24E76UzQR9rk39aPKDX44') {
  return matonFetch(`/vercel/v10/projects/${projectId}/env`, {
    method: 'POST',
    body: JSON.stringify({ key, value, target: 'production' }),
  })
}

// ── GitHub ───────────────────────────────────────────────────────
export async function createGitHubPR({ repo, title, body, branch, base = 'main' }: {
  repo: string; title: string; body: string; branch: string; base?: string
}) {
  return matonFetch('/github/repos', {
    method: 'POST',
    body: JSON.stringify({ repo, title, body, branch, base }),
  })
}
