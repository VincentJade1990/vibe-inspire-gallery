/**
 * 前端案例数据类型定义
 * 与后端类型保持一致，确保前后端类型安全
 */

/** 支持的社媒平台枚举 */
export type Platform = 'xiaohongshu' | 'bilibili' | 'douyin' | 'juejin' | 'x';

/** 难度等级枚举 */
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/** 场景标签预定义类型 */
export type SceneTag =
  | 'Web应用'
  | '移动端'
  | '游戏'
  | '工具脚本'
  | 'AI应用'
  | 'Chrome插件'
  | '小程序'
  | '数据可视化';

/** 排序方式枚举 */
export type SortBy = 'heatDesc' | 'heatAsc' | 'rating' | 'newest';

/** 浏览模式枚举 */
export type ViewMode = 'card' | 'canvas';

/**
 * 案例数据主接口
 */
export interface CaseItem {
  /** 全局唯一标识 */
  id: string;
  /** 案例标题 */
  title: string;
  /** 来源平台 */
  platform: Platform;
  /** 社媒平台原帖链接 */
  originalUrl: string;
  /** 封面图URL */
  coverImage: string;
  /** 演示截图数组 */
  demoImages?: string[];
  /** 演示视频URL */
  demoVideo?: string;
  /** 完整生成Prompt */
  prompt: string;
  /** 社媒平台原始点赞数 */
  likes: number;
  /** 热度得分，归一化0-100 */
  heatScore: number;
  /** 场景标签数组 */
  sceneTags: SceneTag[];
  /** 难度等级 */
  difficulty: Difficulty;
  /** 原作者昵称 */
  author?: string;
  /** 发布时间，ISO 8601格式 */
  publishTime: string;
  /** 案例简介 */
  description?: string;
  /** 用户平均评分 */
  avgRating?: number;
  /** 项目状态 */
  projectStatus?: string;
  /** 商业模式 */
  businessModel?: string;
  /** 开发者主页 */
  authorUrl?: string;
  /** 产品链接 */
  productUrl?: string;
  /** 原始标签数组（未过滤的完整标签） */
  tags?: string[];
}

/** 筛选条件接口 */
export interface FilterOptions {
  /** 场景标签筛选，多选 */
  sceneTags?: SceneTag[];
  /** 难度等级筛选，多选 */
  difficulties?: Difficulty[];
  /** 排序方式 */
  sortBy?: SortBy;
  /** 搜索关键词 */
  keyword?: string;
}

/** 分页响应接口 */
export interface PaginatedResponse<T> {
  /** 当前页数据列表 */
  data: T[];
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 总条数 */
  total: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
}

/** API统一响应包装接口 */
export interface ApiResponse<T> {
  /** 请求是否成功 */
  success: boolean;
  /** 响应数据 */
  data: T;
  /** 错误信息（失败时返回） */
  message?: string;
}

/** 评论数据接口 */
export interface CommentItem {
  /** 评论唯一ID */
  id: string;
  /** 评论内容 */
  text: string;
  /** 评论时间 */
  time: string;
}

/** 筛选维度响应接口 */
export interface FilterDimensions {
  /** 所有场景标签 */
  sceneTags: SceneTag[];
  /** 所有难度等级 */
  difficulties: Difficulty[];
}

/** 平台信息配置 */
export interface PlatformConfig {
  /** 平台显示名称 */
  name: string;
  /** 平台标识颜色 */
  color: string;
  /** 平台图标（使用Lucide图标名） */
  icon: string;
}

/** 难度标签配置 */
export interface DifficultyConfig {
  /** 显示名称 */
  label: string;
  /** 标签颜色 */
  color: string;
}
