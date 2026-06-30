/**
 * 侧边筛选面板组件
 * 提供桌面端固定侧边栏 + 移动端底部 Drawer 的双形态筛选交互
 *
 * 功能：
 * - 按平台、场景标签、难度等级、排序方式实时筛选
 * - 筛选结果即时同步到两种浏览模式
 * - 桌面端固定左侧，移动端底部弹层
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  SlidersHorizontal,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  SceneTag,
  Difficulty,
  Platform,
  SortBy,
  FilterOptions,
} from '@/types/case';
import { DIFFICULTY_LABELS, PLATFORM_NAMES } from '@/utils/filter';

/** 排序选项配置 */
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'heatDesc', label: '热度从高到低' },
  { value: 'heatAsc', label: '热度从低到高' },
  { value: 'rating', label: '评分优先' },
  { value: 'newest', label: '最新发布' },
];

/**
 * 筛选面板 Props
 */
interface FilterSidebarProps {
  /** 搜索关键词 */
  keyword: string;
  /** 搜索变更回调 */
  onKeywordChange: (keyword: string) => void;
  /** 当前筛选条件 */
  filters: FilterOptions;
  /** 筛选变更回调 */
  onFiltersChange: (filters: FilterOptions) => void;
  /** 当前选中平台 */
  selectedPlatforms: Platform[];
  /** 平台切换回调 */
  onTogglePlatform: (platform: Platform) => void;
  /** 可用维度数据 */
  dimensions: {
    sceneTags: SceneTag[];
    difficulties: Difficulty[];
    platforms: Platform[];
  };
  /** 筛选结果数量 */
  resultCount: number;
  /** 总案例数量 */
  totalCount: number;
  /** 重置筛选回调 */
  onReset: () => void;
}

/**
 * 可折叠筛选区块组件
 */
function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--border-color)] last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 text-sm font-medium text-[var(--text-primary)]"
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * 筛选面板主体内容
 * 被桌面端侧边栏和移动端 Drawer 共用
 */
function FilterContent({
  keyword,
  onKeywordChange,
  filters,
  onFiltersChange,
  selectedPlatforms,
  onTogglePlatform,
  dimensions,
  resultCount,
  totalCount,
  onReset,
}: FilterSidebarProps) {
  /**
   * 切换场景标签
   */
  const toggleSceneTag = (tag: SceneTag) => {
    const current = filters.sceneTags || [];
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    onFiltersChange({
      ...filters,
      sceneTags: updated.length > 0 ? updated : undefined,
    });
  };

  /**
   * 切换难度等级
   */
  const toggleDifficulty = (diff: Difficulty) => {
    const current = filters.difficulties || [];
    const updated = current.includes(diff)
      ? current.filter((d) => d !== diff)
      : [...current, diff];
    onFiltersChange({
      ...filters,
      difficulties: updated.length > 0 ? updated : undefined,
    });
  };

  /**
   * 设置排序方式
   */
  const setSortBy = (sortBy: SortBy) => {
    onFiltersChange({ ...filters, sortBy });
  };

  /**
   * 计算已选条件总数
   */
  const selectedCount =
    (filters.sceneTags?.length || 0) +
    (filters.difficulties?.length || 0) +
    (filters.sortBy ? 1 : 0) +
    selectedPlatforms.length +
    (keyword ? 1 : 0);

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[var(--text-secondary)]" />
          <h3 className="font-bold text-[var(--text-primary)]">筛选</h3>
          {selectedCount > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-accent text-white">
              {selectedCount}
            </span>
          )}
        </div>
        {selectedCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            重置
          </button>
        )}
      </div>

      {/* 滚动内容区 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {/* 搜索框 */}
        <CollapsibleSection title="搜索" defaultOpen={!!keyword}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              placeholder="搜索标题、Prompt..."
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]
                text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]
                focus:outline-none focus:border-accent transition-colors"
            />
            {keyword && (
              <button
                onClick={() => onKeywordChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </CollapsibleSection>

        {/* 平台筛选 */}
        {dimensions.platforms.length > 0 && (
          <CollapsibleSection title="平台">
            <div className="flex flex-wrap gap-2">
              {dimensions.platforms.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform);
                return (
                  <button
                    key={platform}
                    onClick={() => onTogglePlatform(platform)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${
                      isSelected
                        ? 'bg-accent text-white'
                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-accent'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      {PLATFORM_NAMES[platform] || platform}
                    </span>
                  </button>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* 场景标签筛选 */}
        {dimensions.sceneTags.length > 0 && (
          <CollapsibleSection title="场景">
            <div className="flex flex-wrap gap-2">
              {dimensions.sceneTags.map((tag) => {
                const isSelected = filters.sceneTags?.includes(tag);
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
          </CollapsibleSection>
        )}

        {/* 难度等级筛选 */}
        {dimensions.difficulties.length > 0 && (
          <CollapsibleSection title="难度">
            <div className="flex flex-wrap gap-2">
              {dimensions.difficulties.map((diff) => {
                const isSelected = filters.difficulties?.includes(diff);
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
          </CollapsibleSection>
        )}

        {/* 排序方式 */}
        <CollapsibleSection title="排序" defaultOpen={!!filters.sortBy}>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((option) => {
              const isSelected = filters.sortBy === option.value;
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
        </CollapsibleSection>
      </div>

      {/* 底部统计 */}
      <div className="px-5 py-3 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
        <p className="text-xs text-[var(--text-secondary)]">
          展示 <span className="font-medium text-[var(--text-primary)]">{resultCount}</span> /{' '}
          {totalCount} 个案例
        </p>
      </div>
    </div>
  );
}

/**
 * 筛选面板组件
 * 桌面端渲染为固定侧边栏，移动端渲染为底部 Drawer
 */
export default function FilterSidebar(props: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* 桌面端：固定侧边栏 */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm">
          <FilterContent {...props} />
        </div>
      </aside>

      {/* 移动端：底部筛选按钮 */}
      <div className="lg:hidden fixed bottom-20 left-4 z-30">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full
            bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-lg
            text-[var(--text-primary)] hover:border-accent transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-sm font-medium">筛选</span>
          {props.selectedPlatforms.length +
            (props.filters.sceneTags?.length || 0) +
            (props.filters.difficulties?.length || 0) >
            0 && (
            <span className="w-2 h-2 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {/* 移动端：底部 Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] rounded-t-2xl
                bg-[var(--bg-secondary)] border-t border-[var(--border-color)] shadow-2xl
                flex flex-col"
            >
              {/* 拖动指示条 */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[var(--border-color)]" />
              </div>
              <div className="flex-1 overflow-hidden">
                <FilterContent {...props} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
