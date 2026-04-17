-- Ed Agency Command Center schema
-- Run in Supabase SQL editor (or migration runner)

create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand_color text not null default '#ccff00',
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date,
  status text not null check (status in ('active', 'paused', 'completed')),
  platforms text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_posts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  video_url text not null,
  platform text not null check (platform in ('TikTok', 'Instagram', 'YouTube')),
  views integer not null default 0,
  likes integer,
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_team (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid,
  name text not null,
  role text not null,
  added_at timestamptz not null default now()
);

create index if not exists idx_campaigns_client_id on public.campaigns(client_id);
create index if not exists idx_campaigns_status on public.campaigns(status);
create index if not exists idx_campaign_posts_campaign_id on public.campaign_posts(campaign_id);
create index if not exists idx_campaign_posts_posted_at on public.campaign_posts(posted_at);
create index if not exists idx_campaign_team_campaign_id on public.campaign_team(campaign_id);

-- Optional: seed defaults
insert into public.clients (name, brand_color)
values
  ('Detris', '#FF6B6B'),
  ('Clawbite', '#6366F1')
on conflict do nothing;
