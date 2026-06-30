/**
 * 筛选与排序工具函数
 * 提供多维度筛选、关键词搜索、排序功能
 */

import type { CaseItem, Difficulty, SceneTag, SortBy } from '../types/case';

/**
 * 筛选条件接口
 */
export interface FilterCriteria {
  /** 场景标签筛选，多选 */
  sceneTags?: SceneTag[];
  /** 难度等级筛选，多选 */
  difficulties?: Difficulty[];
  /** 排序方式 */
  sortBy?: SortBy;
  /** 搜索关键词 */
  keyword?: string;
}

/**
 * 根据筛选条件过滤案例列表
 * @param cases - 原始案例数组
 * @param criteria - 筛选条件
 * @returns 过滤后的案例数组
 */
export function filterCases(cases: CaseItem[], criteria: FilterCriteria): CaseItem[] {
  let result = [...cases];

  // 按关键词搜索（匹配标题和描述）
  if (criteria.keyword && criteria.keyword.trim()) {
    const keyword = criteria.keyword.trim().toLowerCase();
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(keyword) ||
        (c.description && c.description.toLowerCase().includes(keyword)) ||
        c.prompt.toLowerCase().includes(keyword)
    );
  }

  // 按场景标签筛选（多选，满足任一即可）
  if (criteria.sceneTags && criteria.sceneTags.length > 0) {
    result = result.filter((c) =>
      c.sceneTags.some((tag) => criteria.sceneTags!.includes(tag))
    );
  }

  // 按难度等级筛选（多选，满足任一即可）
  if (criteria.difficulties && criteria.difficulties.length > 0) {
    result = result.filter((c) => criteria.difficulties!.includes(c.difficulty));
  }

  // 排序
  if (criteria.sortBy) {
    result = sortCases(result, criteria.sortBy);
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
      // 热度从高到低
      sorted.sort((a, b) => b.heatScore - a.heatScore);
      break;
    case 'heatAsc':
      // 热度从低到高
      sorted.sort((a, b) => a.heatScore - b.heatScore);
      break;
    case 'rating':
      // 评分优先（avgRating存在时按avgRating，否则按heatScore）
      sorted.sort((a, b) => (b.avgRating ?? b.heatScore / 20) - (a.avgRating ?? a.heatScore / 20));
      break;
    case 'newest':
      // 最新发布
      sorted.sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime());
      break;
    default:
      break;
  }

  return sorted;
}

/**
 * 获取所有可用的场景标签（去重）
 * @param cases - 案例数组
 * @returns 场景标签集合
 */
export function getAllSceneTags(cases: CaseItem[]): SceneTag[] {
  const tagSet = new Set<SceneTag>();
  cases.forEach((c) => c.sceneTags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet);
}

/**
 * 获取所有可用的难度等级（去重）
 * @param cases - 案例数组
 * @returns 难度等级集合
 */
export function getAllDifficulties(cases: CaseItem[]): Difficulty[] {
  const diffSet = new Set<Difficulty>();
  cases.forEach((c) => diffSet.add(c.difficulty));
  return Array.from(diffSet);
}
