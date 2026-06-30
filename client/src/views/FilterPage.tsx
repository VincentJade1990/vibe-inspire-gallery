/**
 * 筛选页
 * 提供多维度筛选功能，展示筛选结果
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, X } from 'lucide-react';
import type { CaseItem, FilterOptions, SceneTag, Difficulty } from '@/types/case';
import { fetchCases, fetchFilterDimensions } from '@/api/caseApi';
import { filterCases } from '@/utils/filter';
import FilterPanel from '@/components/FilterPanel';
import CaseCard from '@/components/CaseCard';
import EmptyState from '@/components/EmptyState';
import { SkeletonList } from '@/components/SkeletonLoader';

/**
 * 筛选页组件
 */
export default function FilterPage() {
  const navigate = useNavigate();

  // 筛选条件
  const [filters, setFilters] = useState<FilterOptions>({});
  // 搜索关键词
  const [keyword, setKeyword] = useState('');
  // 所有案例
  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  // 筛选结果
  const [filteredCases, setFilteredCases] = useState<CaseItem[]>([]);
  // 加载状态
  const [loading, setLoading] = useState(true);
  // 可用筛选维度
  const [dimensions, setDimensions] = useState<{
    sceneTags: SceneTag[];
    difficulties: Difficulty[];
  }>({ sceneTags: [], difficulties: [] });

  /**
   * 加载所有案例和筛选维度
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 并行加载案例和维度数据
      const [casesResponse, dims] = await Promise.all([
        fetchCases({}, 1, 100),
        fetchFilterDimensions(),
      ]);
      setAllCases(casesResponse.data);
      setFilteredCases(casesResponse.data);
      setDimensions(dims);
    } catch (err) {
      console.error('加载筛选数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * 当筛选条件或搜索词变化时，执行本地筛选
   */
  useEffect(() => {
    const options: FilterOptions = {
      ...filters,
      keyword: keyword || undefined,
    };
    const result = filterCases(allCases, options);
    setFilteredCases(result);
  }, [filters, keyword, allCases]);

  /**
   * 处理筛选变更
   */
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  /**
   * 清除搜索关键词
   */
  const clearKeyword = () => {
    setKeyword('');
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 头部 */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-md hover:bg-[var(--accent-soft)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
          </button>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">筛选案例</h1>
        </div>

        {/* 搜索框 */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索标题、描述或 Prompt..."
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]
              text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]
              focus:outline-none focus:border-accent transition-colors"
          />
          {keyword && (
            <button
              onClick={clearKeyword}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md
                text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]
                transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧筛选面板 */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              <FilterPanel
                filters={filters}
                onChange={handleFilterChange}
                availableSceneTags={dimensions.sceneTags}
                availableDifficulties={dimensions.difficulties}
              />
            </div>
          </div>

          {/* 右侧结果列表 */}
          <div className="lg:col-span-3">
            {/* 结果统计 */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[var(--text-secondary)]">
                共找到 <span className="font-medium text-[var(--text-primary)]">{filteredCases.length}</span> 个案例
              </p>
              {(filters.sceneTags?.length || filters.difficulties?.length || filters.sortBy) && (
                <button
                  onClick={() => setFilters({})}
                  className="text-sm text-accent hover:text-accent-light transition-colors"
                >
                  清除全部筛选
                </button>
              )}
            </div>

            {/* 加载状态 */}
            {loading && <SkeletonList count={6} />}

            {/* 结果列表 */}
            {!loading && (
              <>
                {filteredCases.length > 0 ? (
                  <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {filteredCases.map((caseItem) => (
                      <CaseCard key={caseItem.id} caseItem={caseItem} />
                    ))}
                  </motion.div>
                ) : (
                  <EmptyState
                    title="没有找到符合条件的案例"
                    description="尝试调整筛选条件或搜索关键词"
                    showRefresh
                    onRefresh={() => {
                      setFilters({});
                      setKeyword('');
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
