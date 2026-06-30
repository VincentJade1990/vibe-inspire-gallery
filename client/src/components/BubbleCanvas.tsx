/**
 * 无限画布悬浮气泡交互组件
 * 基于 Framer Motion + 自定义物理引擎实现气泡漂浮、碰撞、破碎粒子动效
 *
 * 核心功能：
 * - 气泡分层（S精品/A普通/B简易/月度优质），按热度自动分级
 * - 单击破碎：玻璃碎裂粒子消散 + 预览弹窗
 * - 长按拖拽：吸入右下角气泡池，气泡不破碎永久留存
 * - 破碎气泡延时重生，画布持续有内容
 * - 画布拖拽平移 + 滚轮缩放
 * - 移动端触摸滑动适配
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Copy, ExternalLink } from 'lucide-react';
import type { CaseItem } from '@/types/case';
import { useInteractionStore } from '@/store/useInteractionStore';
import { PLATFORM_NAMES, DIFFICULTY_LABELS } from '@/utils/filter';

/** 组件 Props */
interface BubbleCanvasProps {
  /** 案例列表 */
  cases: CaseItem[];
}

/** 气泡层级 */
type BubbleTier = 'S' | 'A' | 'B' | 'monthly';

/** 单个气泡状态 */
interface BubbleState {
  /** 案例ID */
  id: string;
  /** 世界坐标 X */
  x: number;
  /** 世界坐标 Y */
  y: number;
  /** X轴速度 */
  vx: number;
  /** Y轴速度 */
  vy: number;
  /** 气泡直径 */
  size: number;
  /** 层级 */
  tier: BubbleTier;
  /** 关联案例 */
  caseItem: CaseItem;
  /** 是否已破碎（正在播放破碎动画） */
  isBroken: boolean;
  /** 破碎后重生时间戳 */
  rebornAt: number;
  /** 当前缩放比例（呼吸动画） */
  breatheScale: number;
}

/** 粒子状态 */
interface ParticleState {
  /** 唯一ID */
  id: string;
  /** 世界坐标 X */
  x: number;
  /** 世界坐标 Y */
  y: number;
  /** 飞散速度 X */
  vx: number;
  /** 飞散速度 Y */
  vy: number;
  /** 粒子大小 */
  size: number;
  /** 颜色 */
  color: string;
  /** 透明度 */
  opacity: number;
  /** 旋转角度 */
  rotation: number;
  /** 旋转速度 */
  rotationSpeed: number;
}

/** 画布世界尺寸 */
const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1800;

/** 气泡层级配置 */
const TIER_CONFIG: Record<BubbleTier, { minSize: number; maxSize: number; color: string; glowColor: string; opacity: number }> = {
  monthly: { minSize: 180, maxSize: 220, color: 'rgba(14,165,233,0.25)', glowColor: 'rgba(56,189,248,0.6)', opacity: 0.9 },
  S: { minSize: 120, maxSize: 160, color: 'rgba(14,165,233,0.2)', glowColor: 'rgba(56,189,248,0.5)', opacity: 0.85 },
  A: { minSize: 80, maxSize: 110, color: 'rgba(255,255,255,0.6)', glowColor: 'rgba(148,163,184,0.2)', opacity: 0.75 },
  B: { minSize: 50, maxSize: 70, color: 'rgba(226,232,240,0.5)', glowColor: 'rgba(203,213,225,0.15)', opacity: 0.6 },
};

/**
 * 判断气泡层级
 * @param caseItem 案例数据
 * @param isMonthly 是否为月度优质
 */
function getTier(caseItem: CaseItem, isMonthly: boolean): BubbleTier {
  if (isMonthly) return 'monthly';
  if (caseItem.heatScore >= 85) return 'S';
  if (caseItem.heatScore >= 60) return 'A';
  return 'B';
}

/**
 * 生成随机速度
 */
function randomVelocity(base: number = 0.3): number {
  return (Math.random() - 0.5) * base * 2;
}

/**
 * 生成破碎粒子
 */
function generateParticles(x: number, y: number, size: number, color: string): ParticleState[] {
  const count = 12 + Math.floor(Math.random() * 8);
  const particles: ParticleState[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
      id: `p-${Date.now()}-${i}`,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 6,
      color,
      opacity: 1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 20,
    });
  }
  return particles;
}

