/**
 * 案例详情页
 * 展示案例完整信息，支持Prompt复制、点赞、评分、评论
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Send,
  Calendar,
  User,
  Flame,
} from 'lucide-react';
import type { CaseItem } from '@/types/case';
import { useInteractionStore } from '@/store/useInteractionStore';
import { fetchCaseById, fetchRecommendations } from '@/api/caseApi';
import {
  PLATFORM_NAMES,
  PLATFORM_COLORS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  formatRelativeTime,
  formatNumber,
} from '@/utils/filter';
import StarRating from '@/components/StarRating';
import CaseCard from '@/components/CaseCard';
import { DetailSkeleton } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';

/**
 * 案例详情页组件
 */
export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    isLiked,
    toggleLike,
    getRating,
    setRating,
    comments,
    addComment,
    markViewed,
  } = useInteractionStore();

  // 案例数据
  const [caseItem, setCaseItem] = useState<CaseItem | null>(null);
  // 推荐案例
  const [recommendations, setRecommendations] = useState<CaseItem[]>([]);
  // 加载状态
  const [loading, setLoading] = useState(true);
  // Prompt折叠状态
  const [promptExpanded, setPromptExpanded] = useState(false);
  // 评论输入
  const [commentText, setCommentText] = useState('');
  // Toast提示
  const [toast, setToast] = useState<string | null>(null);

  /**
   * 加载案例详情
   */
  const loadCaseDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchCaseById(id);
      setCaseItem(data);
      markViewed(id);

      // 加载推荐
      const recs = await fetchRecommendations(id, 4);
      setRecommendations(recs);
    } catch (err) {
      console.error('加载案例详情失败:', err);
    } finally {
      setLoading(false);
    }
  }, [id, markViewed]);

  useEffect(() => {
    loadCaseDetail();
  }, [loadCaseDetail]);

  /**
   * 显示Toast
   */
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  /**
   * 复制Prompt
   */
  const handleCopyPrompt = useCallback(() => {
    if (caseItem) {
      navigator.clipboard.writeText(caseItem.prompt);
      showToast('Prompt 已复制到剪贴板');
    }
  }, [caseItem, showToast]);

  /**
   * 提交评论
   */
  const handleSubmitComment = useCallback(() => {
    if (!id || !commentText.trim()) return;
    addComment(id, commentText.trim());
    setCommentText('');
    showToast('评论已发布');
  }, [id, commentText, addComment, showToast]);

  // 加载中
  if (loading) {
    return <DetailSkeleton />;
  }

  // 未找到
  if (!caseItem) {
    return (
      <EmptyState
        title="案例不存在"
        description="该案例可能已被删除或ID有误"
        showRefresh
        onRefresh={() => navigate('/')}
      />
    );
  }

  const liked = isLiked(caseItem.id);
  const userRating = getRating(caseItem.id);
  const caseComments = comments[caseItem.id] || [];

  return (
    <div className="min-h-screen pb-20">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full
            bg-accent text-white text-sm font-medium shadow-lg"
        >
          {toast}
        </motion.div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 封面图 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden mb-6"
        >
          <img
            src={caseItem.coverImage}
            alt={caseItem.title}
            className="w-full h-64 sm:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2.5 py-1 text-xs font-medium rounded-full text-white"
                style={{ backgroundColor: PLATFORM_COLORS[caseItem.platform] }}
              >
                {PLATFORM_NAMES[caseItem.platform]}
              </span>
              {caseItem.sceneTags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-white/20 text-white backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 标题和元信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-4">
            {caseItem.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {caseItem.author || '匿名作者'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatRelativeTime(caseItem.publishTime)}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${DIFFICULTY_COLORS[caseItem.difficulty]}`}>
              {DIFFICULTY_LABELS[caseItem.difficulty]}
            </span>
            <span className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              {caseItem.heatScore.toFixed(0)}° 热度
            </span>
          </div>
        </motion.div>

        {/* 互动区 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]"
        >
          {/* 点赞 */}
          <button
            onClick={() => toggleLike(caseItem.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              liked
                ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-red-500' : ''}`} />
            <span className="font-medium">{liked ? '已点赞' : '点赞'}</span>
          </button>

          {/* 评分 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-secondary)]">评分:</span>
            <StarRating
              rating={userRating}
              onChange={(r) => setRating(caseItem.id, r)}
              size={22}
            />
          </div>
        </motion.div>

        {/* Prompt区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[var(--text-primary)]">生成 Prompt</h3>
            <button
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-light transition-colors"
            >
              <Copy className="w-4 h-4" />
              复制
            </button>
          </div>
          <div className="relative bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
            <pre
              className={`text-sm text-[var(--text-secondary)] font-mono whitespace-pre-wrap leading-relaxed ${
                promptExpanded ? '' : 'line-clamp-3'
              }`}
            >
              {caseItem.prompt}
            </pre>
            {caseItem.prompt.length > 100 && (
              <button
                onClick={() => setPromptExpanded(!promptExpanded)}
                className="mt-2 flex items-center gap-1 text-sm text-accent hover:text-accent-light transition-colors"
              >
                {promptExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    收起
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    展开
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* 原链接 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <a
            href={caseItem.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
              bg-[var(--bg-secondary)] border border-[var(--border-color)]
              text-[var(--text-primary)] hover:border-accent hover:text-accent
              transition-all duration-200"
          >
            <ExternalLink className="w-4 h-4" />
            <span>查看原帖</span>
          </a>
        </motion.div>

        {/* 描述 */}
        {caseItem.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <h3 className="font-bold text-[var(--text-primary)] mb-2">案例简介</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {caseItem.description}
            </p>
          </motion.div>
        )}

        {/* 评论区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <h3 className="font-bold text-[var(--text-primary)] mb-4">
            评论 ({caseComments.length})
          </h3>

          {/* 评论输入 */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
              placeholder="写下你的评论..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]
                text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]
                focus:outline-none focus:border-accent transition-colors"
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
              className="px-4 py-2.5 rounded-lg bg-accent text-white
                hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* 评论列表 */}
          <div className="space-y-3">
            {caseComments.map((text, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-accent">
                    灵感探索者 #{Math.floor(Math.random() * 999) + 1}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">刚刚</span>
                </div>
                <p className="text-sm text-[var(--text-primary)]">{text}</p>
              </motion.div>
            ))}
            {caseComments.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)] text-center py-4">
                暂无评论，来写第一条吧
              </p>
            )}
          </div>
        </motion.div>

        {/* 推荐案例 */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="font-bold text-[var(--text-primary)] mb-4">相关推荐</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <CaseCard key={rec.id} caseItem={rec} compact />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
