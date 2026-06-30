/**
 * 前端分页工具函数
 * 提供分页相关的计算和格式化功能
 */

/**
 * 分页参数接口
 */
export interface PaginationParams {
  /** 当前页码，从1开始 */
  page: number;
  /** 每页条数 */
  pageSize: number;
}

/**
 * 分页元信息接口
 */
export interface PaginationMeta {
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 总条数 */
  total: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
}

/**
 * 对数组进行客户端分页
 * @param items - 原始数据数组
 * @param page - 当前页码
 * @param pageSize - 每页条数
 * @returns 当前页数据
 */
export function paginateArray<T>(items: T[], page: number, pageSize: number): T[] {
  const validPage = Math.max(1, Math.floor(page));
  const validPageSize = Math.max(1, Math.min(100, Math.floor(pageSize)));
  const startIndex = (validPage - 1) * validPageSize;
  return items.slice(startIndex, startIndex + validPageSize);
}

/**
 * 计算分页元信息
 * @param total - 总条数
 * @param page - 当前页码
 * @param pageSize - 每页条数
 * @returns 分页元信息
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  pageSize: number
): PaginationMeta {
  const validPage = Math.max(1, Math.floor(page));
  const validPageSize = Math.max(1, Math.min(100, Math.floor(pageSize)));
  const totalPages = Math.ceil(total / validPageSize);

  return {
    page: validPage,
    pageSize: validPageSize,
    total,
    totalPages,
    hasNext: validPage < totalPages,
    hasPrev: validPage > 1,
  };
}

/**
 * 生成页码数组（用于分页器显示）
 * @param currentPage - 当前页码
 * @param totalPages - 总页数
 * @param maxVisible - 最多显示的页码数
 * @returns 页码数组（包含省略号标记）
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | string)[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  const halfVisible = Math.floor(maxVisible / 2);

  let startPage = Math.max(1, currentPage - halfVisible);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  // 第一页
  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) {
      pages.push('...');
    }
  }

  // 中间页码
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  // 最后一页
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    pages.push(totalPages);
  }

  return pages;
}

/**
 * 格式化数字显示（超过1000显示为1k）
 * @param num - 原始数字
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return String(num);
}
