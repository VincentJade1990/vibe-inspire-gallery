/**
 * 骨架屏加载组件
 * 提供多种骨架屏布局，用于数据加载时的占位展示
 */

import { motion } from 'framer-motion';

/**
 * 基础骨架屏组件
 * @param props.className - 自定义样式类
 * @param props.style - 自定义行内样式
 */
interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[var(--border-color)] rounded-md ${className}`}
      style={style}
    />
  );
}

/**
 * 卡片骨架屏
 * 模拟案例卡片的加载占位
 */
export function CardSkeleton() {
  return (
    <div className="card-base p-4 space-y-3">
      {/* 封面图占位 */}
      <Skeleton className="w-full h-40 rounded-lg" />
      {/* 标题占位 */}
      <Skeleton className="w-3/4 h-5" />
      {/* 平台标签占位 */}
      <div className="flex gap-2">
        <Skeleton className="w-16 h-4" />
        <Skeleton className="w-12 h-4" />
      </div>
      {/* 底部信息占位 */}
      <div className="flex justify-between">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-12 h-4" />
      </div>
    </div>
  );
}

/**
 * 卡片堆叠骨架屏
 * 模拟Tinder风格卡片加载占位
 */
export function CardStackSkeleton() {
  return (
    <div className="relative flex items-center justify-center h-[60vh]">
      {/* 底层卡片 */}
      <motion.div
        className="absolute w-72 h-96 card-base rounded-2xl"
        style={{ scale: 0.92, opacity: 0.4 }}
      />
      {/* 中间卡片 */}
      <motion.div
        className="absolute w-72 h-96 card-base rounded-2xl"
        style={{ scale: 0.96, opacity: 0.7 }}
      />
      {/* 顶层卡片 */}
      <div className="relative w-72 h-96 card-base rounded-2xl p-4 space-y-4">
        <Skeleton className="w-full h-48 rounded-xl" />
        <Skeleton className="w-3/4 h-5" />
        <Skeleton className="w-1/2 h-4" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="w-14 h-8 rounded-full" />
          <Skeleton className="w-14 h-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * 详情页骨架屏
 */
export function DetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* 封面占位 */}
      <Skeleton className="w-full h-64 rounded-2xl" />
      {/* 标题占位 */}
      <Skeleton className="w-2/3 h-8" />
      {/* 元信息占位 */}
      <div className="flex gap-3">
        <Skeleton className="w-20 h-5" />
        <Skeleton className="w-16 h-5" />
        <Skeleton className="w-24 h-5" />
      </div>
      {/* Prompt区域占位 */}
      <div className="space-y-2">
        <Skeleton className="w-32 h-5" />
        <Skeleton className="w-full h-24" />
      </div>
    </div>
  );
}

/**
 * 气泡画布骨架屏
 */
export function BubbleCanvasSkeleton() {
  return (
    <div className="relative w-full h-[70vh]">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-[var(--border-color)]"
          style={{
            width: 40 + Math.random() * 60,
            height: 40 + Math.random() * 60,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

/**
 * 骨架屏列表
 * @param count - 骨架屏数量
 * @param type - 骨架屏类型
 */
interface SkeletonListProps {
  count?: number;
  type?: 'card' | 'stack' | 'detail' | 'bubble';
}

export function SkeletonList({ count = 3, type = 'card' }: SkeletonListProps) {
  if (type === 'stack') return <CardStackSkeleton />;
  if (type === 'detail') return <DetailSkeleton />;
  if (type === 'bubble') return <BubbleCanvasSkeleton />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