/**
 * 初始化气泡位置（力导向布局）
 */
function initBubbles(cases: CaseItem[]): BubbleState[] {
  if (cases.length === 0) return [];

  // 找出月度优质案例（热度最高）
  const monthlyCase = cases.reduce((max, c) => (c.heatScore > max.heatScore ? c : max), cases[0]);

  const bubbles: BubbleState[] = cases.map((caseItem, index) => {
    const isMonthly = caseItem.id === monthlyCase.id;
    const tier = getTier(caseItem, isMonthly);
    const config = TIER_CONFIG[tier];
    const size = config.minSize + Math.random() * (config.maxSize - config.minSize);

    let x: number;
    let y: number;

    if (isMonthly) {
      // 月度优质固定在画布中央附近（略微随机偏移）
      x = WORLD_WIDTH / 2 + (Math.random() - 0.5) * 100;
      y = WORLD_HEIGHT / 2 + (Math.random() - 0.5) * 100;
    } else {
      // 其他气泡围绕中心螺旋分布
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 黄金角
      const spiralRadius = 200 + Math.sqrt(index) * 60;
      const angle = index * goldenAngle;
      x = WORLD_WIDTH / 2 + Math.cos(angle) * spiralRadius + (Math.random() - 0.5) * 80;
      y = WORLD_HEIGHT / 2 + Math.sin(angle) * spiralRadius + (Math.random() - 0.5) * 80;
    }

    // 限制在世界范围内
    x = Math.max(size / 2, Math.min(WORLD_WIDTH - size / 2, x));
    y = Math.max(size / 2, Math.min(WORLD_HEIGHT - size / 2, y));

    return {
      id: caseItem.id,
      x,
      y,
      vx: randomVelocity(0.4),
      vy: randomVelocity(0.4),
      size,
      tier,
      caseItem,
      isBroken: false,
      rebornAt: 0,
      breatheScale: 1,
    };
  });

  return bubbles;
}

/**
 * 气泡画布组件
 */
