-- ============================================================
-- VibeBubble V2.1 — Ideas 表 + RLS + 触发器
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- 1. 建表
create table if not exists ideas (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  source_type text default 'original',
  source_inspiration_id uuid,
  tags        text[] default '{}',
  status      text not null default 'explore_ideas'
              check (status in (
                'explore_ideas',
                'discover_needs',
                'define_product',
                'design_product',
                'build_product',
                'launch_product',
                'grow_users',
                'archived'
              )),
  color       text default '#a855f7',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

comment on table ideas is '用户个人灵感记录';

-- 2. 索引
create index if not exists idx_ideas_user on ideas(user_id);
create index if not exists idx_ideas_status on ideas(status);
create index if not exists idx_ideas_created_at on ideas(created_at desc);
create index if not exists idx_ideas_tags on ideas using gin(tags);

-- 3. RLS
alter table ideas enable row level security;

drop policy if exists "ideas_select_own" on ideas;
create policy "ideas_select_own" on ideas
  for select using (user_id = auth.uid());

drop policy if exists "ideas_insert_own" on ideas;
create policy "ideas_insert_own" on ideas
  for insert with check (user_id = auth.uid());

drop policy if exists "ideas_update_own" on ideas;
create policy "ideas_update_own" on ideas
  for update using (user_id = auth.uid());

drop policy if exists "ideas_delete_own" on ideas;
create policy "ideas_delete_own" on ideas
  for delete using (user_id = auth.uid());

-- 4. 触发器：自动更新 updated_at
drop trigger if exists trg_ideas_updated_at on ideas;
create trigger trg_ideas_updated_at
  before update on ideas
  for each row execute function update_updated_at_column();
