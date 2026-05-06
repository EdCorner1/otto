-- Migration: create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
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

CREATE POLICY "Public can submit inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Creators can view their inquiries"
  ON inquiries FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM creators WHERE id = creator_id));

CREATE POLICY "Creators can update their inquiries"
  ON inquiries FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM creators WHERE id = creator_id));

-- Add booking_url to creators table if not exists
ALTER TABLE creators ADD COLUMN IF NOT EXISTS booking_url text;
