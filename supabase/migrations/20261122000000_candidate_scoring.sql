-- 候选池 AI 评分字段
-- 复用已有 DEEPSEEK_API_KEY（Supabase Edge Function Secrets）

alter table candidates
  add column if not exists score int,
  add column if not exists ai_reason text,
  add column if not exists ai_tags text[] default '{}',
  add column if not exists ai_risk text,
  add column if not exists scored_at timestamptz,
  add column if not exists source_kind text,
  add column if not exists source_folder text;

comment on column candidates.score is 'AI 综合评分 0-100';
comment on column candidates.ai_reason is 'AI 一句话理由';
comment on column candidates.ai_tags is 'AI 提炼标签';
comment on column candidates.ai_risk is 'none / copyright / low_content / off_topic';
comment on column candidates.source_folder is '书签文件夹路径';
comment on column candidates.source_kind is 'bookmark / crawl / manual';

create index if not exists idx_candidates_score on candidates (score desc nulls last);
create index if not exists idx_candidates_scored_at on candidates (scored_at desc nulls last);
