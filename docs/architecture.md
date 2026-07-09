# Vibe Bubble 后端架构设计

## 1. 技术栈

| 层级 | 技术 |
|---|---|
| 前端框架 | Next.js 14 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| UI 组件 | shadcn/ui |
| 数据库 | Supabase PostgreSQL |
| 认证 | Supabase Auth |
| 存储 | Supabase Storage |
| 后端 API | Next.js Server Actions + Supabase Client |

## 2. 项目目录结构

```
vibe-bubble/
├── app/
│   ├── (public)/                 # 前台路由组
│   │   ├── page.tsx              # 首页 (原 landing.html)
│   │   ├── gallery/
│   │   │   └── page.tsx          # 灵感列表
│   │   ├── inspiration/
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # 灵感详情
│   │   ├── random/
│   │   │   └── page.tsx          # 随机灵感
│   │   ├── about/
│   │   │   └── page.tsx          # 项目介绍
│   │   └── layout.tsx            # 前台布局
│   │
│   ├── (admin)/                  # 后台路由组
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   │   └── page.tsx      # 管理员登录
│   │   │   ├── page.tsx          # 后台首页 Dashboard
│   │   │   ├── candidates/
│   │   │   │   ├── page.tsx      # 候选池列表
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # 候选详情/编辑
│   │   │   ├── inspirations/
│   │   │   │   ├── page.tsx      # 灵感库列表
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx  # 新增灵感
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # 编辑灵感
│   │   │   ├── tags/
│   │   │   │   └── page.tsx      # 标签管理
│   │   │   ├── sources/
│   │   │   │   └── page.tsx      # 来源管理
│   │   │   ├── submissions/
│   │   │   │   └── page.tsx      # 投稿审核
│   │   │   ├── comments/
│   │   │   │   └── page.tsx      # 评论审核
│   │   │   ├── users/
│   │   │   │   └── page.tsx      # 用户管理
│   │   │   └── layout.tsx        # 后台布局 (侧边栏)
│   │
│   ├── api/                      # API 路由 (仅必要时使用)
│   │   └── parse-url/
│   │       └── route.ts          # URL 解析 API
│   │
│   ├── layout.tsx                # 根布局
│   └── globals.css               # 全局样式
│
├── components/
│   ├── ui/                       # shadcn/ui 组件
│   ├── admin/                    # 后台专用组件
│   │   ├── sidebar.tsx
│   │   ├── data-table.tsx
│   │   ├── candidate-card.tsx
│   │   ├── inspiration-form.tsx
│   │   └── stat-card.tsx
│   ├── gallery/                  # 前台画廊组件
│   │   ├── bubble-canvas.tsx
│   │   ├── inspiration-card.tsx
│   │   └── filter-bar.tsx
│   └── common/                   # 通用组件
│       ├── navbar.tsx
│       ├── footer.tsx
│       └── auth-button.tsx
│
├── lib/
│   ├── supabase/                 # Supabase 客户端
│   │   ├── client.ts             # 浏览器端 client
│   │   ├── server.ts             # Server Actions 用 client
│   │   └── admin.ts              # service_role client
│   ├── utils/
│   │   ├── url-parser.ts         # URL 解析工具
│   │   ├── slugify.ts            # slug 生成
│   │   └── cn.ts                 # className 合并
│   └── constants.ts              # 常量
│
├── hooks/
│   ├── use-auth.ts               # 认证状态
│   ├── use-inspirations.ts       # 灵感数据
│   ├── use-favorite.ts           # 收藏操作
│   ├── use-like.ts               # 点赞操作
│   └── use-comments.ts           # 评论数据
│
├── types/
│   └── database.ts               # 数据库类型定义
│
├── actions/                      # Server Actions
│   ├── candidates.ts
│   ├── inspirations.ts
│   ├── comments.ts
│   ├── favorites.ts
│   ├── likes.ts
│   ├── submissions.ts
│   └── auth.ts
│
├── public/
│   └── (静态资源)
│
├── middleware.ts                 # Next.js 中间件 (路由守卫)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 3. API / Server Actions 设计

### 3.1 Candidates (候选池)

```typescript
// actions/candidates.ts
'use server'

