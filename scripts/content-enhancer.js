#!/usr/bin/env node
/**
 * content-enhancer.js
 * Adds template elements (inline CTAs, related posts) to blog posts in Supabase.
 * Uses curl for API calls (fetch is blocked in this env).
 * Run: SB_SERVICE_ROLE=<key> node scripts/content-enhancer.js [--dry-run] [--slug=<slug>]
 */

const fs = require('fs')
const path = require('path')
const { execSync, spawn } = require('child_process')

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return

  const raw = fs.readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const idx = trimmed.indexOf('=')
    if (idx <= 0) continue

    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

loadLocalEnv()

const SB_KEY =
  process.env.SB_SERVICE_ROLE ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  ''
const DRY_RUN = process.argv.includes('--dry-run')
const TARGET_SLUG = process.argv.find(a => a.startsWith('--slug='))?.split('=')[1] || null
const SB_URL = 'https://vcoeayvzuranirnxavwn.supabase.co'

function sbFetch(endpoint, method = 'GET', body = null) {
  const url = `${SB_URL}/rest/v1/${endpoint}`
  let cmd = `curl -s -X ${method} "${url}" ` +
    `-H "apikey: ${SB_KEY}" ` +
    `-H "Authorization: Bearer ${SB_KEY}" ` +
    `-H "Content-Type: application/json" ` +
    `-H "Prefer: return=representation"`
  if (body) cmd += ` -d '${JSON.stringify(body).replace(/'/g, "'\\''")}'`
  const out = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
  if (!out.trim()) return null
  try { return JSON.parse(out) } catch { return out }
}

function log(msg) { process.stdout.write(`[enhancer] ${msg}\n`) }

async function getPublishedPosts() {
  let data = sbFetch('blog_posts?select=id,slug,title,excerpt,tags,status&status=eq.published&order=created_at')
  if (!Array.isArray(data)) {
    log(`Unexpected response: ${String(data).substring(0, 100)}`)
    return []
  }
  return data
}

async function getPostContent(id) {
  const data = sbFetch(`blog_posts?select=content,slug&id=eq.${id}`)
  if (Array.isArray(data) && data[0]) return data[0]
  return data
}

async function updatePostContent(id, content) {
  return sbFetch(`blog_posts?id=eq.${id}`, 'PATCH', { content })
}

function addInlineCTA(content) {
  // Insert inline CTA at ~60% through the content
  const lines = content.split('\n')
  const cta = '\n\n{{CTA: create your account →}}\n\n'
  const midPoint = Math.floor(lines.length * 0.6)
  let insertAt = lines.length - 2

  for (let i = midPoint; i < Math.min(midPoint + 30, lines.length); i++) {
    if (lines[i]?.startsWith('## ') && i > 2) {
      insertAt = i
      break
    }
  }

  const newLines = [...lines]
  newLines.splice(insertAt, 0, cta)
  return newLines.join('\n')
}

function addRelatedPosts(content, currentSlug, allPosts) {
  if (content.includes('<!-- RELATED:')) return content
  const current = allPosts.find(p => p.slug === currentSlug)
  if (!current) return content

  const related = allPosts
    .filter(p => p.slug !== currentSlug)
    .slice(0, 3)
    .map(p => `- ${p.slug} | ${(p.title || '').substring(0, 80)} | ${((p.excerpt) || '').substring(0, 60)}`)
    .join('\n')

  return content.trimEnd() + `\n\n<!-- RELATED:\n${related}\n-->`
}

async function main() {
  if (!SB_KEY) {
    log('ERROR: Supabase service key env var not set (checked SUPABASE_SERVICE_KEY, SUPABASE_SERVICE_ROLE_KEY, SB_SERVICE_ROLE)')
    process.exit(1)
  }

  log(`${DRY_RUN ? '[DRY RUN] ' : ''}Fetching published posts...`)
  const posts = await getPublishedPosts()
  log(`Found ${posts.length} published post(s)`)

  const targetPosts = TARGET_SLUG
    ? posts.filter(p => p.slug === TARGET_SLUG)
    : posts

  for (const post of targetPosts) {
    const full = await getPostContent(post.id)
    if (!full || !full.content) { log(`  [${post.slug}] No content, skipping`); continue }

    let content = full.content
    if (content.length < 150) { log(`  [${post.slug}] Too short, skipping`); continue }

    const originalLen = content.length

    // Only add inline CTA if not already present
    if (!content.includes('{{CTA:')) {
      content = addInlineCTA(content)
    }

    // Only add related posts if not already present
    if (!content.includes('<!-- RELATED:')) {
      content = addRelatedPosts(content, post.slug, posts)
    }

    const delta = content.length - originalLen
    log(`  [${post.slug}] ${originalLen}→${content.length} chars (${delta >= 0 ? '+' : ''}${delta})`)

    if (!DRY_RUN && delta > 0) {
      await updatePostContent(post.id, content)
      log(`    → Updated in Supabase`)
    }
  }

  log('Done.')
}

main().catch(e => { log(`ERROR: ${e.message}`); process.exit(1) })
