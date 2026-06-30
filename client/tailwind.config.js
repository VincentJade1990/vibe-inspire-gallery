/** @type {import('tailwindcss').Config} */
export default {
  // 深色模式使用class切换策略
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // 自定义颜色系统，与CSS Variables保持一致
      colors: {
        // 青蓝色主色调
        accent: {
          DEFAULT: '#0ea5e9',
          light: '#38bdf8',
          dark: '#0284c7',
          soft: 'rgba(14, 165, 233, 0.08)',
        },
        // 辅助色
        accent2: {
          DEFAULT: '#22d3ee',
          light: '#67e8f9',
          dark: '#06b6d4',
        },
        // 语义色
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#0ea5e9',
      },
      // 自定义字体族
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        mono: ['Fira Code', 'SF Mono', 'Courier New', 'monospace'],
      },
      // 自定义动画
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shake': 'shake 0.4s ease-in-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(14, 165, 233, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(14, 165, 233, 0.6)' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          from: { transform: 'translateY(-20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.5)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
      },
      // 自定义阴影
      boxShadow: {
        card: '0 4px 24px rgba(15, 23, 42, 0.06)',
        'card-lg': '0 12px 48px rgba(15, 23, 42, 0.1)',
        'card-dark': '0 4px 24px rgba(0, 0, 0, 0.2)',
        'card-lg-dark': '0 12px 48px rgba(0, 0, 0, 0.3)',
        glow: '0 0 30px rgba(14, 165, 233, 0.4)',
      },
      // 自定义圆角
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
      },
    },
  },
  plugins: [],
};
