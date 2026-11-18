-- AI 灵感解析：结果缓存字段
alter table public.inspirations
  add column if not exists ai_insight jsonb,
  add column if not exists ai_status text default 'pending',
  add column if not exists ai_source_hash text,
  add column if not exists ai_model text,
  add column if not exists ai_generated_at timestamptz;

-- 状态约束
alter table public.inspirations
  drop constraint if exists inspirations_ai_status_check;
alter table public.inspirations
  add constraint inspirations_ai_status_check
  check (ai_status in ('pending', 'generated', 'insufficient', 'failed'));

-- 输入指纹索引：内容变更后用于判断是否需要重新生成
create index if not exists inspirations_ai_source_hash_idx
  on public.inspirations (ai_source_hash);

-- 实时生成的限流日志，仅 service role 可读写
create table if not exists public.ai_request_log (
  id bigserial primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_request_log_ip_time_idx
  on public.ai_request_log (ip_hash, created_at desc);

alter table public.ai_request_log enable row level security;

-- 不创建 policy：anon / authenticated 都无法访问，仅 service role 绕过 RLS
