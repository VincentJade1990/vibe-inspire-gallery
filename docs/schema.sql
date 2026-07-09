-- ============================================================
-- Vibe Bubble Supabase Schema
-- ============================================================
-- Run this in Supabase SQL Editor → New query
-- ============================================================

-- ============================================================
-- 1. Extensions
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- 2. Enums (as text check constraints for simplicity)
-- ============================================================

-- candidates.review_status
-- new / shortlisted / ignored / duplicate / converted

-- inspirations.status
-- draft / published / archived

-- inspirations.project_type
-- web_app / mobile_app / chrome_extension / bot / ai_tool / design / content / game / other

-- inspirations.difficulty
-- beginner / intermediate / advanced

-- comments.status
-- pending / published / hidden

-- submissions.status
-- pending / approved / rejected

-- ============================================================
-- 3. Sources (来源管理)
-- ============================================================
create table sources (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  icon text,
  url_pattern text,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

comment on table sources is '平台来源管理';

-- 插入默认来源
insert into sources (name, slug, icon, url_pattern, sort_order) values
  ('小红书', 'xiaohongshu', 'xiaohongshu', 'xiaohongshu.com', 1),
  ('抖音', 'douyin', 'douyin', 'douyin.com', 2),
  ('B站', 'bilibili', 'bilibili', 'bilibili.com', 3),
  ('GitHub', 'github', 'github', 'github.com', 4),
  ('X / Twitter', 'twitter', 'twitter', 'twitter.com', 5),
  ('即刻', 'jike', 'jike', 'okjike.com', 6),
  ('Product Hunt', 'producthunt', 'producthunt', 'producthunt.com', 7),
  ('Hacker News', 'hackernews', 'hackernews', 'news.ycombinator.com', 8),
  ('Reddit', 'reddit', 'reddit', 'reddit.com', 9),
  ('其他', 'other', 'other', null, 99);

-- ============================================================
-- 4. Tags (标签表)
-- ============================================================
create table tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  color text default '#a855f7',
  description text,
  usage_count integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

comment on table tags is '灵感标签';

-- ============================================================
-- 5. Candidates (灵感候选池)
-- ============================================================
create table candidates (
  id uuid primary key default uuid_generate_v4(),
  title text,
  source_url text not null,
  source_platform text references sources(slug),
  author_name text,
  author_url text,
  raw_text text,
  raw_images text[],
  cover_image_url text,
  discovered_by uuid references auth.users(id),
  discovered_at timestamptz default now(),
  review_status text not null default 'new' check (review_status in ('new', 'shortlisted', 'ignored', 'duplicate', 'converted')),
  editor_note text,
  converted_inspiration_id uuid,
  meta_title text,
  meta_description text,
  meta_og_image text,
  parsed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table candidates is '灵感候选池';

-- 索引
create index idx_candidates_status on candidates(review_status);
create index idx_candidates_platform on candidates(source_platform);
create index idx_candidates_discovered_at on candidates(discovered_at desc);

-- ============================================================
-- 6. Inspirations (正式灵感库)
-- ============================================================
create table inspirations (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  short_title text,
  slug text not null unique,
  summary text,
  description text,
  source_url text,
  source_platform text references sources(slug),
  author_name text,
  author_url text,
  cover_image_url text,
  gallery_images text[],
  project_type text default 'other' check (project_type in ('web_app', 'mobile_app', 'chrome_extension', 'bot', 'ai_tool', 'design', 'content', 'game', 'other')),
  difficulty text default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  estimated_time text,
  target_users text[],
  tools text[],
  tags text[],
  why_recommend text,
  highlights text[],
  remix_ideas text[],
  replication_steps text[],
  prompt_templates jsonb,
  publish_tips text[],
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured boolean default false,
  allow_random boolean default true,
  view_count integer default 0,
  source_click_count integer default 0,
  like_count integer default 0,
  favorite_count integer default 0,
  comment_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table inspirations is '正式灵感库';

-- 索引
create index idx_inspirations_status on inspirations(status);
create index idx_inspirations_platform on inspirations(source_platform);
create index idx_inspirations_featured on inspirations(is_featured) where status = 'published';
create index idx_inspirations_random on inspirations(allow_random) where status = 'published';
create index idx_inspirations_tags on inspirations using gin(tags);
create index idx_inspirations_type on inspirations(project_type);
create index idx_inspirations_difficulty on inspirations(difficulty);

-- ============================================================
-- 7. Profiles (用户资料扩展)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  avatar_url text,
  bio text,
  website text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table profiles is '用户资料扩展';

-- ============================================================
-- 8. Favorites (收藏)
-- ============================================================
create table favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inspiration_id uuid not null references inspirations(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, inspiration_id)
);

comment on table favorites is '用户收藏';

create index idx_favorites_user on favorites(user_id);
create index idx_favorites_inspiration on favorites(inspiration_id);

-- ============================================================
-- 9. Likes (点赞)
-- ============================================================
create table likes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inspiration_id uuid not null references inspirations(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, inspiration_id)
);

comment on table likes is '用户点赞';

create index idx_likes_user on likes(user_id);
create index idx_likes_inspiration on likes(inspiration_id);

-- ============================================================
-- 10. Comments (评论)
-- ============================================================
create table comments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inspiration_id uuid not null references inspirations(id) on delete cascade,
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table comments is '评论';

create index idx_comments_inspiration on comments(inspiration_id);
create index idx_comments_user on comments(user_id);
create index idx_comments_status on comments(status);

-- ============================================================
-- 11. Submissions (用户投稿)
-- ============================================================
create table submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  source_url text,
  source_platform text references sources(slug),
  author_name text,
  cover_image_url text,
  project_type text default 'other',
  tags text[],
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  converted_inspiration_id uuid references inspirations(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table submissions is '用户投稿';

create index idx_submissions_status on submissions(status);
create index idx_submissions_user on submissions(user_id);

-- ============================================================
-- 12. Triggers: 自动更新计数
-- ============================================================

-- likes 插入/删除时更新 inspirations.like_count
 create or replace function update_inspiration_like_count()
 returns trigger as $$
 begin
   if (tg_op = 'INSERT') then
     update inspirations set like_count = like_count + 1 where id = new.inspiration_id;
     return new;
   elsif (tg_op = 'DELETE') then
     update inspirations set like_count = like_count - 1 where id = old.inspiration_id;
     return old;
   end if;
   return null;
 end;
 $$ language plpgsql;

 create trigger trg_likes_count
 after insert or delete on likes
 for each row execute function update_inspiration_like_count();

-- favorites 插入/删除时更新 inspirations.favorite_count
 create or replace function update_inspiration_favorite_count()
 returns trigger as $$
 begin
   if (tg_op = 'INSERT') then
     update inspirations set favorite_count = favorite_count + 1 where id = new.inspiration_id;
     return new;
   elsif (tg_op = 'DELETE') then
     update inspirations set favorite_count = favorite_count - 1 where id = old.inspiration_id;
     return old;
   end if;
   return null;
 end;
 $$ language plpgsql;

 create trigger trg_favorites_count
 after insert or delete on favorites
 for each row execute function update_inspiration_favorite_count();

-- comments 状态变为 published 时更新 comment_count
 create or replace function update_inspiration_comment_count()
 returns trigger as $$
 begin
   if (tg_op = 'INSERT' and new.status = 'published') then
     update inspirations set comment_count = comment_count + 1 where id = new.inspiration_id;
     return new;
   elsif (tg_op = 'DELETE' and old.status = 'published') then
     update inspirations set comment_count = comment_count - 1 where id = old.inspiration_id;
     return old;
   elsif (tg_op = 'UPDATE' and old.status != 'published' and new.status = 'published') then
     update inspirations set comment_count = comment_count + 1 where id = new.inspiration_id;
     return new;
   elsif (tg_op = 'UPDATE' and old.status = 'published' and new.status != 'published') then
     update inspirations set comment_count = comment_count - 1 where id = new.inspiration_id;
     return new;
   end if;
   return null;
 end;
 $$ language plpgsql;

 create trigger trg_comments_count
 after insert or delete or update on comments
 for each row execute function update_inspiration_comment_count();

-- ============================================================
-- 13. Triggers: 自动更新 updated_at
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_candidates_updated_at before update on candidates
  for each row execute function update_updated_at_column();
create trigger trg_inspirations_updated_at before update on inspirations
  for each row execute function update_updated_at_column();
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function update_updated_at_column();
create trigger trg_comments_updated_at before update on comments
  for each row execute function update_updated_at_column();
create trigger trg_submissions_updated_at before update on submissions
  for each row execute function update_updated_at_column();

-- ============================================================
-- 14. RLS (Row Level Security)
-- ============================================================

-- 启用 RLS
alter table sources enable row level security;
alter table tags enable row level security;
alter table candidates enable row level security;
alter table inspirations enable row level security;
alter table profiles enable row level security;
alter table favorites enable row level security;
alter table likes enable row level security;
alter table comments enable row level security;
alter table submissions enable row level security;

-- 辅助函数：判断当前用户是否是 admin
 create or replace function is_admin()
 returns boolean as $$
 begin
   return exists (
     select 1 from profiles
     where id = auth.uid() and role = 'admin'
   );
 end;
 $$ language plpgsql security definer;

-- sources: 所有人可读，仅 admin 可写
 create policy "sources_select_all" on sources for select using (true);
 create policy "sources_insert_admin" on sources for insert with check (is_admin());
 create policy "sources_update_admin" on sources for update using (is_admin());
 create policy "sources_delete_admin" on sources for delete using (is_admin());

-- tags: 所有人可读，仅 admin 可写
 create policy "tags_select_all" on tags for select using (true);
 create policy "tags_insert_admin" on tags for insert with check (is_admin());
 create policy "tags_update_admin" on tags for update using (is_admin());
 create policy "tags_delete_admin" on tags for delete using (is_admin());

-- candidates: 仅 admin 可读写
 create policy "candidates_select_admin" on candidates for select using (is_admin());
 create policy "candidates_insert_admin" on candidates for insert with check (is_admin());
 create policy "candidates_update_admin" on candidates for update using (is_admin());
 create policy "candidates_delete_admin" on candidates for delete using (is_admin());

-- inspirations:
-- published 所有人可读；draft/archived 仅 admin 可读写
 create policy "inspirations_select_published" on inspirations for select
   using (status = 'published' or is_admin());
 create policy "inspirations_insert_admin" on inspirations for insert with check (is_admin());
 create policy "inspirations_update_admin" on inspirations for update using (is_admin());
 create policy "inspirations_delete_admin" on inspirations for delete using (is_admin());

-- profiles: 用户只能读写自己的 profile，admin 可以读所有
 create policy "profiles_select_own_or_admin" on profiles for select
   using (id = auth.uid() or is_admin());
 create policy "profiles_insert_own" on profiles for insert with check (id = auth.uid());
 create policy "profiles_update_own" on profiles for update using (id = auth.uid());

-- favorites: 用户只能管理自己的收藏
 create policy "favorites_select_own" on favorites for select using (user_id = auth.uid());
 create policy "favorites_insert_own" on favorites for insert with check (user_id = auth.uid());
 create policy "favorites_delete_own" on favorites for delete using (user_id = auth.uid());

-- likes: 用户只能管理自己的点赞
 create policy "likes_select_own" on likes for select using (user_id = auth.uid());
 create policy "likes_insert_own" on likes for insert with check (user_id = auth.uid());
 create policy "likes_delete_own" on likes for delete using (user_id = auth.uid());

-- comments:
-- published 所有人可读；pending 仅作者和 admin 可见
 create policy "comments_select_published_or_own_or_admin" on comments for select
   using (
     status = 'published'
     or user_id = auth.uid()
     or is_admin()
   );
 create policy "comments_insert_own" on comments for insert with check (user_id = auth.uid());
 create policy "comments_update_admin" on comments for update using (is_admin());
 create policy "comments_delete_admin" on comments for delete using (is_admin());

-- submissions:
-- 用户可查看自己的投稿；admin 可查看所有
 create policy "submissions_select_own_or_admin" on submissions for select
   using (user_id = auth.uid() or is_admin());
 create policy "submissions_insert_own" on submissions for insert with check (user_id = auth.uid());
 create policy "submissions_update_admin" on submissions for update using (is_admin());
 create policy "submissions_delete_admin" on submissions for delete using (is_admin());

-- ============================================================
-- 15. Auth Hook: 用户注册时自动创建 profile
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, nickname, role)
  values (new.id, new.raw_user_meta_data->>'name', 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- 16. 给第一个注册用户设置 admin 角色
-- ============================================================
-- 手动执行：update profiles set role = 'admin' where id = '你的用户id';
