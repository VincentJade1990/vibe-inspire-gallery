/**
 * 星级评分组件
 * 支持1-5星评分，支持半星精度，hover预览
 */

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  /** 当前评分值（0-5） */
  rating: number;
  /** 评分变化回调 */
  onChange?: (rating: number) => void;
  /** 是否只读 */
  readonly?: boolean;
  /** 星星大小 */
  size?: number;
}

/**
 * 星级评分组件
 */
export default function StarRating({
  rating,
  onChange,
  readonly = false,
  size = 20,
}: StarRatingProps) {
  // hover时的预览评分
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= displayRating;
        const isHalf = !isFilled && starValue - 0.5 <= displayRating;

        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            className={`relative transition-transform duration-150 ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
            onMouseEnter={() => !readonly && setHoverRating(starValue)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            onClick={() => !readonly && onChange?.(starValue)}
          >
            {/* 背景星（空星） */}
            <Star
              size={size}
              className="text-[var(--border-color)]"
              strokeWidth={1.5}
            />
            {/* 填充星 */}
            {(isFilled || isHalf) && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: isHalf ? '50%' : '100%' }}
              >
                <Star
                  size={size}
                  className="text-yellow-400 fill-yellow-400"
                  strokeWidth={1.5}
                />
              </div>
            )}
          </button>
        );
      })}
      {rating > 0 && (
        <span className="ml-1 text-sm text-[var(--text-secondary)]">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
