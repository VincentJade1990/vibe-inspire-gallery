/**
 * 案例数据类型定义
 * 定义社媒平台类型、难度等级、案例完整数据结构
 */

/** 支持的社媒平台枚举 */
export type Platform = 'xiaohongshu' | 'bilibili' | 'douyin' | 'juejin' | 'x';

/** 难度等级枚举 */
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/** 场景标签预定义类型（可扩展） */
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

/**
 * 案例数据主接口
 * 对应社媒平台抓取的 Vibe Coding 案例完整信息
 */
export interface CaseItem {
  /** 全局唯一标识，格式 vc_{平台}_{原始ID} */
  id: string;
  /** 案例标题，长度限制100字符 */
  title: string;
  /** 来源平台 */
  platform: Platform;
  /** 社媒平台原帖链接 */
  originalUrl: string;
  /** 封面图URL */
  coverImage: string;
  /** 演示截图数组，最多5张 */
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
  /** 案例简介，长度限制300字符 */
  description?: string;
  /** 用户平均评分，由前端计算聚合 */
  avgRating?: number;
}

/** 筛选条件接口 */
export interface FilterOptions {
  /** 场景标签筛选，多选 */
  sceneTags?: SceneTag[];
  /** 难度等级筛选，多选 */
  difficulties?: Difficulty[];
  /** 排序方式 */
  sortBy?: SortBy;
  /** 搜索关键词，匹配标题和描述 */
  keyword?: string;
}

/** 分页参数接口 */
export interface PaginationParams {
  /** 当前页码，从1开始 */
  page: number;
  /** 每页条数 */
  pageSize: number;
}

/** 分页响应包装接口 */
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

/** 用户互动数据接口 */
export interface UserInteraction {
  /** 点赞记录，caseId -> boolean */
  likes: Record<string, boolean>;
  /** 评分记录，caseId -> 1-5分 */
  ratings: Record<string, number>;
  /** 评论记录，caseId -> 评论数组 */
  comments: Record<string, CommentItem[]>;
}

/** 单条评论接口 */
export interface CommentItem {
  /** 评论唯一ID */
  id: string;
  /** 评论内容 */
  text: string;
  /** 评论时间 */
  time: string;
}
