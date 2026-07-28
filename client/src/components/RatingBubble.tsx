/**
 * 气泡评分组件
 *
 * 参考豆瓣评分机制：
 * - 5 个气泡，10 分制（每个气泡代表 2 分）
 * - 支持半气泡（1 分）
 * - 视觉：暗色气泡 → 亮色气泡，带轻微缩放动效
 */

interface RatingBubbleProps {
  /** 评分值（0-10） */
  rating: number;
}

export default function RatingBubble({ rating }: RatingBubbleProps) {
  const clampedRating = Math.max(0, Math.min(10, rating));

  // 计算每个气泡的填充比例（0, 0.5, 1）
  const bubbleStates: number[] = [];
  for (let i = 0; i < 5; i++) {
    const bubbleValue = clampedRating - i * 2;
    if (bubbleValue >= 2) {
      bubbleStates.push(1);
    } else if (bubbleValue >= 1) {
      bubbleStates.push(0.5);
    } else {
      bubbleStates.push(0);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* 5 个气泡 */}
      <div className="flex items-center gap-1.5">
        {bubbleStates.map((state, idx) => (
          <div
            key={idx}
            className={`
              w-6 h-6 rounded-full transition-all duration-500 ease-out
              ${state === 1
                ? 'bg-gradient-to-br from-purple-400 to-blue-400 scale-100 shadow-[0_0_12px_rgba(142,78,215,0.3)]'
                : state === 0.5
                ? 'bg-gradient-to-r from-purple-400/50 to-slate-600 scale-95'
                : 'bg-slate-600/40 scale-90'
              }
            `}
          />
        ))}
      </div>

      {/* 分数文字 */}
      <span className="text-lg font-bold text-[var(--text-primary)] ml-2">
        {clampedRating.toFixed(1)}
      </span>
      <span className="text-sm text-[var(--text-secondary)]">/ 10</span>
    </div>
  );
}
