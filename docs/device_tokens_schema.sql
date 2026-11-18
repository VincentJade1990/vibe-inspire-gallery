-- ============================================================
-- VibeBubble — AI Passport 设备配对与令牌
-- 在 Supabase SQL Editor 中执行（与 ideas / idea_outputs 同库）
-- 说明：期望 6 位配对码 → 设备令牌；服务端只存哈希，不存明文
-- ============================================================

-- 1. 配对码（Web 端生成，设备输入）
create table if not exists device_pair_codes (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  code_hash   text not null,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz default now()
);

comment on table device_pair_codes is 'AI Passport 配对码（仅服务端读写）';

create index if not exists idx_device_pair_codes_hash on device_pair_codes(code_hash);
create index if not exists idx_device_pair_codes_user on device_pair_codes(user_id);

-- 2. 设备令牌
create table if not exists device_tokens (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  device_id     text not null,
  device_name   text,
  token_hash    text not null unique,
  paired_at     timestamptz default now(),
  expires_at    timestamptz not null,
  revoked_at    timestamptz,
  last_seen_at  timestamptz,
  created_at    timestamptz default now()
);

comment on table device_tokens is 'AI Passport 设备令牌（只存 hash，可解绑）';

create index if not exists idx_device_tokens_user on device_tokens(user_id);
create index if not exists idx_device_tokens_device on device_tokens(device_id);

-- 3. RLS：两张表都不允许匿名访问
--    device_pair_codes 不建任何策略，只有 service role 能读写
--    device_tokens 允许用户查看/解绑自己的设备，但插入只能由 service role 完成
alter table device_pair_codes enable row level security;

alter table device_tokens enable row level security;

drop policy if exists "device_tokens_select_own" on device_tokens;
create policy "device_tokens_select_own" on device_tokens
  for select using (user_id = auth.uid());

drop policy if exists "device_tokens_update_own" on device_tokens;
create policy "device_tokens_update_own" on device_tokens
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "device_tokens_delete_own" on device_tokens;
create policy "device_tokens_delete_own" on device_tokens
  for delete using (user_id = auth.uid());

-- 4. 刷新 schema cache
notify pgrst, 'reload schema';
