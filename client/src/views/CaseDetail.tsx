/**
 * 案例详情页（重构版）
 *
 * 结构：
 * 1. 头部：返回入口 + 气泡（封面圆形）+ 标题 + 头像昵称 + 点亮/收藏/分享
 * 2. 项目信息模块（中英文标题）：标题、简介、标签、状态、商业模式、评分、图片
 * 3. 开发者信息模块（中英文标题）：开发者、主页、来源URL、产品链接
 * 4. 评论区（LocalStorage，保留现有功能）
 * 5. 相关推荐
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Share2,
  Bookmark,
  ArrowLeft,
  User,
  Calendar,
  Flame,
  Send,
  ExternalLink,
  Lock,
} from 'lucide-react';
import type { CaseItem } from '@/types/case';
import { useInteractionStore } from '@/store/useInteractionStore';
import { fetchCaseById, fetchRecommendations } from '@/api/caseApi';
import { PLATFORM_NAMES, formatRelativeTime } from '@/utils/filter';
import ImageLightbox from '@/components/ImageLightbox';
import RatingBubble from '@/components/RatingBubble';
import CaseCard from '@/components/CaseCard';
import { DetailSkeleton } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';

/* ========== 常量映射 ========== */

const PROJECT_STATUS_LABELS: Record<string, string> = {
  concept: '概念想法 Concept',
  prototype: '设计原型 Prototype',
  local_demo: '本地 Demo Local Demo',
  web_live: 'Web 上线 Web Live',
  mini_program: '小程序上线 Mini Program',
  app_development: 'App 开发中 App Development',
  app_live: 'App 已上线 App Live',
  commercial: '商业化运营 Commercial',
  archived: '已停止维护 Archived',
  offline: '已下线 Offline',
};

const BUSINESS_MODEL_LABELS: Record<string, string> = {
  free_open_source: '免费开源',
  subscription: '订阅制',
  one_time: '一次购买',
  ads: '广告',
  saas: 'SaaS收费',
  enterprise: '企业服务',
  none: '暂无商业化',
};

/* ========== 模块标题组件 ========== */

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-5 flex items-center gap-2">
      <span>{title}</span>
      <span className="text-[var(--border-color)] normal-case font-normal tracking-normal">{subtitle}</span>
    </h2>
  );
}

/* ========== 信息卡片组件 ========== */

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">{label}</h3>
      {children}
    </div>
  );
}

/* ========== 标签展示组件 ========== */

function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="px-3 py-1 rounded-full text-sm bg-[var(--accent-soft)] text-[var(--accent-color)]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

