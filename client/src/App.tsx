/**
 * 应用根组件
 * 全局容器：导航栏、侧边筛选、双模式浏览、悬浮气泡池、路由配置
 *
 * 架构设计：
 * - 顶部固定 Navbar：项目名称 + 模式切换 + 主题切换
 * - 主内容区：桌面端左侧 FilterSidebar + 右侧路由内容
 * - 全局右下角 FloatingBubblePool（仅在首页）
 * - 模式切换 0.3s spring 弹性过渡动画
 * - 全局状态管理：useCaseStore（案例/筛选）、useInteractionStore（模式/气泡池）
 */

import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import type { ViewMode } from '@/types/case';
import { useCaseStore } from '@/store/useCaseStore';
import { useInteractionStore } from '@/store/useInteractionStore';
import Navbar from './components/Navbar';
import FilterSidebar from './components/FilterSidebar';
import FloatingBubblePool from './components/FloatingBubblePool';
import BubblePool from './components/BubblePool';
import Home from './views/Home';
import CaseDetail from './views/CaseDetail';
import FilterPage from './views/FilterPage';
import NotFound from './views/NotFound';

/**
 * 应用主组件
 */
function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  // ===== 全局案例状态 =====
  const {
    cases,
    filteredCases,
    loading,
    error,
    dimensions,
    filters,
    keyword,
    selectedPlatforms,
    loadCases,
    setFilters,
    setKeyword,
    togglePlatform,
    resetFilters,
  } = useCaseStore();

  // ===== 用户互动状态 =====
  const { preferredMode, setPreferredMode } = useInteractionStore();

  // ===== 本地状态 =====
  /** 当前浏览模式，优先从用户偏好初始化 */
  const [viewMode, setViewMode] = useState<ViewMode>(preferredMode);
  /** 气泡池抽屉显隐 */
  const [showBubblePool, setShowBubblePool] = useState(false);

  /**
   * 首次挂载时加载案例数据
   */
  useEffect(() => {
    if (cases.length === 0) {
      loadCases();
    }
  }, [cases.length, loadCases]);

  /**
   * 同步用户偏好模式到本地状态
   * 当用户从 LocalStorage 恢复偏好时生效
   */
  useEffect(() => {
    setViewMode(preferredMode);
  }, [preferredMode]);

  /**
   * 处理浏览模式切换
   * 同时更新本地状态和持久化偏好
   */
  const handleModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      setPreferredMode(mode);
    },
    [setPreferredMode]
  );

  /**
   * 刷新数据
   */
  const handleRefresh = useCallback(() => {
    loadCases();
  }, [loadCases]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      {/* 顶部导航栏 */}
      <Navbar viewMode={viewMode} onModeChange={handleModeChange} />

      {/* 主布局区 */}
      <div className="pt-14">
        {isHome ? (
          /* 首页布局：桌面端侧边栏 + 内容区 */
          <div className="max-w-7xl mx-auto flex gap-6 px-4">
            {/* 侧边筛选面板（桌面端固定，移动端底部按钮+Drawer） */}
            <FilterSidebar
              keyword={keyword}
              onKeywordChange={setKeyword}
              filters={filters}
              onFiltersChange={setFilters}
              selectedPlatforms={selectedPlatforms}
              onTogglePlatform={togglePlatform}
              dimensions={dimensions}
              resultCount={filteredCases.length}
              totalCount={cases.length}
              onReset={resetFilters}
            />

            {/* 主内容区 */}
            <main className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  <Route
                    path="/"
                    element={
                      <Home
                        cases={filteredCases}
                        viewMode={viewMode}
                        loading={loading}
                        error={error}
                        onRefresh={handleRefresh}
                      />
                    }
                  />
                </Routes>
              </AnimatePresence>
            </main>
          </div>
        ) : (
          /* 非首页：标准居中布局 */
          <main className="max-w-6xl mx-auto px-4">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/case/:id" element={<CaseDetail />} />
                <Route path="/filter" element={<FilterPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </main>
        )}
      </div>

      {/* 全局右下角悬浮气泡池（仅在首页显示） */}
      {isHome && (
        <>
          <FloatingBubblePool onOpen={() => setShowBubblePool(true)} />
          <BubblePool
            cases={cases}
            isOpen={showBubblePool}
            onClose={() => setShowBubblePool(false)}
          />
        </>
      )}
    </div>
  );
}

export default App;
