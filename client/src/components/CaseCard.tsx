/**
 * 案例卡片组件
 * 展示单个案例的缩略信息，支持点击跳转详情
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ExternalLink } from 'lucide-react';
import type { CaseItem } from '@/types/case';
import { useInteractionStore } from '@/store/useInteractionStore';
import {
  PLATFORM_NAMES,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  formatNumber,
} from '@/utils/filter';

interface CaseCardProps {
  /** 案例数据 */
  caseItem: CaseItem;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 点击回调 */
  onClick?: (item: CaseItem) => void;
}

/**
 * 案例卡片组件
 * 展示案例封面、标题、平台、标签、热度等信息
 */
export default function CaseCard({ caseItem, compact = false, onClick }: CaseCardProps) {
  const navigate = useNavigate();
  const { isLiked, toggleLike } = useInteractionStore();

  const liked = isLiked(caseItem.id);

  const handleClick = () => {
    if (onClick) {
      onClick(caseItem);
    } else {
      navigate(`/case/${caseItem.id}`);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(caseItem.id);
  };

  if (compact) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="card-base p-3 cursor-pointer hover:border-accent transition-colors"
        onClick={handleClick}
      >
        <div className="flex gap-3">
          {/* 封面缩略图 */}
          <img
            src={caseItem.coverImage}
            alt={caseItem.title}
            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
            loading="lazy"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-2 text-[var(--text-primary)]">
              {caseItem.title}
            </h4>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-[var(--text-secondary)]">
                {PLATFORM_NAMES[caseItem.platform]}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${DIFFICULTY_COLORS[caseItem.difficulty]}`}>
                {DIFFICULTY_LABELS[caseItem.difficulty]}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      className="card-base overflow-hidden cursor-pointer group"
      onClick={handleClick}
    >
      {/* 封面图 */}
      <div className="relative overflow-hidden">
        <img
          src={caseItem.coverImage}
          alt={caseItem.title}
          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* 平台标识 */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-black/50 text-white backdrop-blur-sm">
            {PLATFORM_NAMES[caseItem.platform]}
          </span>
        </div>
        {/* 热度标识 */}
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-accent/80 text-white">
            {caseItem.heatScore.toFixed(0)}°
          </span>
        </div>
      </div>

      {/* 内容区 */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2 group-hover:text-accent transition-colors">
          {caseItem.title}
        </h3>

        {/* 标签 */}
        <div className="flex flex-wrap gap-1.5">
          {caseItem.sceneTags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>

        {/* 底部信息 */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <span className={`px-2 py-0.5 rounded-full text-xs ${DIFFICULTY_COLORS[caseItem.difficulty]}`}>
              {DIFFICULTY_LABELS[caseItem.difficulty]}
            </span>
            <span className="flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5" />
              {formatNumber(caseItem.likes)}
            </span>
          </div>

          {/* 点赞按钮 */}
          <button
            onClick={handleLike}
            className={`p-1.5 rounded-full transition-all duration-200 ${
              liked
                ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                : 'text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-red-500' : ''}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
