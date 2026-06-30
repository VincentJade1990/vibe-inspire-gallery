/**
 * 卡片滑动堆叠组件（Tinder风格）
 * 支持四向滑动交互：右滑点赞、左滑减少、上滑详情、下滑复制
 */

import { useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, X, ChevronUp, Copy, RotateCcw } from 'lucide-react';
import type { CaseItem } from '@/types/case';
import { useInteractionStore } from '@/store/useInteractionStore';
import { PLATFORM_NAMES, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/utils/filter';
import EmptyState from './EmptyState';

interface CardStackProps {
  /** 案例列表 */
  cases: CaseItem[];
}

/** 滑动阈值 */
const SWIPE_THRESHOLD = 100;

/**
 * 卡片滑动堆叠组件
 */
export default function CardStack({ cases }: CardStackProps) {
  const navigate = useNavigate();
  const { toggleLike, markDisliked, markViewed, isLiked } = useInteractionStore();

  // 当前显示的案例索引
  const [currentIndex, setCurrentIndex] = useState(0);
  // 是否显示操作提示
  const [showToast, setShowToast] = useState<string | null>(null);

  const currentCase = cases[currentIndex];
  const nextCase = cases[currentIndex + 1];

  // Framer Motion 动画控制
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();

  // 旋转角度与x位移关联
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  // 透明度与y位移关联（上滑时淡出）
  const opacity = useTransform(y, [-200, 0], [0.5, 1]);

  /**
   * 显示Toast提示
   */
  const showToastMessage = useCallback((message: string) => {
    setShowToast(message);
    setTimeout(() => setShowToast(null), 1500);
  }, []);

  /**
   * 处理滑动结束
   */
  const handleDragEnd = useCallback(
    async (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => {
      const { x: offsetX, y: offsetY } = info.offset;

      // 右滑 - 点赞
      if (offsetX > SWIPE_THRESHOLD) {
        await controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } });
        if (currentCase) {
          toggleLike(currentCase.id);
          showToastMessage('已点赞收藏');
        }
        setCurrentIndex((prev) => prev + 1);
        controls.set({ x: 0, y: 0, opacity: 1, rotate: 0 });
        return;
      }

      // 左滑 - 减少推荐
      if (offsetX < -SWIPE_THRESHOLD) {
        await controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } });
        if (currentCase) {
          markDisliked(currentCase.id);
          showToastMessage('已减少同类推荐');
        }
        setCurrentIndex((prev) => prev + 1);
        controls.set({ x: 0, y: 0, opacity: 1, rotate: 0 });
        return;
      }

      // 上滑 - 查看详情
      if (offsetY < -SWIPE_THRESHOLD) {
        await controls.start({ y: -500, opacity: 0, transition: { duration: 0.3 } });
        if (currentCase) {
          markViewed(currentCase.id);
          navigate(`/case/${currentCase.id}`);
        }
        return;
      }

      // 下滑 - 复制Prompt
      if (offsetY > SWIPE_THRESHOLD) {
        await controls.start({ y: 500, opacity: 0, transition: { duration: 0.3 } });
        if (currentCase) {
          navigator.clipboard.writeText(currentCase.prompt);
          showToastMessage('Prompt 已复制');
        }
        setCurrentIndex((prev) => prev + 1);
        controls.set({ x: 0, y: 0, opacity: 1, rotate: 0 });
        return;
      }

      // 未达阈值，回弹
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    },
    [currentCase, controls, toggleLike, markDisliked, markViewed, navigate, showToastMessage]
  );

  // 所有卡片浏览完毕
  if (!currentCase) {
    return (
      <EmptyState
        title="今日灵感已加载完毕"
        description="所有案例都已浏览完毕，点击按钮重新浏览"
        showRefresh
        onRefresh={() => setCurrentIndex(0)}
      />
    );
  }

  const liked = isLiked(currentCase.id);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Toast 提示 */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full
            bg-accent text-white text-sm font-medium shadow-lg"
        >
          {showToast}
        </motion.div>
      )}

      {/* 卡片堆叠区域 */}
      <div className="relative w-full max-w-sm h-[480px]">
        {/* 底层预览卡片 */}
        {nextCase && (
          <div className="absolute inset-0 card-base rounded-2xl overflow-hidden"
            style={{ transform: 'scale(0.92) translateY(12px)', opacity: 0.5 }}
          >
            <img src={nextCase.coverImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* 当前卡片 */}
        <motion.div
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.8}
          onDragEnd={handleDragEnd}
          animate={controls}
          style={{ x, y, rotate, opacity }}
          className="absolute inset-0 card-base rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing shadow-card-lg"
        >
          {/* 封面图 */}
          <div className="relative h-3/5">
            <img
              src={currentCase.coverImage}
              alt={currentCase.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
            {/* 平台标识 */}
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-black/50 text-white backdrop-blur-sm">
                {PLATFORM_NAMES[currentCase.platform]}
              </span>
            </div>
            {/* 热度 */}
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-accent/80 text-white">
                {currentCase.heatScore.toFixed(0)}°
              </span>
            </div>
          </div>

          {/* 内容 */}
          <div className="p-4 space-y-3">
            <h3 className="font-bold text-lg text-[var(--text-primary)] line-clamp-2">
              {currentCase.title}
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {currentCase.sceneTags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[currentCase.difficulty]}`}>
                {DIFFICULTY_LABELS[currentCase.difficulty]}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(currentCase.id);
                }}
                className={`p-1.5 rounded-full transition-colors ${
                  liked ? 'text-red-500' : 'text-[var(--text-secondary)]'
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-red-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* 滑动方向提示（拖拽时显示） */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: useTransform(x, [-150, -50, 50, 150], [1, 0, 0, 1]) }}
          >
            <div className={`px-4 py-2 rounded-full border-2 font-bold text-xl ${
              x.get() > 0 ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'
            }`}>
              {x.get() > 0 ? 'LIKE' : 'NOPE'}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* 操作提示 */}
      <div className="mt-6 flex items-center gap-6 text-[var(--text-secondary)] text-sm">
        <div className="flex flex-col items-center gap-1">
          <X className="w-5 h-5" />
          <span>左滑减少</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ChevronUp className="w-5 h-5" />
          <span>上滑详情</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Heart className="w-5 h-5" />
          <span>右滑点赞</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Copy className="w-5 h-5" />
          <span>下滑复制</span>
        </div>
      </div>

      {/* 进度指示 */}
      <div className="mt-4 text-sm text-[var(--text-secondary)]">
        {currentIndex + 1} / {cases.length}
      </div>

      {/* 重新浏览按钮 */}
      {currentIndex > 0 && (
        <button
          onClick={() => setCurrentIndex(0)}
          className="mt-3 flex items-center gap-1.5 text-sm text-accent hover:text-accent-light transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>重新浏览</span>
        </button>
      )}
    </div>
  );
}
