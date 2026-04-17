-- Ed campaign goals + profile links + expanded platforms
-- Run after 20260417_ed_agency_dashboard.sql

create extension if not exists "pgcrypto";

alter table if exists public.campaigns
  add column if not exists tiktok_url text,
  add column if not exists instagram_url text,
  add column if not exists youtube_url text,
  add column if not exists facebook_url text;

create table if not exists public.campaign_goals (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  platform text not null,
  target_per_month integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_goals_platform_valid check (platform in ('All', 'TikTok', 'Instagram/Reels', 'YouTube', 'Facebook')),
  constraint campaign_goals_target_nonnegative check (target_per_month >= 0),
  constraint campaign_goals_campaign_platform_unique unique (campaign_id, platform)
);

create index if not exists idx_campaign_goals_campaign_id on public.campaign_goals(campaign_id);
create index if not exists idx_campaign_goals_platform on public.campaign_goals(platform);

-- Expand valid post platforms for existing campaign_posts table.
alter table if exists public.campaign_posts
  drop constraint if exists campaign_posts_platform_check;

alter table if exists public.campaign_posts
  add constraint campaign_posts_platform_check
  check (platform in ('TikTok', 'Instagram/Reels', 'YouTube', 'Facebook'));

-- Normalize existing values for compatibility.
update public.campaign_posts
set platform = 'Instagram/Reels'
where lower(platform) in ('instagram', 'reels', 'instagram/reels');

-- Optional bootstrap: add an "All" goal for campaigns missing goals.
insert into public.campaign_goals (campaign_id, platform, target_per_month)
select c.id, 'All', 0
from public.campaigns c
where not exists (
  select 1
  from public.campaign_goals g
  where g.campaign_id = c.id
);
