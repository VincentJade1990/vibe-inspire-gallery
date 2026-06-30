/**
 * 404 页面
 * 当访问不存在的路由时显示
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft } from 'lucide-react';

/**
 * 404 页面组件
 */
export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {/* 图标 */}
        <div className="w-20 h-20 rounded-full bg-[var(--accent-soft)] flex items-center justify-center mx-auto mb-6">
          <Compass className="w-10 h-10 text-accent" />
        </div>

        {/* 错误码 */}
        <h1 className="text-6xl font-bold text-[var(--text-primary)] mb-2">404</h1>

        {/* 标题 */}
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
          页面不存在
        </h2>

        {/* 描述 */}
        <p className="text-[var(--text-secondary)] mb-8 max-w-sm mx-auto">
          你访问的页面可能已被删除、移动或从未存在过。
          返回首页继续探索 Vibe Coding 灵感吧。
        </p>

        {/* 返回按钮 */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
            bg-accent text-white font-medium
            hover:bg-accent-dark transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回首页
        </Link>
      </motion.div>
    </div>
  );
}
