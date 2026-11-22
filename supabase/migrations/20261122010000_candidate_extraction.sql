-- 评论 → 灵感：结构化抽取字段
-- 复用已有 DEEPSEEK_API_KEY（Supabase Edge Function Secrets）

alter table candidates
  add column if not exists product_name text,
  add column if not exists ai_summary text,
  add column if not exists ai_category text,
  add column if not exists ai_evidence text,
  add column if not exists publish_ready boolean default false,
  add column if not exists reject_reason text,
  add column if not exists raw_payload jsonb;

comment on column candidates.product_name is 'AI 抽取的完整产品名';
comment on column candidates.ai_summary is 'AI 抽取的一句话摘要，可为空';
comment on column candidates.ai_category is 'AI 分类：工具/网站/App/小程序/插件/游戏/设计/内容';
comment on column candidates.ai_evidence is '支撑产品名的原文句子，复核用';
comment on column candidates.publish_ready is '是否达到发布标准';
comment on column candidates.reject_reason is '拒绝原因：no_name/vague_name/ad/spam/duplicate';
comment on column candidates.raw_payload is '原始评论 JSON，便于换标准重跑';

create index if not exists idx_candidates_publish_ready on candidates (publish_ready) where publish_ready = true;
