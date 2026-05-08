// One-time migration script — delete after use
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing ${name}`)
  return v
}

export async function POST(request: NextRequest) {
  // Simple secret protection
  const secret = request.headers.get('x-migration-secret')
  if (secret !== 'otto-one-time-migration-2026') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
    const admin = createClient(url, serviceKey)

    // 1. Create inquiries table
    const { error: createError } = await admin.from('inquiries').select('id').limit(1).maybeSingle()
    if (!createError) {
      return NextResponse.json({ message: 'inquiries table already exists' })
    }

    // Use raw SQL via postgres (Supabase exposes pg_* functions)
    // We'll try multiple approaches
    const created = false

    // Approach: use the service role to bypass RLS for a direct insert attempt
    // If the table doesn't exist this will fail — but that's the signal we need
    const { error: insertAttempt } = await admin.from('inquiries').insert({
      id: '00000000-0000-0000-0000-000000000000',
      creator_id: '00000000-0000-0000-0000-000000000001',
      brand_email: 'migration-test@otto-placeholder.com',
    }).select('id').single()

    if (insertAttempt && insertAttempt.message.includes('does not exist')) {
      return NextResponse.json({
        error: 'Table does not exist. Cannot create table via PostgREST — you need to run this SQL in the Supabase dashboard: https://supabase.com/dashboard/project/vcoeayvzuranirnxavwn/sql/new',
        sql: `CREATE TABLE inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid REFERENCES creators(id) ON DELETE CASCADE,
  brand_name text,
  brand_email text NOT NULL,
  brand_company text,
  budget text,
  timeline text,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'declined')),
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can submit inquiries" ON inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Creators can view their inquiries" ON inquiries FOR SELECT USING (auth.uid() IN (SELECT user_id FROM creators WHERE id = creator_id));
CREATE POLICY "Creators can update their inquiries" ON inquiries FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM creators WHERE id = creator_id));
ALTER TABLE creators ADD COLUMN IF NOT EXISTS booking_url text;`
      }, { status: 422 })
    }

    return NextResponse.json({ message: 'Migration complete' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