export default function BubbleCanvas({ cases }: BubbleCanvasProps) {
  const { addToBubblePool, isInBubblePool, toggleLike, isLiked } = useInteractionStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const bubblesRef = useRef<BubbleState[]>([]);
  const particlesRef = useRef<ParticleState[]>([]);
  const lastTimeRef = useRef<number>(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingBubbleRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });

  // 视图状态
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const canvasDragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  // 气泡状态（用于触发 React 重渲染）
  const [bubbles, setBubbles] = useState<BubbleState[]>([]);
  const [particles, setParticles] = useState<ParticleState[]>([]);
  const [previewCase, setPreviewCase] = useState<CaseItem | null>(null);
  const [absorbingId, setAbsorbingId] = useState<string | null>(null);

  /**
   * 初始化气泡
   */
  useEffect(() => {
    const newBubbles = initBubbles(cases);
    bubblesRef.current = newBubbles;
    setBubbles(newBubbles);

    // 初始视图居中
    const container = containerRef.current;
    if (container) {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      setOffset({
        x: (cw - WORLD_WIDTH) / 2,
        y: (ch - WORLD_HEIGHT) / 2,
      });
    }
  }, [cases]);

  /**
   * 物理引擎：气泡漂浮 + 碰撞检测 + 呼吸动画
   */
  const physicsLoop = useCallback((timestamp: number) => {
    const dt = Math.min((timestamp - lastTimeRef.current) / 16.67, 3); // 归一化到 60fps，限制最大步长
    lastTimeRef.current = timestamp;

    const currentBubbles = bubblesRef.current;
    const currentParticles = particlesRef.current;
    let hasChange = false;

    // 更新气泡物理
    for (let i = 0; i < currentBubbles.length; i++) {
      const b = currentBubbles[i];
      if (b.isBroken) continue;
      if (isInBubblePool(b.id)) continue; // 已收纳的气泡不参与物理

      // 缓慢随机漂移
      b.vx += randomVelocity(0.02) * dt;
      b.vy += randomVelocity(0.02) * dt;

      // 速度阻尼
      b.vx *= 0.995;
      b.vy *= 0.995;

      // 限制最大速度
      const maxSpeed = b.tier === 'monthly' ? 0.3 : b.tier === 'S' ? 0.5 : 0.8;
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (speed > maxSpeed) {
        b.vx = (b.vx / speed) * maxSpeed;
        b.vy = (b.vy / speed) * maxSpeed;
      }

      // 更新位置
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // 边界反弹
      const half = b.size / 2;
      if (b.x < half) { b.x = half; b.vx *= -0.8; }
      if (b.x > WORLD_WIDTH - half) { b.x = WORLD_WIDTH - half; b.vx *= -0.8; }
      if (b.y < half) { b.y = half; b.vy *= -0.8; }
      if (b.y > WORLD_HEIGHT - half) { b.y = WORLD_HEIGHT - half; b.vy *= -0.8; }

      // 呼吸动画（S和月度优质）
      if (b.tier === 'S' || b.tier === 'monthly') {
        const breatheSpeed = b.tier === 'monthly' ? 0.0015 : 0.002;
        b.breatheScale = 1 + Math.sin(timestamp * breatheSpeed) * 0.05;
      }

      hasChange = true;
    }

    // 弹性碰撞检测（简化版，避免重叠）
    for (let i = 0; i < currentBubbles.length; i++) {
      const b1 = currentBubbles[i];
      if (b1.isBroken || isInBubblePool(b1.id)) continue;

      for (let j = i + 1; j < currentBubbles.length; j++) {
        const b2 = currentBubbles[j];
        if (b2.isBroken || isInBubblePool(b2.id)) continue;

        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (b1.size + b2.size) / 2 + 8; // +8px 间距

        if (dist < minDist && dist > 0) {
          // 计算排斥力
          const force = (minDist - dist) * 0.015 * dt;
          const nx = dx / dist;
          const ny = dy / dist;

          // 质量近似为面积，但简化处理：大质量移动慢
          const m1 = b1.size * b1.size;
          const m2 = b2.size * b2.size;
          const totalM = m1 + m2;

          b1.vx -= nx * force * (m2 / totalM);
          b1.vy -= ny * force * (m2 / totalM);
          b2.vx += nx * force * (m1 / totalM);
          b2.vy += ny * force * (m1 / totalM);

          hasChange = true;
        }
      }
    }

    // 更新粒子
    for (let i = currentParticles.length - 1; i >= 0; i--) {
      const p = currentParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.vy += 0.05 * dt; // 轻微重力
      p.rotation += p.rotationSpeed * dt;
      p.opacity -= 0.02 * dt;

      if (p.opacity <= 0) {
        currentParticles.splice(i, 1);
        hasChange = true;
      } else {
        hasChange = true;
      }
    }

    if (hasChange) {
      setBubbles([...currentBubbles]);
      setParticles([...currentParticles]);
    }

    rafRef.current = requestAnimationFrame(physicsLoop);
  }, [isInBubblePool]);

  /**
   * 启动/停止物理循环
   */
  useEffect(() => {
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(physicsLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [physicsLoop]);

  /**
   * 重生已破碎的气泡
   */
  const scheduleReborn = useCallback((bubbleId: string) => {
    const delay = 3000 + Math.random() * 4000; // 3-7秒延时
    setTimeout(() => {
      bubblesRef.current = bubblesRef.current.map((b) => {
        if (b.id === bubbleId) {
          // 从画布边缘重新生成
          const edge = Math.floor(Math.random() * 4);
          let nx = b.x, ny = b.y;
          const half = b.size / 2;
          switch (edge) {
            case 0: nx = half; ny = Math.random() * WORLD_HEIGHT; break;
            case 1: nx = WORLD_WIDTH - half; ny = Math.random() * WORLD_HEIGHT; break;
            case 2: nx = Math.random() * WORLD_WIDTH; ny = half; break;
            case 3: nx = Math.random() * WORLD_WIDTH; ny = WORLD_HEIGHT - half; break;
          }
          return { ...b, x: nx, y: ny, vx: randomVelocity(1), vy: randomVelocity(1), isBroken: false };
        }
        return b;
      });
      setBubbles([...bubblesRef.current]);
    }, delay);
  }, []);

  /**
   * 处理气泡单击（破碎效果）
   */
  const handleBubbleClick = useCallback((bubble: BubbleState) => {
    if (isDraggingBubbleRef.current) return;
    if (bubble.isBroken) return;
    if (isInBubblePool(bubble.id)) return;

    // 生成粒子
    const config = TIER_CONFIG[bubble.tier];
    const newParticles = generateParticles(bubble.x, bubble.y, bubble.size, config.glowColor);
    particlesRef.current = [...particlesRef.current, ...newParticles];
    setParticles([...particlesRef.current]);

    // 标记破碎
    bubblesRef.current = bubblesRef.current.map((b) =>
      b.id === bubble.id ? { ...b, isBroken: true } : b
    );
    setBubbles([...bubblesRef.current]);

    // 显示预览弹窗
    setPreviewCase(bubble.caseItem);

    // 延时重生
    scheduleReborn(bubble.id);
  }, [isInBubblePool, scheduleReborn]);

  /**
   * 处理长按开始
   */
  const handlePressStart = useCallback((bubbleId: string, clientX: number, clientY: number) => {
    isDraggingBubbleRef.current = false;
    dragStartPosRef.current = { x: clientX, y: clientY };

    longPressTimerRef.current = setTimeout(() => {
      // 长按触发：吸入气泡池
      setAbsorbingId(bubbleId);
      addToBubblePool(bubbleId);

      // 播放吸入动画后清除状态
      setTimeout(() => {
        setAbsorbingId(null);
      }, 600);
    }, 600);
  }, [addToBubblePool]);

  /**
   * 处理按压结束
   */
  const handlePressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  /**
   * 处理鼠标/触摸移动（检测拖拽阈值）
   */
  const handlePressMove = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - dragStartPosRef.current.x;
    const dy = clientY - dragStartPosRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 8) {
      isDraggingBubbleRef.current = true;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  }, []);

  // ==================== 画布拖拽与缩放 ====================

  /**
   * 画布拖拽开始（鼠标）
   */
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-bubble]')) return;
    setIsCanvasDragging(true);
    canvasDragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  }, [offset]);

  /**
   * 画布拖拽移动（鼠标）
   */
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isCanvasDragging) {
      setOffset({
        x: canvasDragStartRef.current.offsetX + (e.clientX - canvasDragStartRef.current.x),
        y: canvasDragStartRef.current.offsetY + (e.clientY - canvasDragStartRef.current.y),
      });
    }
  }, [isCanvasDragging]);

  /**
   * 画布拖拽结束（鼠标）
   */
  const handleCanvasMouseUp = useCallback(() => {
    setIsCanvasDragging(false);
  }, []);

  /**
   * 滚轮缩放
   */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    setScale((prev) => Math.max(0.3, Math.min(4, prev * delta)));
  }, []);

  /**
   * 触摸事件：画布拖拽 + 气泡交互
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const target = e.target as HTMLElement;
    const bubbleEl = target.closest('[data-bubble]') as HTMLElement | null;

    if (bubbleEl) {
      const bubbleId = bubbleEl.dataset.bubbleId!;
      handlePressStart(bubbleId, touch.clientX, touch.clientY);
    } else {
      // 画布拖拽
      setIsCanvasDragging(true);
      canvasDragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        offsetX: offset.x,
        offsetY: offset.y,
      };
    }
  }, [offset, handlePressStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    handlePressMove(touch.clientX, touch.clientY);

    if (isCanvasDragging) {
      setOffset({
        x: canvasDragStartRef.current.offsetX + (touch.clientX - canvasDragStartRef.current.x),
        y: canvasDragStartRef.current.offsetY + (touch.clientY - canvasDragStartRef.current.y),
      });
    }
  }, [isCanvasDragging, handlePressMove]);

  const handleTouchEnd = useCallback(() => {
    handlePressEnd();
    setIsCanvasDragging(false);
  }, [handlePressEnd]);

  /**
   * 复制 Prompt
   */
  const handleCopyPrompt = useCallback((prompt: string) => {
    navigator.clipboard.writeText(prompt);
  }, []);

  /**
   * 世界坐标转屏幕坐标（用于渲染粒子）
   */
  const worldToScreen = useCallback((wx: number, wy: number) => {
    return {
      x: wx * scale + offset.x,
      y: wy * scale + offset.y,
    };
  }, [scale, offset]);

  // 计算屏幕上的粒子位置
  const screenParticles = useMemo(() => {
    return particles.map((p) => ({
      ...p,
      ...worldToScreen(p.x, p.y),
    }));
  }, [particles, worldToScreen]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[70vh] overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] select-none touch-none"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      {/* 背景网格 */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)`,
          backgroundSize: `${100 * scale}px ${100 * scale}px`,
          transform: `translate(${offset.x % (100 * scale)}px, ${offset.y % (100 * scale)}px)`,
        }}
      />

      {/* 世界变换层 */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {/* 气泡 */}
        <AnimatePresence>
          {bubbles.map((bubble) => {
            if (bubble.isBroken) return null;
            const inPool = isInBubblePool(bubble.id);
            const isAbsorbing = absorbingId === bubble.id;
            const config = TIER_CONFIG[bubble.tier];
            const actualSize = bubble.size * (bubble.tier === 'S' || bubble.tier === 'monthly' ? bubble.breatheScale : 1);

            return (
              <motion.div
                key={bubble.id}
                data-bubble
                data-bubble-id={bubble.id}
                layout
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: inPool ? 0 : 1,
                  scale: inPool ? 0.3 : isAbsorbing ? 0.1 : 1,
                  x: bubble.x - actualSize / 2,
                  y: bubble.y - actualSize / 2,
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  opacity: { duration: 0.3 },
                  scale: { type: 'spring', stiffness: 300, damping: 25 },
                  x: { duration: 0 },
                  y: { duration: 0 },
                }}
                className="absolute rounded-full flex flex-col items-center justify-center cursor-pointer
                  select-none"
                style={{
                  width: actualSize,
                  height: actualSize,
                  background: config.color,
                  boxShadow: bubble.tier === 'S' || bubble.tier === 'monthly'
                    ? `0 0 ${bubble.tier === 'monthly' ? 50 : 30}px ${config.glowColor}, inset 0 0 20px rgba(255,255,255,0.15)`
                    : `0 2px 8px rgba(0,0,0,0.08)`,
                  border: bubble.tier === 'A' || bubble.tier === 'B'
                    ? '1px solid var(--border-color)'
                    : `1px solid ${config.glowColor}`,
                  backdropFilter: 'blur(4px)',
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handlePressStart(bubble.id, e.clientX, e.clientY);
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  handlePressEnd();
                  if (!isDraggingBubbleRef.current && !isInBubblePool(bubble.id)) {
                    handleBubbleClick(bubble);
                  }
                }}
                onMouseMove={(e) => {
                  handlePressMove(e.clientX, e.clientY);
                }}
                onMouseLeave={handlePressEnd}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* 封面缩略图（大泡泡显示） */}
                {(bubble.tier === 'S' || bubble.tier === 'monthly') && (
                  <img
                    src={bubble.caseItem.coverImage}
                    alt=""
                    className="absolute inset-1 rounded-full object-cover opacity-40 pointer-events-none"
                    draggable={false}
                  />
                )}

                {/* 内容 */}
                <div className="relative z-10 text-center px-1.5 pointer-events-none">
                  <span className={`text-[10px] font-bold leading-tight ${
                    bubble.tier === 'S' || bubble.tier === 'monthly'
                      ? 'text-white drop-shadow-md'
                      : 'text-[var(--text-primary)]'
                  }`}>
                    {bubble.caseItem.title.slice(0, bubble.tier === 'monthly' ? 8 : bubble.tier === 'S' ? 5 : 3)}
                  </span>
                  <span className={`block text-[9px] mt-0.5 ${
                    bubble.tier === 'S' || bubble.tier === 'monthly'
                      ? 'text-white/70'
                      : 'text-[var(--text-secondary)]'
                  }`}>
                    {PLATFORM_NAMES[bubble.caseItem.platform]}
                  </span>
                </div>

                {/* 月度优质标识 */}
                {bubble.tier === 'monthly' && (
                  <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-accent text-white text-[9px] font-bold shadow-lg">
                    精选
                  </div>
                )}

                {/* S级发光环 */}
                {(bubble.tier === 'S' || bubble.tier === 'monthly') && (
                  <motion.div
                    className="absolute inset-[-4px] rounded-full pointer-events-none"
                    style={{
                      border: `2px solid ${config.glowColor}`,
                    }}
                    animate={{
                      opacity: [0.3, 0.7, 0.3],
                      scale: [1, 1.08, 1],
                    }}
                    transition={{
                      duration: bubble.tier === 'monthly' ? 2.5 : 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 粒子层（屏幕坐标系，不受世界变换影响） */}
      <AnimatePresence>
        {screenParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 1, rotate: p.rotation }}
            animate={{ opacity: p.opacity, scale: 0.2, rotate: p.rotation + p.rotationSpeed * 10 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0 }}
            className="absolute pointer-events-none"
            style={{
              left: p.x,
              top: p.y,
              width: p.size * scale,
              height: p.size * scale,
              background: p.color,
              borderRadius: '30%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </AnimatePresence>

      {/* 缩放控制 */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setScale((s) => Math.min(4, s + 0.25))}
          className="w-9 h-9 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)]
            flex items-center justify-center text-[var(--text-primary)] hover:border-accent shadow-md"
        >
          +
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setScale((s) => Math.max(0.3, s - 0.25))}
          className="w-9 h-9 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)]
            flex items-center justify-center text-[var(--text-primary)] hover:border-accent shadow-md"
        >
          -
        </motion.button>
      </div>

      {/* 缩放比例显示 */}
      <div className="absolute top-3 right-3 text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)]/80
        px-2 py-1 rounded-md backdrop-blur-sm z-10">
        {(scale * 100).toFixed(0)}%
      </div>

      {/* 操作提示 */}
      <div className="absolute bottom-4 left-4 text-[10px] text-[var(--text-secondary)] bg-[var(--bg-secondary)]/80
        px-3 py-2 rounded-lg backdrop-blur-sm z-10 space-y-0.5">
        <p>单击气泡：预览详情</p>
        <p>长按气泡：收纳至气泡池</p>
        <p>拖拽空白处：平移画布</p>
        <p>滚轮：缩放画布</p>
      </div>

      {/* 预览弹窗 */}
      <AnimatePresence>
        {previewCase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setPreviewCase(null)}
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="w-96 max-w-[92vw] card-base rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 封面 */}
              <div className="relative h-44">
                <img
                  src={previewCase.coverImage}
                  alt={previewCase.title}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <button
                  onClick={() => setPreviewCase(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 right-3">
                  <h4 className="font-bold text-white text-lg drop-shadow-md">{previewCase.title}</h4>
                  <p className="text-xs text-white/80 mt-0.5">{PLATFORM_NAMES[previewCase.platform]} · {DIFFICULTY_LABELS[previewCase.difficulty]}</p>
                </div>
              </div>

              {/* 内容 */}
              <div className="p-4 space-y-3">
                {/* 标签 */}
                <div className="flex flex-wrap gap-1.5">
                  {previewCase.sceneTags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>

                {/* Prompt */}
                <div className="bg-[var(--bg-primary)] rounded-lg p-3">
                  <p className="text-xs text-[var(--text-secondary)] font-medium mb-1">生成 Prompt</p>
                  <p className="text-xs text-[var(--text-primary)] line-clamp-3 leading-relaxed">
                    {previewCase.prompt}
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleLike(previewCase.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isLiked(previewCase.id)
                        ? 'text-red-500 bg-red-50 dark:bg-red-950/30'
                        : 'text-[var(--text-secondary)] bg-[var(--bg-primary)] hover:bg-[var(--accent-soft)]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked(previewCase.id) ? 'fill-red-500' : ''}`} />
                    点赞
                  </button>
                  <button
                    onClick={() => handleCopyPrompt(previewCase.prompt)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium
                      text-[var(--text-secondary)] bg-[var(--bg-primary)] hover:bg-[var(--accent-soft)] transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    复制
                  </button>
                  <a
                    href={`/case/${previewCase.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium
                      text-white bg-accent hover:bg-accent-dark transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    详情
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
