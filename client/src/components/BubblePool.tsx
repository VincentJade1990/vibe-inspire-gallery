/**
 * 临时气泡池组件
 * 展示用户收纳的临时感兴趣案例，支持移除、清空、跳转详情
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ExternalLink } from 'lucide-react';
import type { CaseItem } from '@/types/case';
import { useInteractionStore } from '@/store/useInteractionStore';
import { useNavigate } from 'react-router-dom';

interface BubblePoolProps {
  /** 案例列表 */
  cases: CaseItem[];
  /** 是否显示 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * 临时气泡池抽屉组件
 */
export default function BubblePool({ cases, isOpen, onClose }: BubblePoolProps) {
  const navigate = useNavigate();
  const { savedBubbles, removeFromBubblePool, clearBubblePool } = useInteractionStore();

  // 获取气泡池中对应的案例数据
  const poolCases = savedBubbles
    .map((id) => cases.find((c) => c.id === id))
    .filter(Boolean) as CaseItem[];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 抽屉面板 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-80 max-w-[85vw]
              bg-[var(--bg-secondary)] border-l border-[var(--border-color)]
              shadow-xl flex flex-col"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">临时气泡池</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {poolCases.length} / 20 个案例
                </p>
              </div>
              <div className="flex items-center gap-1">
                {poolCases.length > 0 && (
                  <button
                    onClick={clearBubblePool}
                    className="p-2 rounded-md text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="清空全部"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 内容列表 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {poolCases.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-secondary)]">
                  <p className="text-sm">气泡池为空</p>
                  <p className="text-xs mt-1">长按气泡画布中的气泡即可收纳</p>
                </div>
              ) : (
                poolCases.map((caseItem) => (
                  <motion.div
                    key={caseItem.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] group"
                  >
                    {/* 封面缩略图 */}
                    <img
                      src={caseItem.coverImage}
                      alt={caseItem.title}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 cursor-pointer"
                      onClick={() => {
                        navigate(`/case/${caseItem.id}`);
                        onClose();
                      }}
                    />

                    {/* 标题 */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        navigate(`/case/${caseItem.id}`);
                        onClose();
                      }}
                    >
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {caseItem.title}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {caseItem.heatScore.toFixed(0)}° 热度
                      </p>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          navigate(`/case/${caseItem.id}`);
                          onClose();
                        }}
                        className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-accent hover:bg-accent-soft transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFromBubblePool(caseItem.id)}
                        className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* 底部 */}
            {poolCases.length > 0 && (
              <div className="p-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => {
                    // 批量查看（跳转到筛选后的列表）
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-md bg-accent text-white text-sm font-medium
                    hover:bg-accent-dark transition-colors"
                >
                  查看全部 ({poolCases.length})
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
