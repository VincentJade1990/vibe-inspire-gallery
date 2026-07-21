/**
 * 案例相关 API 接口模块（Supabase 直连版）
 * 从 HTTP API 改为直接查询 Supabase
 */

import { supabase } from '@/lib/supabase';
import type {
  CaseItem,
  CommentItem,
  FilterOptions,
  PaginatedResponse,
  FilterDimensions,
  Platform,
  Difficulty,
  SceneTag,
} from '@/types/case';

/** 前端支持的8个场景标签 */
const VALID_SCENE_TAGS: SceneTag[] = [
  'Web应用', '移动端', '游戏', '工具脚本', 'AI应用', 'Chrome插件', '小程序', '数据可视化'
];

/** 将 Supabase tags 映射为前端 sceneTags */
function mapTagsToSceneTags(tags: string[] | null): SceneTag[] {
  if (!tags) return [];
  const mapped: SceneTag[] = [];
  for (const tag of tags) {
    const normalized = tag.trim();
    if (VALID_SCENE_TAGS.includes(normalized as SceneTag)) {
      mapped.push(normalized as SceneTag);
    }
  }
  return mapped;
}

/** 将 Supabase 行数据映射为前端 CaseItem */
function mapRowToCaseItem(row: Record<string, unknown>): CaseItem {
  const tags = Array.isArray(row.tags) ? row.tags as string[] : [];
  const galleryImages = Array.isArray(row.gallery_images) ? row.gallery_images as string[] : [];
  const likeCount = typeof row.like_count === 'number' ? row.like_count : 0;

  return {
    id: String(row.id || ''),
    title: String(row.title || ''),
    platform: (String(row.source_platform || '') as Platform) || 'xiaohongshu',
    originalUrl: String(row.source_url || ''),
    coverImage: String(row.cover_image_url || ''),
    demoImages: galleryImages.length > 0 ? galleryImages : undefined,
    demoVideo: undefined,
    prompt: String(row.replication_steps || row.description || row.summary || ''),
    likes: likeCount,
    heatScore: Math.min(100, likeCount * 2 + 10),
    sceneTags: mapTagsToSceneTags(tags),
    difficulty: (String(row.difficulty || '') as Difficulty) || 'beginner',
    author: String(row.author_name || '') || undefined,
    publishTime: String(row.created_at || new Date().toISOString()),
    description: String(row.description || row.summary || ''),
    avgRating: 0,
  };
}

/**
 * 获取案例列表（支持筛选、排序、分页）
 */
export async function fetchCases(
  filters: FilterOptions = {},
  page: number = 1,
  pageSize: number = 12
): Promise<PaginatedResponse<CaseItem>> {
  let query = supabase
    .from('inspirations')
    .select('*', { count: 'exact' })
    .eq('status', 'published');

  // 关键词搜索
  if (filters.keyword?.trim()) {
    const kw = filters.keyword.trim();
    query = query.or(`title.ilike.%${kw}%,description.ilike.%${kw}%,summary.ilike.%${kw}%`);
  }

  // 难度筛选
  if (filters.difficulties?.length) {
    query = query.in('difficulty', filters.difficulties);
  }

  // 排序
  switch (filters.sortBy) {
    case 'heatDesc':
      query = query.order('like_count', { ascending: false });
      break;
    case 'heatAsc':
      query = query.order('like_count', { ascending: true });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'rating':
      // Supabase 无评分字段，按 like_count 近似
      query = query.order('like_count', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  // 分页
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('[fetchCases] Supabase 错误:', error);
    throw new Error(error.message);
  }

  const items = (data || []).map((row: Record<string, unknown>) => mapRowToCaseItem(row));
  const total = count || 0;

  return {
    data: items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    hasNext: page * pageSize < total,
  };
}

/**
 * 根据ID获取单个案例详情
 */
export async function fetchCaseById(id: string): Promise<CaseItem> {
  const { data, error } = await supabase
    .from('inspirations')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (error) {
    console.error('[fetchCaseById] Supabase 错误:', error);
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('案例不存在');
  }

  return mapRowToCaseItem(data as Record<string, unknown>);
}

/**
 * 获取所有可用的筛选维度
 */
export async function fetchFilterDimensions(): Promise<FilterDimensions> {
  // 查询 sources 表获取平台列表
  const { data: sourcesData, error: sourcesError } = await supabase
    .from('sources')
    .select('slug')
    .eq('is_active', true);

  if (sourcesError) {
    console.error('[fetchFilterDimensions] sources 查询错误:', sourcesError);
  }

  // 查询 inspirations 表获取所有标签（去重）
  const { data: tagData, error: tagError } = await supabase
    .from('inspirations')
    .select('tags')
    .eq('status', 'published');

  if (tagError) {
    console.error('[fetchFilterDimensions] tags 查询错误:', tagError);
  }

  // 提取所有标签并去重
  const allTags = new Set<string>();
  (tagData || []).forEach((row: Record<string, unknown>) => {
    const tags = Array.isArray(row.tags) ? row.tags as string[] : [];
    tags.forEach((t: string) => allTags.add(t.trim()));
  });

  // 过滤为前端支持的 sceneTags
  const sceneTags = Array.from(allTags).filter((t) =>
    VALID_SCENE_TAGS.includes(t as SceneTag)
  ) as SceneTag[];

  return {
    sceneTags,
    difficulties: ['beginner', 'intermediate', 'advanced'] as Difficulty[],
  };
}

/**
 * 获取案例的评论列表
 * 暂时返回空数组（评论功能后续接入 Supabase）
 */
export async function fetchComments(_caseId: string): Promise<CommentItem[]> {
  return [];
}

/**
 * 为案例添加评论
 * 暂时不做任何操作
 */
export async function addComment(_caseId: string, _text: string): Promise<CommentItem> {
  return {
    id: Date.now().toString(),
    text: _text,
    time: new Date().toISOString(),
  };
}

/**
 * 获取相关推荐案例
 */
export async function fetchRecommendations(
  caseId: string,
  limit: number = 4
): Promise<CaseItem[]> {
  const { data, error } = await supabase
    .from('inspirations')
    .select('*')
    .eq('status', 'published')
    .neq('id', caseId)
    .order('like_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[fetchRecommendations] Supabase 错误:', error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => mapRowToCaseItem(row));
}

/**
 * 检查后端服务健康状态
 */
export async function checkHealth(): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.from('inspirations').select('id', { count: 'exact', head: true });
    return {
      success: !error,
      message: error ? `连接异常: ${error.message}` : 'Supabase 连接正常',
    };
  } catch (e) {
    return { success: false, message: `连接失败: ${e}` };
  }
}
