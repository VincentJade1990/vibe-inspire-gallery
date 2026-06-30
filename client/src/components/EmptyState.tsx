/**
 * 空状态组件
 * 用于展示无数据、无结果等状态
 */

import { motion } from 'framer-motion';
import { Inbox, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  /** 标题 */
  title?: string;
  /** 描述 */
  description?: string;
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;
  /** 刷新回调 */
  onRefresh?: () => void;
}

/**
 * 空状态展示组件
 */
export default function EmptyState({
  title = '暂无数据',
  description = '当前没有符合条件的内容',
  showRefresh = false,
  onRefresh,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-[var(--accent-soft)] flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-accent" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-xs">
        {description}
      </p>
      {showRefresh && onRefresh && (
        <button
          onClick={onRefresh}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-md
            bg-[var(--bg-secondary)] border border-[var(--border-color)]
            text-[var(--text-primary)] hover:border-accent hover:text-accent
            transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>重新加载</span>
        </button>
      )}
    </motion.div>
  );
}
