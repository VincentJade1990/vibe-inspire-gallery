/**
 * 筛选面板组件
 * 提供场景标签、难度等级、排序方式的多维度筛选
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { SceneTag, Difficulty, SortBy, FilterOptions } from '@/types/case';
import { DIFFICULTY_LABELS } from '@/utils/filter';

interface FilterPanelProps {
  /** 当前筛选条件 */
  filters: FilterOptions;
  /** 筛选变更回调 */
  onChange: (filters: FilterOptions) => void;
  /** 可用场景标签 */
  availableSceneTags: SceneTag[];
  /** 可用难度等级 */
  availableDifficulties: Difficulty[];
}

/** 排序选项配置 */
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'heatDesc', label: '热度从高到低' },
  { value: 'heatAsc', label: '热度从低到高' },
  { value: 'rating', label: '评分优先' },
  { value: 'newest', label: '最新发布' },
];

/**
 * 筛选面板组件
 */
export default function FilterPanel({
  filters,
  onChange,
  availableSceneTags,
  availableDifficulties,
}: FilterPanelProps) {
  // 本地状态，用于暂存用户的选择
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  // 当外部filters变化时同步本地状态
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  /**
   * 切换场景标签选择
   */
  const toggleSceneTag = (tag: SceneTag) => {
    setLocalFilters((prev) => {
      const current = prev.sceneTags || [];
      const updated = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      return { ...prev, sceneTags: updated.length > 0 ? updated : undefined };
    });
  };

  /**
   * 切换难度等级选择
   */
  const toggleDifficulty = (diff: Difficulty) => {
    setLocalFilters((prev) => {
      const current = prev.difficulties || [];
      const updated = current.includes(diff)
        ? current.filter((d) => d !== diff)
        : [...current, diff];
      return { ...prev, difficulties: updated.length > 0 ? updated : undefined };
    });
  };

  /**
   * 设置排序方式
   */
  const setSortBy = (sortBy: SortBy) => {
    setLocalFilters((prev) => ({ ...prev, sortBy }));
  };

  /**
   * 应用筛选
   */
  const applyFilters = () => {
    onChange(localFilters);
  };

  /**
   * 重置筛选
   */
  const resetFilters = () => {
    const empty: FilterOptions = {};
    setLocalFilters(empty);
    onChange(empty);
  };

  /**
   * 获取已选条件数量
   */
  const getSelectedCount = (): number => {
    let count = 0;
    if (localFilters.sceneTags?.length) count += localFilters.sceneTags.length;
    if (localFilters.difficulties?.length) count += localFilters.difficulties.length;
    if (localFilters.sortBy) count += 1;
    return count;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 space-y-6"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[var(--text-primary)]">筛选条件</h3>
        {getSelectedCount() > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
            重置
          </button>
        )}
      </div>

      {/* 场景标签筛选 */}
      <div>
        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">场景</h4>
        <div className="flex flex-wrap gap-2">
          {availableSceneTags.map((tag) => {
            const isSelected = localFilters.sceneTags?.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleSceneTag(tag)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${
                  isSelected
                    ? 'bg-accent text-white'
                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-accent'
                }`}
              >
                <span className="flex items-center gap-1">
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 难度等级筛选 */}
      <div>
        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">难度</h4>
        <div className="flex flex-wrap gap-2">
          {availableDifficulties.map((diff) => {
            const isSelected = localFilters.difficulties?.includes(diff);
            return (
              <button
                key={diff}
                onClick={() => toggleDifficulty(diff)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${
                  isSelected
                    ? 'bg-accent text-white'
                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-accent'
                }`}
              >
                <span className="flex items-center gap-1">
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {DIFFICULTY_LABELS[diff]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 排序方式 */}
      <div>
        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">排序</h4>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((option) => {
            const isSelected = localFilters.sortBy === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${
                  isSelected
                    ? 'bg-accent text-white'
                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-accent'
                }`}
              >
                <span className="flex items-center gap-1">
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 应用按钮 */}
      <button
        onClick={applyFilters}
        className="w-full py-2.5 rounded-lg bg-accent text-white font-medium
          hover:bg-accent-dark transition-colors"
      >
        应用筛选
        {getSelectedCount() > 0 && ` (${getSelectedCount()}个条件)`}
      </button>
    </motion.div>
  );
}
