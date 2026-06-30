/**
 * 前端筛选工具函数
 * 提供本地筛选、排序、搜索功能
 */

import type { CaseItem, Difficulty, SceneTag, SortBy } from '@/types/case';

/**
 * 筛选条件接口
 */
export interface LocalFilterOptions {
  /** 场景标签筛选 */
  sceneTags?: SceneTag[];
  /** 难度等级筛选 */
  difficulties?: Difficulty[];
  /** 排序方式 */
  sortBy?: SortBy;
  /** 搜索关键词 */
  keyword?: string;
}

/**
 * 本地筛选案例列表
 * @param cases - 原始案例数组
 * @param options - 筛选条件
 * @returns 筛选后的案例数组
 */
export function filterCases(cases: CaseItem[], options: LocalFilterOptions): CaseItem[] {
  let result = [...cases];

  // 关键词搜索
  if (options.keyword?.trim()) {
    const keyword = options.keyword.trim().toLowerCase();
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(keyword) ||
        (c.description && c.description.toLowerCase().includes(keyword)) ||
        c.prompt.toLowerCase().includes(keyword)
    );
  }

  // 场景标签筛选
  if (options.sceneTags?.length) {
    result = result.filter((c) =>
      c.sceneTags.some((tag) => options.sceneTags!.includes(tag))
    );
  }

  // 难度等级筛选
  if (options.difficulties?.length) {
    result = result.filter((c) => options.difficulties!.includes(c.difficulty));
  }

  // 排序
  if (options.sortBy) {
    result = sortCases(result, options.sortBy);
  }

  return result;
}

/**
 * 对案例数组进行排序
 * @param cases - 案例数组
 * @param sortBy - 排序方式
 * @returns 排序后的数组
 */
export function sortCases(cases: CaseItem[], sortBy: SortBy): CaseItem[] {
  const sorted = [...cases];

  switch (sortBy) {
    case 'heatDesc':
      sorted.sort((a, b) => b.heatScore - a.heatScore);
      break;
    case 'heatAsc':
      sorted.sort((a, b) => a.heatScore - b.heatScore);
      break;
    case 'rating':
      sorted.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
      break;
    case 'newest':
      sorted.sort(
        (a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime()
      );
      break;
    default:
      break;
  }

  return sorted;
}

/**
 * 平台显示名称映射
 */
export const PLATFORM_NAMES: Record<string, string> = {
  xiaohongshu: '小红书',
  bilibili: 'B站',
  douyin: '抖音',
  juejin: '掘金',
  x: 'X',
};

/**
 * 平台品牌色映射
 */
export const PLATFORM_COLORS: Record<string, string> = {
  xiaohongshu: '#ff2442',
  bilibili: '#00a1d6',
  douyin: '#000000',
  juejin: '#1e80ff',
  x: '#000000',
};

/**
 * 难度等级显示映射
 */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级',
};

/**
 * 难度等级颜色映射
 */
export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

/**
 * 格式化相对时间
 * @param dateString - ISO时间字符串
 * @returns 相对时间描述
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}周前`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}个月前`;
  return `${Math.floor(diffDay / 365)}年前`;
}