/* ========== 主页面组件 ========== */

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    isLiked,
    toggleLike,
    isInBubblePool,
    addToBubblePool,
    removeFromBubblePool,
    comments,
    addComment,
    markViewed,
  } = useInteractionStore();

  const [caseItem, setCaseItem] = useState<CaseItem | null>(null);
  const [recommendations, setRecommendations] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  /* ---- 加载数据 ---- */
  const loadCaseDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchCaseById(id);
      setCaseItem(data);
      markViewed(id);

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

  /* ---- Toast ---- */
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  /* ---- 分享 ---- */
  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/case/${id}`;
    if (navigator.share) {
      navigator.share({ title: caseItem?.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }, [id, caseItem?.title]);

  /* ---- 评论提交 ---- */
  const handleSubmitComment = useCallback(() => {
    if (!id || !commentText.trim()) return;
    addComment(id, commentText.trim());
    setCommentText('');
    showToast('评论已发布');
  }, [id, commentText, addComment, showToast]);

  /* ---- 加载/空状态 ---- */
  if (loading) return <DetailSkeleton />;
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
  const inPool = isInBubblePool(caseItem.id);
  const caseComments = comments[caseItem.id] || [];

  // 合并封面和演示图片（去重）
  const allImages = caseItem.coverImage
    ? [caseItem.coverImage, ...(caseItem.demoImages || []).filter((u) => u !== caseItem.coverImage)]
    : caseItem.demoImages || [];

  // 评分（暂用 avgRating 或 heatScore/10）
  const rating = caseItem.avgRating || caseItem.heatScore / 10;

  // 标签（优先用原始 tags，否则用 sceneTags）
  const displayTags = caseItem.tags && caseItem.tags.length > 0 ? caseItem.tags : caseItem.sceneTags;

  return (
    <div className="min-h-screen pb-20">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[var(--accent-color)] text-white text-sm font-medium shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* ==================== 头部区域 ==================== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* 返回入口 */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回</span>
          </button>

          {/* 气泡（圆形封面）+ 点亮动效 */}
          <div className="flex flex-col items-center">
            <div
              className={`
                relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden
                transition-all duration-700 ease-out
                ${liked
                  ? 'scale-105 brightness-110 saturate-110 shadow-[0_0_60px_rgba(56,189,248,0.25)]'
                  : 'scale-100 brightness-75 saturate-75'
                }
              `}
            >
              {caseItem.coverImage ? (
                <img
                  src={caseItem.coverImage}
                  alt={caseItem.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--border-color)]">
                  <User className="w-16 h-16" />
                </div>
              )}
              {/* 未点亮时的暗色遮罩 */}
              {!liked && (
                <div className="absolute inset-0 bg-black/30" />
              )}
              {/* 点亮光晕 */}
              {liked && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-400/10 via-transparent to-purple-400/10 pointer-events-none" />
              )}
            </div>

            {/* 标题 */}
            <h1 className="text-2xl sm:text-3xl font-bold mt-6 text-center text-[var(--text-primary)]">
              {caseItem.title}
            </h1>

            {/* 头像 + 昵称（同一行） */}
            {caseItem.author && (
              <div className="flex items-center gap-2 mt-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-medium text-white">
                  {caseItem.author[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="text-sm text-[var(--text-secondary)]">@{caseItem.author}</span>
              </div>
            )}

            {/* 平台 + 发布时间 + 热度 */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--text-secondary)] mt-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatRelativeTime(caseItem.publishTime)}
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                {caseItem.heatScore.toFixed(0)}° 热度
              </span>
            </div>

            {/* 三个主按钮：点亮 / 收藏 / 分享 */}
            <div className="flex items-center gap-3 mt-6">
              {/* 点亮 */}
              <button
                onClick={() => { toggleLike(caseItem.id); showToast(isLiked(caseItem.id) ? '取消点亮' : '已点亮'); }}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300
                  ${liked
                    ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-red-500' : ''}`} />
                <span className="text-sm font-medium">{liked ? '已点亮' : '点亮'}</span>
              </button>

              {/* 收藏（气泡池） */}
              <button
                onClick={() => {
                  if (inPool) {
                    removeFromBubblePool(caseItem.id);
                    showToast('已移出气泡池');
                  } else {
                    addToBubblePool(caseItem.id);
                    showToast('已加入气泡池');
                  }
                }}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300
                  ${inPool
                    ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <Bookmark className={`w-4 h-4 ${inPool ? 'fill-yellow-500' : ''}`} />
                <span className="text-sm font-medium">{inPool ? '已收藏' : '收藏'}</span>
              </button>

              {/* 分享 */}
              <button
                onClick={handleShare}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300
                  ${shareCopied
                    ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">{shareCopied ? '已复制' : '分享'}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* ==================== 模块一：项目信息 ==================== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10"
        >
          <SectionTitle title="项目信息" subtitle="Project Info" />

          <div className="space-y-4">
            {/* 项目标题 */}
            <InfoCard label="项目标题">
              <p className="text-lg font-semibold text-[var(--text-primary)]">{caseItem.title}</p>
            </InfoCard>

            {/* 项目简介 */}
            {caseItem.description && (
              <InfoCard label="项目简介">
                <p className="text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                  {caseItem.description}
                </p>
              </InfoCard>
            )}

            {/* 项目标签 */}
            {displayTags.length > 0 && (
              <InfoCard label="项目标签">
                <TagList tags={displayTags} />
              </InfoCard>
            )}

            {/* 项目状态 + 商业模式 双栏 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {caseItem.projectStatus && (
                <InfoCard label="项目状态">
                  <span className="inline-block px-3 py-1.5 rounded-lg text-sm bg-[var(--accent-soft)] text-[var(--accent-color)]">
                    {PROJECT_STATUS_LABELS[caseItem.projectStatus] || caseItem.projectStatus}
                  </span>
                </InfoCard>
              )}
              {caseItem.businessModel && (
                <InfoCard label="商业模式">
                  <span className="inline-block px-3 py-1.5 rounded-lg text-sm bg-green-500/10 text-green-500">
                    {BUSINESS_MODEL_LABELS[caseItem.businessModel] || caseItem.businessModel}
                  </span>
                </InfoCard>
              )}
            </div>

            {/* 项目评分 - 5气泡10分制 */}
            <InfoCard label="项目评分">
              <RatingBubble rating={rating} />
            </InfoCard>

            {/* 项目图片 */}
            {allImages.length > 0 && (
              <InfoCard label="项目图片">
                <ImageLightbox images={allImages} />
              </InfoCard>
            )}
          </div>
        </motion.section>

        {/* ==================== 模块二：开发者信息 ==================== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10"
        >
          <SectionTitle title="开发者信息" subtitle="Developer Info" />

          <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-4">
            {/* 开发者 */}
            {caseItem.author && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--text-secondary)] w-24 flex-shrink-0">开发者</span>
                <span className="text-[var(--text-primary)]">{caseItem.author}</span>
              </div>
            )}

            {/* 开发者主页 */}
            {caseItem.authorUrl && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--text-secondary)] w-24 flex-shrink-0">开发者主页</span>
                <a
                  href={caseItem.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-color)] hover:text-[var(--accent-light)] transition text-sm truncate flex items-center gap-1"
                >
                  {caseItem.authorUrl}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            )}

            {/* 来源URL */}
            {caseItem.originalUrl && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--text-secondary)] w-24 flex-shrink-0">来源URL</span>
                <a
                  href={caseItem.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-color)] hover:text-[var(--accent-light)] transition text-sm truncate flex items-center gap-1"
                >
                  {PLATFORM_NAMES[caseItem.platform] || caseItem.platform} -
                  {caseItem.originalUrl}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            )}

            {/* 产品链接 */}
            {caseItem.productUrl && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--text-secondary)] w-24 flex-shrink-0">产品链接</span>
                <a
                  href={caseItem.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-color)] hover:text-[var(--accent-light)] transition text-sm truncate flex items-center gap-1"
                >
                  {caseItem.productUrl}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            )}
          </div>
        </motion.section>

        {/* ==================== 模块三：Prompt（如存在） ==================== */}
        {caseItem.prompt && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10"
          >
            <SectionTitle title="生成 Prompt" subtitle="Prompt" />
            <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <pre className="text-sm text-[var(--text-secondary)] font-mono whitespace-pre-wrap leading-relaxed">
                {caseItem.prompt}
              </pre>
            </div>
          </motion.section>
        )}

        {/* ==================== 评论区 ==================== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10"
        >
          <SectionTitle title="评论" subtitle={`Comments (${caseComments.length})`} />

          {/* 登录提示 */}
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-color)] text-sm">
            <Lock className="w-4 h-4" />
            <span>登录后可同步评论到云端（当前评论仅保存在本地）</span>
          </div>

          {/* 评论输入 */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
              placeholder="写下你的评论..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-color)] transition-colors"
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
              className="px-4 py-2.5 rounded-lg bg-[var(--accent-color)] text-white hover:bg-[var(--accent-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                  <span className="text-sm font-medium text-[var(--accent-color)]">
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
        </motion.section>

        {/* ==================== 相关推荐 ==================== */}
        {recommendations.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-10"
          >
            <SectionTitle title="相关推荐" subtitle="Recommendations" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <CaseCard key={rec.id} caseItem={rec} compact />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
