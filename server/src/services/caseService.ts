/**
 * 案例数据服务层
 * 负责读取本地JSON数据、提供CRUD操作、筛选排序聚合功能
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import type { CaseItem, CommentItem } from '../types/case';
import type { FilterCriteria } from '../utils/filter';
import { filterCases } from '../utils/filter';
import { paginate, type PaginatedResult } from '../utils/pagination';

// 本地JSON数据文件路径
const DATA_FILE = resolve(__dirname, '../data/cases.json');

/**
 * 从本地JSON文件读取所有案例数据
 * @returns 案例数组
 */
function readCases(): CaseItem[] {
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as CaseItem[];
  } catch (error) {
    console.error('读取案例数据失败:', error);
    return [];
  }
}

/**
 * 将案例数据写回本地JSON文件（用于评论持久化）
 * @param cases - 案例数组
 */
function writeCases(cases: CaseItem[]): void {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(cases, null, 2), 'utf-8');
  } catch (error) {
    console.error('写入案例数据失败:', error);
  }
}

/**
 * 获取分页案例列表（支持筛选排序）
 * @param criteria - 筛选条件
 * @param page - 页码
 * @param pageSize - 每页条数
 * @returns 分页结果
 */
export function getCases(
  criteria: FilterCriteria,
  page: number = 1,
  pageSize: number = 12
): PaginatedResult<CaseItem> {
  const allCases = readCases();
  const filtered = filterCases(allCases, criteria);
  return paginate(filtered, page, pageSize);
}

/**
 * 根据ID获取单个案例详情
 * @param id - 案例ID
 * @returns 案例对象或undefined
 */
export function getCaseById(id: string): CaseItem | undefined {
  const cases = readCases();
  return cases.find((c) => c.id === id);
}

/**
 * 获取所有可用的筛选维度（场景标签、难度等级）
 * @returns 筛选维度数据
 */
export function getFilterDimensions() {
  const cases = readCases();
  const sceneTags = [...new Set(cases.flatMap((c) => c.sceneTags))];
  const difficulties = [...new Set(cases.map((c) => c.difficulty))];
  return { sceneTags, difficulties };
}

/**
 * 为案例添加评论（写入本地JSON）
 * @param caseId - 案例ID
 * @param comment - 评论内容
 * @returns 是否添加成功
 */
export function addComment(caseId: string, comment: CommentItem): boolean {
  const cases = readCases();
  const caseItem = cases.find((c) => c.id === caseId);

  if (!caseItem) {
    return false;
  }

  // 初始化评论数组
  if (!caseItem.comments) {
    (caseItem as CaseItem & { comments: CommentItem[] }).comments = [];
  }

  (caseItem as CaseItem & { comments: CommentItem[] }).comments.unshift(comment);
  writeCases(cases);
  return true;
}

/**
 * 获取单个案例的评论列表
 * @param caseId - 案例ID
 * @returns 评论数组
 */
export function getComments(caseId: string): CommentItem[] {
  const caseItem = getCaseById(caseId);
  return (caseItem as CaseItem & { comments?: CommentItem[] })?.comments ?? [];
}

/**
 * 获取推荐案例（同场景标签的随机案例）
 * @param caseId - 当前案例ID（排除）
 * @param limit - 推荐数量
 * @returns 推荐案例数组
 */
export function getRecommendations(caseId: string, limit: number = 4): CaseItem[] {
  const cases = readCases();
  const current = cases.find((c) => c.id === caseId);

  if (!current) {
    return [];
  }

  // 获取同场景标签的其他案例
  const related = cases.filter(
    (c) => c.id !== caseId && c.sceneTags.some((tag) => current.sceneTags.includes(tag))
  );

  // 随机打乱并取前N个
  return related.sort(() => Math.random() - 0.5).slice(0, limit);
}
