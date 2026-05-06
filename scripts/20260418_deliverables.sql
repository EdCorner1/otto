create extension if not exists "pgcrypto";

create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.deals(id) on delete cascade,
  creator_id uuid references public.creators(id),
  title text not null,
  drive_link text not null,
  notes text,
  status text default 'submitted' check (status in ('submitted', 'approved', 'revision_requested')),
  created_at timestamptz default now()
);

create index if not exists idx_deliverables_deal_id on public.deliverables(deal_id);
create index if not exists idx_deliverables_creator_id on public.deliverables(creator_id);
create index if not exists idx_deliverables_created_at on public.deliverables(created_at desc);

alter table public.deliverables enable row level security;

create policy if not exists "creators_can_select_own_deliverables"
on public.deliverables
for select
using (
  exists (
    select 1
    from public.creators c
    where c.user_id = auth.uid()
      and c.id = public.deliverables.creator_id
  )
);

create policy if not exists "creators_can_insert_own_deliverables"
on public.deliverables
for insert
with check (
  exists (
    select 1
    from public.creators c
    where c.user_id = auth.uid()
      and c.id = public.deliverables.creator_id
  )
);

create policy if not exists "brands_can_select_deliverables_for_their_deals"
on public.deliverables
for select
using (
  exists (
    select 1
    from public.deals d
    join public.brands b on b.id = d.brand_id
    where d.id = public.deliverables.deal_id
      and b.user_id = auth.uid()
  )
);

create policy if not exists "brands_can_update_deliverables_for_their_deals"
on public.deliverables
for update
using (
  exists (
    select 1
    from public.deals d
    join public.brands b on b.id = d.brand_id
    where d.id = public.deliverables.deal_id
      and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.deals d
    join public.brands b on b.id = d.brand_id
    where d.id = public.deliverables.deal_id
      and b.user_id = auth.uid()
  )
);