// 列表查询
async function listCandidates(filters: {
  platform?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Candidate[]; count: number }>

// 创建候选
async function createCandidate(data: CreateCandidateInput): Promise<Candidate>

// 解析 URL 元数据
async function parseUrlMetadata(url: string): Promise<{
  title?: string;
  description?: string;
  ogImage?: string;
  canonicalUrl?: string;
  domain?: string;
}>

// 更新状态
async function updateCandidateStatus(
  id: string,
  status: 'shortlisted' | 'ignored' | 'duplicate'
): Promise<void>

// 转换为正式灵感
async function convertToInspiration(
  candidateId: string
): Promise<string> // 返回新 inspiration id

// 删除
async function deleteCandidate(id: string): Promise<void>
```

### 3.2 Inspirations (灵感库)

```typescript
// actions/inspirations.ts
'use server'

// 前台列表
async function listInspirations(filters: {
  platform?: string;
  type?: string;
  difficulty?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Inspiration[]; count: number }>

// 前台详情
async function getInspirationBySlug(slug: string): Promise<Inspiration | null>

// 随机灵感
async function getRandomInspiration(): Promise<Inspiration | null>

// 后台列表 (admin)
async function listInspirationsAdmin(filters: {...}): Promise<...>

// 创建
async function createInspiration(data: CreateInspirationInput): Promise<Inspiration>

// 更新
async function updateInspiration(id: string, data: UpdateInspirationInput): Promise<Inspiration>

// 删除
async function deleteInspiration(id: string): Promise<void>

// 更新浏览量
async function incrementViewCount(id: string): Promise<void>

// 更新来源点击量
async function incrementSourceClick(id: string): Promise<void>
```

### 3.3 Auth (认证)

```typescript
// actions/auth.ts
'use server'

// 邮箱注册
async function signUpWithEmail(email: string, password: string): Promise<...>

// 邮箱登录
async function signInWithEmail(email: string, password: string): Promise<...>

// 微信 OAuth (后续扩展)
async function signInWithWechat(): Promise<...>

// 登出
async function signOut(): Promise<void>

// 获取当前用户
async function getCurrentUser(): Promise<User | null>

// 更新 profile
async function updateProfile(data: { nickname?: string; avatar_url?: string; bio?: string }): Promise<void>
```

### 3.4 Favorites (收藏)

```typescript
// actions/favorites.ts
'use server'

// 切换收藏 (收藏/取消)
async function toggleFavorite(inspirationId: string): Promise<boolean>

// 查询是否已收藏
async function isFavorited(inspirationId: string): Promise<boolean>

// 获取用户收藏列表
async function listUserFavorites(): Promise<Inspiration[]>
```

### 3.5 Likes (点赞)

```typescript
// actions/likes.ts
'use server'

// 切换点赞
async function toggleLike(inspirationId: string): Promise<boolean>

// 查询是否已点赞
async function isLiked(inspirationId: string): Promise<boolean>
```

### 3.6 Comments (评论)

```typescript
// actions/comments.ts
'use server'

// 前台获取已发布评论
async function listPublishedComments(inspirationId: string): Promise<Comment[]>

// 发表评论
async function createComment(inspirationId: string, content: string): Promise<Comment>

// 后台获取待审核评论
async function listPendingComments(): Promise<Comment[]>

// 审核通过
async function approveComment(id: string): Promise<void>

// 隐藏评论
async function hideComment(id: string): Promise<void>
```

### 3.7 Submissions (投稿)

```typescript
// actions/submissions.ts
'use server'

// 用户投稿
async function createSubmission(data: CreateSubmissionInput): Promise<Submission>

// 后台获取投稿列表
async function listSubmissions(filters: { status?: string }): Promise<Submission[]>

// 审核通过
async function approveSubmission(id: string): Promise<void>

// 拒绝
async function rejectSubmission(id: string, note: string): Promise<void>
```

## 4. 数据流设计

### 4.1 灵感收集流程

```
外部平台 (小红书/抖音/GitHub...)
    ↓
[管理员发现] → candidates 表 (review_status: new)
    ↓
[URL 解析] → 自动填充 title/og:image/meta
    ↓
[人工筛选] → shortlisted / ignored / duplicate
    ↓
[编辑创作] → 一键转为 inspiration (status: draft)
    ↓
[内容完善] → 填写详情、标签、推荐理由
    ↓
[发布] → status: published → 前台展示
```

### 4.2 用户互动流程

```
用户浏览 /gallery
    ↓
点击灵感 → /inspiration/[slug]
    ↓
查看详情 (RLS: published 可读)
    ↓
[可选] 点赞/收藏 (需登录)
    ↓
    ├─ toggleLike → likes 表 → trigger 更新 like_count
    └─ toggleFavorite → favorites 表 → trigger 更新 favorite_count
    ↓
[可选] 发表评论 (需登录)
    ↓
    └─ createComment → status: pending → 后台审核
    ↓
[可选] 访问来源链接 → source_click_count + 1
```

## 5. RLS 策略总结

| 表 | 读取 | 写入 | 说明 |
|---|---|---|---|
| sources | 所有人 | admin | 平台来源配置 |
| tags | 所有人 | admin | 标签管理 |
| candidates | admin | admin | 候选池，仅后台 |
| inspirations | published 所有人; draft/archived admin | admin | 前台只展示 published |
| profiles | 自己或 admin | 自己 | 用户资料 |
| favorites | 自己 | 自己 | 收藏 |
| likes | 自己 | 自己 | 点赞 |
| comments | published 所有人; pending 自己或 admin | 自己 | 发表后 pending |
| submissions | 自己或 admin | 自己 | 用户投稿 |

## 6. 任务拆分 (按 P0/P1/P2)

### P0 - 核心闭环

| # | 任务 | 文件 | 预估 |
|---|---|---|---|
| 1 | 初始化 Next.js 项目 + shadcn/ui | `package.json` | 10 min |
| 2 | 配置 Supabase 客户端 | `lib/supabase/*.ts` | 15 min |
| 3 | 执行 SQL migration | Supabase SQL Editor | 5 min |
| 4 | 迁移现有静态页面到 Next.js | `app/(public)/*` | 2h |
| 5 | 管理员登录页 | `app/(admin)/admin/login` | 30 min |
| 6 | 后台布局 (侧边栏) | `app/(admin)/admin/layout` | 30 min |
| 7 | Candidates CRUD | `actions/candidates.ts` + `app/(admin)/admin/candidates/*` | 2h |
| 8 | URL 解析 API | `app/api/parse-url/route.ts` | 1h |
| 9 | Inspirations CRUD (后台) | `actions/inspirations.ts` + `app/(admin)/admin/inspirations/*` | 2h |
| 10 | 前台读取 Supabase 数据 | `app/(public)/gallery/*` | 1.5h |
| 11 | 候选转正式灵感 | `actions/candidates.ts::convertToInspiration` | 30 min |

### P1 - 用户互动

| # | 任务 | 文件 | 预估 |
|---|---|---|---|
| 12 | 用户注册/登录 | `actions/auth.ts` + UI | 1h |
| 13 | 收藏功能 | `actions/favorites.ts` + hooks | 45 min |
| 14 | 点赞功能 | `actions/likes.ts` + hooks | 30 min |
| 15 | 评论功能 | `actions/comments.ts` + UI | 1h |
| 16 | 评论审核后台 | `app/(admin)/admin/comments/*` | 30 min |
| 17 | 用户个人中心 | `app/(public)/profile/*` | 1h |

### P2 - 扩展

| # | 任务 | 文件 | 预估 |
|---|---|---|---|
| 18 | 投稿功能 | `actions/submissions.ts` + UI | 1h |
| 19 | 投稿审核后台 | `app/(admin)/admin/submissions/*` | 30 min |
| 20 | GitHub/PH/HN 自动采集 | Edge Function / Cron | 2h |
| 21 | AI 分析扩展 | Edge Function + OpenAI | 2h |
| 22 | 微信小程序 | 独立小程序项目 | 3-5h |

## 7. 开发顺序建议

**第一周 (P0)**：跑通核心闭环
1. Day 1: 项目初始化 + Supabase 配置 + SQL migration
2. Day 2: 迁移静态页面到 Next.js
3. Day 3: 后台布局 + Candidates 候选池
4. Day 4: URL 解析 + 候选转灵感
5. Day 5: Inspirations CRUD + 前台读取

**第二周 (P1)**：用户系统
1. Day 1-2: Auth + Profile
2. Day 3: 点赞 + 收藏
3. Day 4: 评论 + 审核
4. Day 5: 个人中心 +  polish

**第三周 (P2)**：扩展 + 小程序
1. 投稿系统
2. 自动采集 (可选)
3. 小程序开发 (可选)
