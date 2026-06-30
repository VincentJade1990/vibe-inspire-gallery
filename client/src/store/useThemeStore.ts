/**
 * 主题状态管理 Store
 * 使用 Zustand 管理深色/浅色主题切换，持久化到 LocalStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 主题状态接口
 */
interface ThemeState {
  /** 当前是否为深色模式 */
  isDark: boolean;
  /** 切换主题 */
  toggleTheme: () => void;
  /** 设置为深色模式 */
  setDark: () => void;
  /** 设置为浅色模式 */
  setLight: () => void;
}

/**
 * 创建主题状态 Store
 * 使用 persist 中间件将状态持久化到 LocalStorage
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      // 初始状态：根据系统偏好或本地存储决定
      isDark: (() => {
        // 优先读取本地存储
        const saved = localStorage.getItem('theme-storage');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            return parsed.state?.isDark ?? false;
          } catch {
            // 解析失败则回退到系统偏好
          }
        }
        // 检查系统深色模式偏好
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      })(),

      /**
       * 切换主题
       * 在深色和浅色之间切换
       */
      toggleTheme: () =>
        set((state) => {
          const newIsDark = !state.isDark;
          // 同步更新 HTML 元素的 class
          if (newIsDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { isDark: newIsDark };
        }),

      /**
       * 强制设置为深色模式
       */
      setDark: () =>
        set(() => {
          document.documentElement.classList.add('dark');
          return { isDark: true };
        }),

      /**
       * 强制设置为浅色模式
       */
      setLight: () =>
        set(() => {
          document.documentElement.classList.remove('dark');
          return { isDark: false };
        }),
    }),
    {
      // LocalStorage 存储键名
      name: 'theme-storage',
      // 只持久化 isDark 字段
      partialize: (state) => ({ isDark: state.isDark }),
    }
  )
);

/**
 * 初始化主题
 * 在应用启动时调用，确保 HTML class 与状态同步
 */
export function initTheme(): void {
  const state = useThemeStore.getState();
  if (state.isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
