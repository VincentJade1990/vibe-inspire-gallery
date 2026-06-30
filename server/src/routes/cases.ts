/**
 * 案例路由模块
 * 定义RESTful API端点，处理案例相关的HTTP请求
 */

import { Router, type Request, type Response } from 'express';
import type { SortBy, SceneTag, Difficulty } from '../types/case';
import {
  getCases,
  getCaseById,
  getFilterDimensions,
  addComment,
  getComments,
  getRecommendations,
} from '../services/caseService';
import { validatePagination } from '../utils/pagination';
import type { FilterCriteria } from '../utils/filter';

const router = Router();

/**
 * GET /api/cases
 * 获取案例列表（支持筛选、排序、分页）
 * 查询参数:
 *   - page: 页码 (默认1)
 *   - pageSize: 每页条数 (默认12)
 *   - sceneTags: 场景标签，多个用逗号分隔
 *   - difficulties: 难度等级，多个用逗号分隔
 *   - sortBy: 排序方式 (heatDesc|heatAsc|rating|newest)
 *   - keyword: 搜索关键词
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { page, pageSize } = validatePagination(req.query.page, req.query.pageSize);

    // 构建筛选条件
    const criteria: FilterCriteria = {};

    // 解析场景标签
    if (req.query.sceneTags) {
      criteria.sceneTags = String(req.query.sceneTags)
        .split(',')
        .filter(Boolean) as SceneTag[];
    }

    // 解析难度等级
    if (req.query.difficulties) {
      criteria.difficulties = String(req.query.difficulties)
        .split(',')
        .filter(Boolean) as Difficulty[];
    }

    // 解析排序方式
    if (req.query.sortBy) {
      const sortBy = String(req.query.sortBy) as SortBy;
      if (['heatDesc', 'heatAsc', 'rating', 'newest'].includes(sortBy)) {
        criteria.sortBy = sortBy;
      }
    }

    // 解析搜索关键词
    if (req.query.keyword) {
      criteria.keyword = String(req.query.keyword).trim();
    }

    const result = getCases(criteria, page, pageSize);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取案例列表失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * GET /api/cases/filter-dimensions
 * 获取所有可用的筛选维度（场景标签、难度等级）
 */
router.get('/filter-dimensions', (_req: Request, res: Response) => {
  try {
    const dimensions = getFilterDimensions();
    res.json({ success: true, data: dimensions });
  } catch (error) {
    console.error('获取筛选维度失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * GET /api/cases/:id
 * 根据ID获取单个案例详情
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const caseItem = getCaseById(id);

    if (!caseItem) {
      res.status(404).json({ success: false, message: '案例不存在' });
      return;
    }

    res.json({ success: true, data: caseItem });
  } catch (error) {
    console.error('获取案例详情失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * GET /api/cases/:id/comments
 * 获取案例的评论列表
 */
router.get('/:id/comments', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const comments = getComments(id);
    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * POST /api/cases/:id/comments
 * 为案例添加评论
 * 请求体: { text: string }
 */
router.post('/:id/comments', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ success: false, message: '评论内容不能为空' });
      return;
    }

    if (text.trim().length > 500) {
      res.status(400).json({ success: false, message: '评论内容不能超过500字符' });
      return;
    }

    const comment = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text: text.trim(),
      time: new Date().toISOString(),
    };

    const success = addComment(id, comment);

    if (!success) {
      res.status(404).json({ success: false, message: '案例不存在' });
      return;
    }

    res.json({ success: true, data: comment });
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * GET /api/cases/:id/recommendations
 * 获取相关推荐案例
 * 查询参数:
 *   - limit: 推荐数量 (默认4)
 */
router.get('/:id/recommendations', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = Math.min(10, Math.max(1, parseInt(String(req.query.limit || '4'), 10) || 4));
    const recommendations = getRecommendations(id, limit);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('获取推荐失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

export default router;
