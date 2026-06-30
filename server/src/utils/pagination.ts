/**
 * 分页工具函数
 * 提供基于数组的分页切割与分页元信息计算
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
 * 分页响应接口
 */
export interface PaginatedResult<T> {
  /** 当前页数据 */
  data: T[];
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
}

/**
 * 对数组进行分页切割
 * @param items - 原始数据数组
 * @param page - 当前页码（从1开始）
 * @param pageSize - 每页条数
 * @returns 分页后的结果对象
 */
export function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  // 确保页码和页大小为有效正整数
  const validPage = Math.max(1, Math.floor(page));
  const validPageSize = Math.max(1, Math.min(100, Math.floor(pageSize)));

  const total = items.length;
  const totalPages = Math.ceil(total / validPageSize);

  // 计算切割起始索引
  const startIndex = (validPage - 1) * validPageSize;
  const endIndex = startIndex + validPageSize;

  // 切割当前页数据
  const data = items.slice(startIndex, endIndex);

  return {
    data,
    page: validPage,
    pageSize: validPageSize,
    total,
    totalPages,
    hasNext: validPage < totalPages,
  };
}

/**
 * 验证分页参数并返回规范化后的值
 * @param rawPage - 原始页码参数
 * @param rawPageSize - 原始页大小参数
 * @returns 规范化后的分页参数
 */
export function validatePagination(
  rawPage: unknown,
  rawPageSize: unknown
): { page: number; pageSize: number } {
  const page = typeof rawPage === 'string' ? parseInt(rawPage, 10) : typeof rawPage === 'number' ? rawPage : 1;
  const pageSize = typeof rawPageSize === 'string' ? parseInt(rawPageSize, 10) : typeof rawPageSize === 'number' ? rawPageSize : 12;

  return {
    page: Math.max(1, Math.floor(page)),
    pageSize: Math.max(1, Math.min(100, Math.floor(pageSize))),
  };
}
