/**
 * 全局右下角悬浮收纳气泡池按钮
 * 两种浏览模式下均可见，点击展开气泡池抽屉
 *
 * 设计：
 * - 悬浮在右下角，带有轻微阴影
 * - 显示当前气泡池内案例数量徽标
 * - 使用 Framer Motion 添加呼吸动画吸引注意力
 * - 有案例时徽标脉动，空状态静态展示
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Archive } from 'lucide-react';
import { useInteractionStore } from '@/store/useInteractionStore';

/**
 * 悬浮气泡池按钮 Props
 */
interface FloatingBubblePoolProps {
  /** 点击打开气泡池回调 */
  onOpen: () => void;
}

/**
 * 全局右下角悬浮气泡池按钮组件
 */
export default function FloatingBubblePool({ onOpen }: FloatingBubblePoolProps) {
  const { savedBubbles } = useInteractionStore();
  const count = savedBubbles.length;
  const hasItems = count > 0;

  return (
    <motion.button
      onClick={onOpen}
      className="fixed bottom-6 right-6 z-30 flex items-center justify-center
        w-14 h-14 rounded-full shadow-lg
        bg-[var(--bg-secondary)] border border-[var(--border-color)]
        text-[var(--text-primary)] hover:border-accent hover:text-accent
        transition-colors duration-200"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      aria-label="打开临时气泡池"
      title="临时气泡池"
    >
      <Archive className="w-5 h-5" />

      {/* 数量徽标 */}
      <AnimatePresence>
        {hasItems && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 flex items-center justify-center
              min-w-[20px] h-5 px-1 rounded-full
              bg-accent text-white text-xs font-bold"
          >
            {count > 99 ? '99+' : count}
          </motion.span>
        )}
      </AnimatePresence>

      {/* 有内容时的呼吸光环 */}
      <AnimatePresence>
        {hasItems && (
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-accent"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: [0, 0.4, 0], scale: [1, 1.15, 1.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
