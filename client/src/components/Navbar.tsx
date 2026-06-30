/**
 * 顶部导航栏组件
 * 包含项目名称、浏览模式切换、主题切换按钮
 *
 * 设计：
 * - 固定在顶部，玻璃态背景
 * - 左侧：项目名称 Logo
 * - 右侧：模式切换按钮组 + 主题切换
 * - 移动端简化显示（模式切换仅显示图标）
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Layers, Circle, ArrowLeft } from 'lucide-react';
import type { ViewMode } from '@/types/case';
import ThemeToggle from './ThemeToggle';

/**
 * 导航栏 Props
 */
interface NavbarProps {
  /** 当前浏览模式 */
  viewMode: ViewMode;
  /** 模式切换回调 */
  onModeChange: (mode: ViewMode) => void;
}

/**
 * 顶部导航栏组件
 */
export default function Navbar({ viewMode, onModeChange }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* 左侧：返回按钮或 Logo */}
        <div className="flex items-center gap-3">
          {!isHome && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-md hover:bg-[var(--accent-soft)] transition-colors"
              aria-label="返回"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
          )}
          <Link to="/" className="flex items-center gap-2 group">
            <Sparkles className="w-6 h-6 text-accent group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-lg gradient-text hidden sm:block">
              Vibe Coding 灵感库
            </span>
            {/* 移动端仅显示缩写 */}
            <span className="font-bold text-lg gradient-text sm:hidden">
              VibeInspire
            </span>
          </Link>
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-2">
          {/* 浏览模式切换（仅在首页显示） */}
          {isHome && (
            <div className="flex items-center gap-1 bg-[var(--bg-secondary)] rounded-lg p-1 border border-[var(--border-color)]">
              <button
                onClick={() => onModeChange('card')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'card'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                aria-label="切换到卡片模式"
                title="卡片模式"
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">卡片</span>
              </button>
              <button
                onClick={() => onModeChange('canvas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'canvas'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                aria-label="切换到气泡模式"
                title="气泡模式"
              >
                <Circle className="w-4 h-4" />
                <span className="hidden sm:inline">气泡</span>
              </button>
            </div>
          )}

          {/* 主题切换按钮 */}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
