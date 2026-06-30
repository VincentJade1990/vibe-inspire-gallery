/**
 * 首页组件
 * 双浏览模式内容渲染区，接收外部传入的案例数据和当前模式
 *
 * 职责：
 * - 根据 viewMode 渲染卡片滑动或气泡画布
 * - 展示骨架屏加载状态和空数据提示
 * - 不负责数据获取和模式切换（由 App.tsx 统一管理）
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { CaseItem, ViewMode } from '@/types/case';
import CardStack from '@/components/CardStack';
import BubbleCanvas from '@/components/BubbleCanvas';
import EmptyState from '@/components/EmptyState';
import { SkeletonList } from '@/components/SkeletonLoader';

/**
 * 首页 Props
 */
interface HomeProps {
  /** 当前要展示的案例列表（已筛选） */
  cases: CaseItem[];
  /** 当前浏览模式 */
  viewMode: ViewMode;
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 刷新数据回调 */
  onRefresh: () => void;
}

/**
 * 模式切换过渡动画配置
 * 使用 spring 弹性动画，时长约 0.3s
 */
const modeTransition = {
  initial: { opacity: 0, scale: 0.92, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 1.05, y: -20 },
  transition: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
    duration: 0.3,
  },
};

/**
 * 首页组件
 */
export default function Home({
  cases,
  viewMode,
  loading,
  error,
  onRefresh,
}: HomeProps) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-4">
      {/* 加载状态 */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <SkeletonList type={viewMode === 'card' ? 'stack' : 'bubble'} />
        </motion.div>
      )}

      {/* 错误状态 */}
      {!loading && error && (
        <EmptyState
          title="加载失败"
          description={error}
          showRefresh
          onRefresh={onRefresh}
        />
      )}

      {/* 空数据状态 */}
      {!loading && !error && cases.length === 0 && (
        <EmptyState
          title="暂无案例"
          description="当前没有符合条件的案例，尝试调整筛选条件"
          showRefresh
          onRefresh={onRefresh}
        />
      )}

      {/* 双模式内容切换 */}
      {!loading && !error && cases.length > 0 && (
        <AnimatePresence mode="wait">
          {viewMode === 'card' ? (
            <motion.div
              key="card"
              {...modeTransition}
              className="h-full"
            >
              <CardStack cases={cases} />
            </motion.div>
          ) : (
            <motion.div
              key="canvas"
              {...modeTransition}
              className="h-full"
            >
              <BubbleCanvas cases={cases} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
