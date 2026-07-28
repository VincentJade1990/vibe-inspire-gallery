/**
 * 图片大图查看组件（Lightbox）
 *
 * 功能：
 * - 点击图片打开全屏遮罩
 * - 支持左右切换上一张/下一张
 * - ESC 关闭 / 点击遮罩关闭
 * - 适配深色/浅色主题（CSS 变量）
 */

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
}

export default function ImageLightbox({ images }: ImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  const openAt = useCallback((idx: number) => {
    setCurrentIdx(idx);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const prev = useCallback(() => {
    setCurrentIdx((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setCurrentIdx((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, close, prev, next]);

  if (images.length === 0) return null;

  return (
    <>
      {/* 图片网格 - 一行4张，方形裁剪 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => openAt(idx)}
            className="aspect-square rounded-xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:opacity-80 transition-opacity group"
          >
            <img
              src={img}
              alt={`项目图片 ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        ))}
      </div>

      {/* Lightbox 遮罩层 */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={close}
        >
          {/* 关闭按钮 */}
          <button
            onClick={close}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 上一张 */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 sm:left-6 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* 当前图片 */}
          <div
            className="max-w-[90vw] max-h-[85vh] px-12"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[currentIdx]}
              alt={`项目图片 ${currentIdx + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>

          {/* 下一张 */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* 计数器 */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 rounded-full text-white text-sm font-medium">
              {currentIdx + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
