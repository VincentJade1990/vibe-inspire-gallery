"""
X (Twitter) 平台爬虫适配器

重要声明：
X有极强的反爬虫和认证机制：
1. 强制要求登录态（Cookie / Bearer Token）
2. 前端使用复杂JavaScript渲染（React-based）
3. 请求频率限制严格
4. 内容受Twitter API v2管控

纯requests方式几乎无法抓取到任何有效内容。

推荐方案（按优先级排序）：
1. Twitter API v2（官方API，需要开发者账号和API Key）
2. Playwright/Selenium 浏览器自动化（需要登录Cookie）
3. 第三方Twitter数据服务（如Nitter镜像站）

本文件提供基于模拟数据的占位实现，
并附带Playwright框架代码供参考。

合规声明：
- X robots.txt限制较多，仅允许特定路径爬取
- 建议使用官方API获取数据，最稳定合规
- 本脚本仅用于个人学习，不用于商业用途
"""

from typing import Any
from config import MAX_PER_PLATFORM
from utils import infer_difficulty, infer_scene_tags, format_timestamp


class XTwitterCrawler:
    """
    X (Twitter) 爬虫

    由于X强认证要求，本类提供：
    1. 模拟数据（默认，用于前端联调）
    2. Twitter API v2 框架（需要API Key）
    3. Playwright 框架（需要登录Cookie）
    """

    PLATFORM = "x"
    PLATFORM_NAME = "X(Twitter)"
    BASE_URL = "https://x.com"

    def __init__(self, deduplicator, store):
        self.dedup = deduplicator
        self.store = store

    def crawl(self, keywords: list[str]) -> int:
        """
        执行抓取任务

        由于X认证限制，默认使用模拟数据模式。

        Args:
            keywords: 关键词列表

        Returns:
            成功抓取的条数
        """
        print(f"\n{'='*50}")
        print(f"[平台] {self.PLATFORM_NAME}")
        print(f"[状态] X需要登录态/官方API，纯requests方式无法抓取")
        print(f"[建议] 使用Twitter API v2 或 Playwright + Cookie")
        print(f"{'='*50}")

        count = self._generate_mock_data(keywords)
        return count

    def _generate_mock_data(self, keywords: list[str]) -> int:
        """
        生成模拟数据用于练手调试

        Args:
            keywords: 关键词列表

        Returns:
            生成的模拟数据条数
        """
        print("\n[模式] 使用模拟数据（X真实抓取需API Key或Playwright）")

        mock_cases = [
            {
                "id": "vc_x_mock_01",
                "title": "Built a weather dashboard with AI in 10 seconds",
                "cover_img": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
                "demo_video_url": "",
                "full_prompt": "Create a data dashboard with line charts, bar charts, and KPI cards. Use mock data for sales analytics.",
                "source_platform": "X",
                "source_url": "https://x.com/status/mock01",
                "like_count": 2300,
                "tag_list": ["数据可视化", "Web应用"],
                "difficulty": "进阶",
                "create_time": "2026-06-19T16:45:00Z",
            },
            {
                "id": "vc_x_mock_02",
                "title": "Retro Snake Game built with AI in 10 minutes",
                "cover_img": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
                "demo_video_url": "",
                "full_prompt": "Build a retro-style Snake game in HTML5 Canvas. Include score tracking and increasing speed per level.",
                "source_platform": "X",
                "source_url": "https://x.com/status/mock02",
                "like_count": 3100,
                "tag_list": ["游戏"],
                "difficulty": "进阶",
                "create_time": "2026-06-14T12:00:00Z",
            },
            {
                "id": "vc_x_mock_03",
                "title": "AI generated portfolio site with one prompt",
                "cover_img": "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80",
                "demo_video_url": "",
                "full_prompt": "Create a personal portfolio website with hero section, project showcase, skills tags, and contact form.",
                "source_platform": "X",
                "source_url": "https://x.com/status/mock03",
                "like_count": 1560,
                "tag_list": ["Web应用"],
                "difficulty": "零基础",
                "create_time": "2026-06-13T17:00:00Z",
            },
        ]

        count = 0
        for case in mock_cases:
            if self.dedup.is_seen(case["source_url"]):
                print(f"  [去重] 跳过: {case['title'][:30]}...")
                continue
            if self.store.add(case):
                self.dedup.add(case["source_url"])
                count += 1

        print(f"[完成] 生成 {count} 条模拟数据")
        return count

    def _api_crawl(self, keywords: list[str], bearer_token: str) -> int:
        """
        使用Twitter API v2抓取（需要开发者账号）

        申请地址: https://developer.twitter.com/en/portal/dashboard

        Args:
            keywords: 关键词列表
            bearer_token: Twitter API Bearer Token

        Returns:
            成功抓取的条数
        """
        print("\n[API] 使用Twitter API v2抓取...")

        # API v2 搜索近期推文
        # GET https://api.twitter.com/2/tweets/search/recent
        # Headers: Authorization: Bearer {token}
        # Params: query, max_results, tweet.fields

        # 实现框架：
        """
        import requests
        headers = {"Authorization": f"Bearer {bearer_token}"}

        for keyword in keywords:
            url = "https://api.twitter.com/2/tweets/search/recent"
            params = {
                "query": f"{keyword} -is:retweet lang:en",
                "max_results": 10,
                "tweet.fields": "created_at,public_metrics,author_id",
            }
            resp = requests.get(url, headers=headers, params=params)
            data = resp.json()
            # 解析并存储...
        """
        return 0
