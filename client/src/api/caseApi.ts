/**
 * 案例相关 API 接口模块
 * 封装所有与案例数据相关的后端请求
 */

import { get, post } from './axios';
import type {
  CaseItem,
  CommentItem,
  FilterOptions,
  PaginatedResponse,
  ApiResponse,
  FilterDimensions,
} from '@/types/case';

/**
 * 获取案例列表（支持筛选、排序、分页）
 * @param filters - 筛选条件
 * @param page - 页码（从1开始）
 * @param pageSize - 每页条数
 * @returns 分页案例列表
 */
export async function fetchCases(
  filters: FilterOptions = {},
  page: number = 1,
  pageSize: number = 12
): Promise<PaginatedResponse<CaseItem>> {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('pageSize', String(pageSize));

  if (filters.sceneTags?.length) {
    params.append('sceneTags', filters.sceneTags.join(','));
  }
  if (filters.difficulties?.length) {
    params.append('difficulties', filters.difficulties.join(','));
  }
  if (filters.sortBy) {
    params.append('sortBy', filters.sortBy);
  }
  if (filters.keyword) {
    params.append('keyword', filters.keyword);
  }

  const response = await get<ApiResponse<PaginatedResponse<CaseItem>>>(
    `/cases?${params.toString()}`
  );
  return response.data;
}

/**
 * 根据ID获取单个案例详情
 * @param id - 案例ID
 * @returns 案例详情
 */
export async function fetchCaseById(id: string): Promise<CaseItem> {
  const response = await get<ApiResponse<CaseItem>>(`/cases/${id}`);
  return response.data;
}

/**
 * 获取所有可用的筛选维度
 * @returns 场景标签和难度等级列表
 */
export async function fetchFilterDimensions(): Promise<FilterDimensions> {
  const response = await get<ApiResponse<FilterDimensions>>('/cases/filter-dimensions');
  return response.data;
}

/**
 * 获取案例的评论列表
 * @param caseId - 案例ID
 * @returns 评论数组
 */
export async function fetchComments(caseId: string): Promise<CommentItem[]> {
  const response = await get<ApiResponse<CommentItem[]>>(`/cases/${caseId}/comments`);
  return response.data;
}

/**
 * 为案例添加评论
 * @param caseId - 案例ID
 * @param text - 评论内容
 * @returns 新创建的评论
 */
export async function addComment(caseId: string, text: string): Promise<CommentItem> {
  const response = await post<ApiResponse<CommentItem>>(`/cases/${caseId}/comments`, { text });
  return response.data;
}

/**
 * 获取相关推荐案例
 * @param caseId - 当前案例ID
 * @param limit - 推荐数量
 * @returns 推荐案例数组
 */
export async function fetchRecommendations(
  caseId: string,
  limit: number = 4
): Promise<CaseItem[]> {
  const response = await get<ApiResponse<CaseItem[]>>(
    `/cases/${caseId}/recommendations?limit=${limit}`
  );
  return response.data;
}

/**
 * 检查后端服务健康状态
 * @returns 健康状态信息
 */
export async function checkHealth(): Promise<{ success: boolean; message: string }> {
  const response = await get<ApiResponse<{ success: boolean; message: string }>>('/health');
  return response.data;
}
