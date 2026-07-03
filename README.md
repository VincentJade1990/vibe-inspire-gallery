# Vibe Coding 灵感库 (vibe-inspire-gallery)

VibeBubble 是一个搜集和展示 AI 创作、Vibe Coding 和个人项目灵感 的实验性网站。

## 技术栈

### 前端
- **Vite** - 构建工具
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 原子化 CSS
- **Framer Motion** - 动画库
- **React Router v6** - 路由管理
- **Zustand** - 状态管理
- **Axios** - HTTP 请求
- **Lucide React** - 图标库

### 后端
- **Node.js** - 运行时
- **Express** - Web 框架
- **TypeScript** - 类型安全
- **CORS** - 跨域支持

### 数据存储
- 本地 JSON 文件（无需数据库）
- LocalStorage（前端用户互动数据持久化）

## 项目结构

```
vibe-inspire-gallery/
├── package.json              # 根工作区配置
├── README.md                 # 项目说明
│
├── client/                   # 前端项目
│   ├── package.json
│   ├── vite.config.ts        # Vite 配置
│   ├── tsconfig.json         # TS 配置
│   ├── tailwind.config.js    # Tailwind 配置
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx          # 应用入口
│       ├── App.tsx           # 根组件/路由
│       ├── index.css         # 全局样式
│       ├── vite-env.d.ts
│       │
│       ├── views/            # 页面视图
│       │   ├── Home.tsx          # 首页（双模式）
│       │   ├── CaseDetail.tsx    # 案例详情页
│       │   ├── FilterPage.tsx    # 筛选页
│       │   └── NotFound.tsx      # 404页
│       │
│       ├── components/       # 公共组件
│       │   ├── Navbar.tsx          # 顶部导航栏
│       │   ├── ThemeToggle.tsx     # 主题切换
│       │   ├── SkeletonLoader.tsx  # 骨架屏
│       │   ├── CardStack.tsx       # 卡片滑动堆叠
│       │   ├── BubbleCanvas.tsx    # 气泡画布
│       │   ├── BubblePool.tsx      # 临时气泡池
│       │   ├── CaseCard.tsx        # 案例卡片
│       │   ├── StarRating.tsx      # 星级评分
│       │   ├── FilterPanel.tsx     # 筛选面板
│       │   └── EmptyState.tsx      # 空状态
│       │
│       ├── store/            # 状态管理
│       │   ├── useThemeStore.ts       # 主题状态
│       │   └── useInteractionStore.ts # 互动状态
│       │
│       ├── api/              # API 请求
│       │   ├── axios.ts      # Axios 封装
│       │   └── caseApi.ts    # 案例接口
│       │
│       ├── utils/            # 工具函数
│       │   ├── pagination.ts # 分页工具
│       │   └── filter.ts     # 筛选排序工具
│       │
│       ├── types/            # 类型定义
│       │   └── case.ts       # 案例相关类型
│       │
│       └── assets/           # 静态资源
│
└── server/                   # 后端项目
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── app.ts                # Express 入口
        ├── types/
        │   └── case.ts           # 案例类型定义
        ├── data/
        │   └── cases.json        # 案例数据文件
        ├── routes/
        │   └── cases.ts          # 案例路由
        ├── services/
        │   └── caseService.ts    # 案例服务层
        └── utils/
            ├── pagination.ts     # 分页工具
            └── filter.ts         # 筛选排序工具
```

## 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
# 安装根工作区依赖（含 concurrently）
npm install

# 安装前端依赖
cd client && npm install

# 安装后端依赖
cd server && npm install
```

### 启动开发服务器

**方式一：同时启动前后端（推荐）**
```bash
npm run dev
```

**方式二：分别启动**
```bash
# 终端 1：启动后端
npm run dev:server
# 或 cd server && npm run dev

# 终端 2：启动前端
npm run dev:client
# 或 cd client && npm run dev
```

### 访问应用

- 前端页面：`http://localhost:5173`
- 后端 API：`http://localhost:3001/api`
- 健康检查：`http://localhost:3001/api/health`

## 核心功能

### 双浏览模式
1. **卡片滑动模式** - Tinder 风格横向卡片堆叠
   - 右滑：点赞收藏
   - 左滑：减少同类推荐
   - 上滑：查看详情
   - 下滑：复制 Prompt

2. **气泡画布模式** - 无限画布气泡分布
   - 单击：弹出预览卡片
   - 长按拖拽：收纳至临时气泡池
   - 精品气泡：发光脉动效果
   - 画布：支持缩放平移

### 用户互动（无需登录）
- 案例点赞（LocalStorage 持久化）
- 1-5 星星级评分
- 文字评论
- 浏览记录
- 临时气泡池收纳

### 筛选与搜索
- 场景标签多选筛选
- 难度等级多选筛选
- 热度/评分/时间排序
- 关键词搜索

### 主题切换
- 深色 / 浅色双主题
- CSS Variables 即时响应
- LocalStorage 持久化偏好

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/cases` | 获取案例列表（支持筛选分页） |
| GET | `/api/cases/filter-dimensions` | 获取筛选维度 |
| GET | `/api/cases/:id` | 获取案例详情 |
| GET | `/api/cases/:id/comments` | 获取评论 |
| POST | `/api/cases/:id/comments` | 添加评论 |
| GET | `/api/cases/:id/recommendations` | 获取推荐 |

## 开发说明

### 代码规范
- 所有代码使用 TypeScript 严格模式
- 完整中文注释
- 组件使用函数式 + Hooks
- 状态管理使用 Zustand
- 动画使用 Framer Motion

### 数据说明
- 后端数据存储在 `server/src/data/cases.json`
- 前端互动数据存储在浏览器 LocalStorage
- 预置 12 条示例案例数据

## 构建部署

```bash
# 构建前端
cd client && npm run build

# 启动生产服务
cd server && npm start
```

## 许可证

MIT License - 练手项目，仅供学习参考。
