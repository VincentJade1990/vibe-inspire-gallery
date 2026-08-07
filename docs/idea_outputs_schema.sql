-- ============================================================
-- VibeBubble V2.1 — idea_outputs 表（阶段核心产出）
-- 在 Supabase SQL Editor 中执行（项目: ndktjtrjczajihvntdqa）
-- ============================================================

-- 1. 建表
create table if not exists idea_outputs (
  id            uuid primary key default uuid_generate_v4(),
  idea_id       uuid not null references ideas(id) on delete cascade,
  stage         text not null,
  content       text,
  template_type text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(idea_id, stage)
);

comment on table idea_outputs is '灵感阶段核心产出';

-- 2. 索引
create index if not exists idx_idea_outputs_idea on idea_outputs(idea_id);
create index if not exists idx_idea_outputs_stage on idea_outputs(stage);

-- 3. RLS
alter table idea_outputs enable row level security;

drop policy if exists "idea_outputs_select_own" on idea_outputs;
create policy "idea_outputs_select_own" on idea_outputs
  for select using (
    exists (select 1 from ideas where ideas.id = idea_outputs.idea_id and ideas.user_id = auth.uid())
  );

drop policy if exists "idea_outputs_insert_own" on idea_outputs;
create policy "idea_outputs_insert_own" on idea_outputs
  for insert with check (
    exists (select 1 from ideas where ideas.id = idea_outputs.idea_id and ideas.user_id = auth.uid())
  );

drop policy if exists "idea_outputs_update_own" on idea_outputs;
create policy "idea_outputs_update_own" on idea_outputs
  for update using (
    exists (select 1 from ideas where ideas.id = idea_outputs.idea_id and ideas.user_id = auth.uid())
  );

drop policy if exists "idea_outputs_delete_own" on idea_outputs;
create policy "idea_outputs_delete_own" on idea_outputs
  for delete using (
    exists (select 1 from ideas where ideas.id = idea_outputs.idea_id and ideas.user_id = auth.uid())
  );

-- 4. 触发器：自动更新 updated_at
drop trigger if exists trg_idea_outputs_updated_at on idea_outputs;
create trigger trg_idea_outputs_updated_at
  before update on idea_outputs
  for each row execute function update_updated_at_column();

-- 5. 刷新 schema cache
notify pgrst, 'reload schema';
