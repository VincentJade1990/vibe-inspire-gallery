/**
 * 全局案例数据状态管理 Store
 * 集中管理案例列表、筛选条件、筛选结果，供全应用共享
 *
 * 设计原则：
 * - 案例数据统一从后端 API 加载，不分散在各页面
 * - 筛选条件变更后自动重新计算筛选结果
 * - 两种浏览模式（卡片/气泡）共享同一份筛选结果
 */

import { create } from 'zustand';
import type { CaseItem, FilterOptions, SceneTag, Difficulty, Platform } from '@/types/case';
import { fetchCases, fetchFilterDimensions } from '@/api/caseApi';
import { filterCases } from '@/utils/filter';

/**
 * 案例状态接口
 */
interface CaseState {
  /** 全部案例数据（未经筛选） */
  cases: CaseItem[];
  /** 筛选后的案例数据 */
  filteredCases: CaseItem[];
  /** 当前筛选条件 */
  filters: FilterOptions;
  /** 搜索关键词 */
  keyword: string;
  /** 选中的平台筛选 */
  selectedPlatforms: Platform[];
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 可用的筛选维度 */
  dimensions: {
    sceneTags: SceneTag[];
    difficulties: Difficulty[];
    platforms: Platform[];
  };

  // Actions
  /** 加载案例数据 */
  loadCases: () => Promise<void>;
  /** 设置筛选条件（自动触发重新筛选） */
  setFilters: (filters: FilterOptions) => void;
  /** 设置搜索关键词 */
  setKeyword: (keyword: string) => void;
  /** 切换平台筛选 */
  togglePlatform: (platform: Platform) => void;
  /** 重置所有筛选 */
  resetFilters: () => void;
}

/**
 * 创建案例状态 Store
 *
 * 使用 Zustand 创建全局状态，不持久化（数据来自 API，实时性要求高）
 */
export const useCaseStore = create<CaseState>((set, get) => ({
  // 初始状态
  cases: [],
  filteredCases: [],
  filters: {},
  keyword: '',
  selectedPlatforms: [],
  loading: false,
  error: null,
  dimensions: {
    sceneTags: [],
    difficulties: [],
    platforms: [],
  },

  /**
   * 加载案例数据
   * 同时加载筛选维度信息
   */
  loadCases: async () => {
    set({ loading: true, error: null });
    try {
      // 并行加载案例列表和筛选维度
      const [casesRes, dims] = await Promise.all([
        fetchCases({}, 1, 100),
        fetchFilterDimensions().catch(() => ({ sceneTags: [] as SceneTag[], difficulties: [] as Difficulty[] })),
      ]);

      const allCases = casesRes.data;

      // 从数据中自动提取平台维度（去重）
      const platforms = Array.from(new Set(allCases.map((c) => c.platform))) as Platform[];

      set({
        cases: allCases,
        dimensions: {
          sceneTags: dims.sceneTags,
          difficulties: dims.difficulties,
          platforms,
        },
      });

      // 加载完成后执行一次筛选（应用当前筛选条件）
      get().setFilters(get().filters);

    } catch (err) {
      set({ error: '数据加载失败，请检查网络或后端服务' });
      console.error('[CaseStore] 加载案例失败:', err);
    } finally {
      set({ loading: false });
    }
  },

  /**
   * 设置筛选条件
   * 自动重新计算筛选结果
   */
  setFilters: (filters: FilterOptions) => {
    set({ filters });
    const state = get();

    // 使用通用筛选工具处理场景、难度、排序、关键词
    const baseFiltered = filterCases(state.cases, {
      ...filters,
      keyword: state.keyword || filters.keyword,
    });

    // 额外处理平台筛选（通用工具未覆盖）
    let result = baseFiltered;
    if (state.selectedPlatforms.length > 0) {
      result = result.filter((c) => state.selectedPlatforms.includes(c.platform));
    }

    set({ filteredCases: result });
  },

  /**
   * 设置搜索关键词
   * 变更后自动重新筛选
   */
  setKeyword: (keyword: string) => {
    set({ keyword });
    // 复用 setFilters 的筛选逻辑
    get().setFilters(get().filters);
  },

  /**
   * 切换平台选中状态
   * 若已选中则移除，未选中则添加
   */
  togglePlatform: (platform: Platform) => {
    set((state) => {
      const current = state.selectedPlatforms;
      const updated = current.includes(platform)
        ? current.filter((p) => p !== platform)
        : [...current, platform];
      return { selectedPlatforms: updated };
    });
    // 平台变更后重新筛选
    get().setFilters(get().filters);
  },

  /**
   * 重置所有筛选条件
   * 清空筛选条件、搜索词、平台选择
   */
  resetFilters: () => {
    set({
      filters: {},
      keyword: '',
      selectedPlatforms: [],
    });
    // 重置后显示全部案例
    const state = get();
    set({ filteredCases: state.cases });
  },
}));
