/**
 * 主题切换按钮组件
 * 切换深色/浅色主题，使用太阳/月亮图标
 */

import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';

/**
 * 主题切换按钮
 * 点击切换深色/浅色模式
 */
export default function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-[var(--accent-soft)] transition-all duration-200
        text-[var(--text-primary)] hover:text-accent"
      aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
      title={isDark ? '切换到浅色模式' : '切换到深色模式'}
    >
      {isDark ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
