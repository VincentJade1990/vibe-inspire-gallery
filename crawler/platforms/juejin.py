"""
掘金平台爬虫适配器

掘金提供公开搜索API，无需登录即可获取文章基础信息，
是相对最容易抓取的平台之一。

API说明：
- 搜索接口: POST https://api.juejin.cn/search_api/v1/search
- 请求体: { "key_word": "关键词", "search_type": 0, "cursor": "0", "limit": 20 }
- 返回文章列表，包含标题、链接、作者、点赞数等

合规声明：
- 本脚本仅调用掘金公开API，不突破任何访问限制
- 请求间隔2-5秒，符合正常用户浏览频率
- 仅用于个人学习练手，不用于商业用途
"""

import uuid
from typing import Any

from config import MAX_PER_PLATFORM
from utils import (
    fetch_json,
    infer_difficulty,
    infer_scene_tags,
    format_timestamp,
    standardize_url,
)


class JuejinCrawler:
    """
    掘金文章爬虫
    通过公开搜索API抓取Vibe Coding相关文章
    """

    PLATFORM = "juejin"
    PLATFORM_NAME = "掘金"
    API_SEARCH = "https://api.juejin.cn/search_api/v1/search"

    def __init__(self, deduplicator, store):
        """
        初始化爬虫

        Args:
            deduplicator: URL去重器实例
            store: 案例存储器实例
        """
        self.dedup = deduplicator
        self.store = store

    def crawl(self, keywords: list[str]) -> int:
        """
        执行抓取任务

        Args:
            keywords: 关键词列表

        Returns:
            成功抓取的条数
        """
        count = 0
        print(f"\n{'='*50}")
        print(f"[平台] 开始抓取 {self.PLATFORM_NAME}")
        print(f"[关键词] {', '.join(keywords)}")
        print(f"{'='*50}")

        for keyword in keywords:
            if count >= MAX_PER_PLATFORM:
                print(f"[限制] 已达到单平台最大抓取数 {MAX_PER_PLATFORM}，停止")
                break

            print(f"\n[关键词] '{keyword}'")
            fetched = self._search_by_keyword(keyword)
            count += fetched

        print(f"[平台] {self.PLATFORM_NAME} 抓取完成，共 {count} 条")
        return count

    def _search_by_keyword(self, keyword: str) -> int:
        """
        使用关键词搜索掘金文章

        Args:
            keyword: 搜索关键词

        Returns:
            本关键词成功入库的条数
        """
        count = 0
        cursor = "0"

        while count < MAX_PER_PLATFORM:
            payload = {
                "key_word": keyword,
                "search_type": 0,  # 搜索文章
                "cursor": cursor,
                "limit": 10,
            }

            print(f"  [搜索] 请求API，cursor={cursor}")

            # 调用掘金搜索API
            result = fetch_json(
                self.API_SEARCH,
                headers={
                    "Content-Type": "application/json",
                    "Referer": "https://juejin.cn/search",
                },
                method="post",  # 注意：这里需要POST，但fetch_json默认GET
            )

            # 上面fetch_json默认GET，掘金需要POST，我们手动处理
            import requests
            import time
            import random
            from config import get_random_ua, REQUEST_TIMEOUT

            time.sleep(random.uniform(2, 5))
            try:
                resp = requests.post(
                    self.API_SEARCH,
                    json=payload,
                    headers={
                        "User-Agent": get_random_ua(),
                        "Content-Type": "application/json",
                        "Referer": "https://juejin.cn/search",
                        "Origin": "https://juejin.cn",
                    },
                    timeout=REQUEST_TIMEOUT,
                )
                resp.raise_for_status()
                result = resp.json()
            except Exception as e:
                print(f"  [错误] API请求失败: {e}")
                break

            # 解析结果
            data = result.get("data", [])
            if not data:
                print("  [完成] 没有更多结果")
                break

            for item in data:
                if count >= MAX_PER_PLATFORM:
                    break

                # 提取文章信息
                article = item.get("result_model", {}).get("article_info", {})
                if not article:
                    continue

                article_id = article.get("article_id", "")
                title = article.get("title", "")
                source_url = f"https://juejin.cn/post/{article_id}"

                # 去重检查
                if self.dedup.is_seen(source_url):
                    print(f"  [去重] 跳过已抓取: {title[:30]}...")
                    continue

                # 构建案例数据
                case = self._build_case(article, item)
                if case and self.store.add(case):
                    self.dedup.add(source_url)
                    count += 1

            # 获取下一页cursor
            cursor = result.get("cursor", "")
            if not cursor:
                break

        return count

    def _build_case(self, article: dict[str, Any], raw_item: dict[str, Any]) -> dict[str, Any] | None:
        """
        将掘金文章数据转换为标准案例格式

        Args:
            article: 掘金文章信息字典
            raw_item: 原始搜索结果项

        Returns:
            标准化案例字典
        """
        article_id = article.get("article_id", "")
        title = article.get("title", "")

        if not article_id or not title:
            return None

        # 提取内容摘要（如果有）
        content = article.get("brief_content", "")

        # 构建标准ID
        case_id = f"vc_juejin_{article_id}"

        # 推断难度和标签
        difficulty = infer_difficulty(title)
        tags = infer_scene_tags(title, content)

        case = {
            "id": case_id,
            "title": title,
            "cover_img": article.get("cover_image", ""),
            "demo_video_url": "",  # 掘金文章通常没有视频
            "full_prompt": content or f"掘金文章: {title}",
            "source_platform": "掘金",
            "source_url": f"https://juejin.cn/post/{article_id}",
            "like_count": article.get("digg_count", 0),
            "tag_list": tags,
            "difficulty": difficulty,
            "create_time": format_timestamp(article.get("ctime", 0)),
        }

        return case
