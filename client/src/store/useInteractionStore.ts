/**
 * 用户互动状态管理 Store
 * 管理点赞、评分、评论、浏览记录、临时气泡池等互动数据
 * 所有数据持久化到 LocalStorage，无需登录
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewMode } from '@/types/case';

/**
 * 用户互动状态接口
 */
interface InteractionState {
  /** 点赞记录：案例ID -> 是否点赞 */
  likes: Record<string, boolean>;
  /** 评分记录：案例ID -> 1-5分 */
  ratings: Record<string, number>;
  /** 评论记录：案例ID -> 评论文本数组 */
  comments: Record<string, string[]>;
  /** 浏览记录：已浏览的案例ID数组 */
  viewed: string[];
  /** 临时气泡池：收纳的案例ID数组 */
  savedBubbles: string[];
  /** 用户偏好的浏览模式 */
  preferredMode: ViewMode;
  /** 浏览记录（左滑减少推荐的案例ID） */
  disliked: string[];

  // Actions
  /** 切换点赞状态 */
  toggleLike: (caseId: string) => void;
  /** 设置评分 */
  setRating: (caseId: string, rating: number) => void;
  /** 添加评论 */
  addComment: (caseId: string, text: string) => void;
  /** 标记为已浏览 */
  markViewed: (caseId: string) => void;
  /** 添加至临时气泡池 */
  addToBubblePool: (caseId: string) => void;
  /** 从临时气泡池移除 */
  removeFromBubblePool: (caseId: string) => void;
  /** 清空临时气泡池 */
  clearBubblePool: () => void;
  /** 设置浏览模式偏好 */
  setPreferredMode: (mode: ViewMode) => void;
  /** 标记为不感兴趣（左滑） */
  markDisliked: (caseId: string) => void;
  /** 检查是否已点赞 */
  isLiked: (caseId: string) => boolean;
  /** 获取评分 */
  getRating: (caseId: string) => number;
  /** 检查是否已浏览 */
  isViewed: (caseId: string) => boolean;
  /** 检查是否在气泡池中 */
  isInBubblePool: (caseId: string) => boolean;
}

/**
 * 创建互动状态 Store
 * 使用 persist 中间件持久化到 LocalStorage
 */
export const useInteractionStore = create<InteractionState>()(
  persist(
    (set, get) => ({
      // 初始状态
      likes: {},
      ratings: {},
      comments: {},
      viewed: [],
      savedBubbles: [],
      preferredMode: 'card',
      disliked: [],

      /**
       * 切换点赞状态
       * @param caseId - 案例ID
       */
      toggleLike: (caseId: string) =>
        set((state) => ({
          likes: {
            ...state.likes,
            [caseId]: !state.likes[caseId],
          },
        })),

      /**
       * 设置评分
       * @param caseId - 案例ID
       * @param rating - 评分（1-5）
       */
      setRating: (caseId: string, rating: number) =>
        set((state) => ({
          ratings: {
            ...state.ratings,
            [caseId]: Math.max(1, Math.min(5, rating)),
          },
        })),

      /**
       * 添加评论
       * @param caseId - 案例ID
       * @param text - 评论内容
       */
      addComment: (caseId: string, text: string) =>
        set((state) => ({
          comments: {
            ...state.comments,
            [caseId]: [text, ...(state.comments[caseId] || [])].slice(0, 50),
          },
        })),

      /**
       * 标记案例为已浏览
       * @param caseId - 案例ID
       */
      markViewed: (caseId: string) =>
        set((state) => {
          if (state.viewed.includes(caseId)) return state;
          return { viewed: [...state.viewed, caseId] };
        }),

      /**
       * 添加案例到临时气泡池
       * 最大容量20个，超出时移除最早添加的
       * @param caseId - 案例ID
       */
      addToBubblePool: (caseId: string) =>
        set((state) => {
          if (state.savedBubbles.includes(caseId)) return state;
          const newPool = [caseId, ...state.savedBubbles].slice(0, 20);
          return { savedBubbles: newPool };
        }),

      /**
       * 从临时气泡池移除案例
       * @param caseId - 案例ID
       */
      removeFromBubblePool: (caseId: string) =>
        set((state) => ({
          savedBubbles: state.savedBubbles.filter((id) => id !== caseId),
        })),

      /**
       * 清空临时气泡池
       */
      clearBubblePool: () => set({ savedBubbles: [] }),

      /**
       * 设置浏览模式偏好
       * @param mode - 浏览模式
       */
      setPreferredMode: (mode: ViewMode) => set({ preferredMode: mode }),

      /**
       * 标记案例为不感兴趣（左滑操作）
       * @param caseId - 案例ID
       */
      markDisliked: (caseId: string) =>
        set((state) => {
          if (state.disliked.includes(caseId)) return state;
          return { disliked: [...state.disliked, caseId] };
        }),

      /**
       * 检查是否已点赞
       * @param caseId - 案例ID
       * @returns 是否已点赞
       */
      isLiked: (caseId: string) => !!get().likes[caseId],

      /**
       * 获取评分
       * @param caseId - 案例ID
       * @returns 评分（未评分返回0）
       */
      getRating: (caseId: string) => get().ratings[caseId] || 0,

      /**
       * 检查是否已浏览
       * @param caseId - 案例ID
       * @returns 是否已浏览
       */
      isViewed: (caseId: string) => get().viewed.includes(caseId),

      /**
       * 检查是否在气泡池中
       * @param caseId - 案例ID
       * @returns 是否在气泡池中
       */
      isInBubblePool: (caseId: string) => get().savedBubbles.includes(caseId),
    }),
    {
      name: 'vibe-inspire-interactions',
      partialize: (state) => ({
        likes: state.likes,
        ratings: state.ratings,
        comments: state.comments,
        viewed: state.viewed,
        savedBubbles: state.savedBubbles,
        preferredMode: state.preferredMode,
        disliked: state.disliked,
      }),
    }
  )
);
