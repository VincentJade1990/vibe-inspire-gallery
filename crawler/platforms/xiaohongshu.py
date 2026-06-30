"""
小红书平台爬虫适配器

重要声明：
小红书有极强的反爬虫机制，包括但不限于：
1. 请求签名验证（x-sig、x-t等加密参数）
2. 严格的登录态校验
3. 设备指纹检测
4. IP频率限制（极易触发滑块验证码）

纯requests方式几乎无法抓取到有效内容。

推荐方案（按优先级排序）：
1. Playwright/Selenium 浏览器自动化（模拟真实用户行为）
2. 使用已登录的Cookie配合签名算法
3. 使用第三方小红书API服务

本文件提供一个基于Playwright的备选实现框架，
使用requests的部分仅作为占位参考，实际运行会失败。

合规声明：
- 小红书robots.txt允许搜索引擎爬取公开笔记
- 本脚本仅抓取公开可见内容，不突破任何访问限制
- 请求间隔2-5秒，仅用于个人学习
"""

from typing import Any
from config import MAX_PER_PLATFORM
from utils import infer_difficulty, infer_scene_tags, format_timestamp, clean_text


class XiaohongshuCrawler:
    """
    小红书笔记爬虫

    由于小红书强反爬，本类提供两种实现方式：
    1. requests方式（几乎不可用，仅作参考）
    2. Playwright方式（推荐，需要安装playwright）
    """

    PLATFORM = "xiaohongshu"
    PLATFORM_NAME = "小红书"
    BASE_URL = "https://www.xiaohongshu.com"
    SEARCH_URL = "https://www.xiaohongshu.com/search_result"

    def __init__(self, deduplicator, store):
        self.dedup = deduplicator
        self.store = store

    def crawl(self, keywords: list[str]) -> int:
        """
        执行抓取任务

        由于小红书反爬限制，默认使用模拟数据模式。
        如需真实抓取，请使用_playwright_crawl方法。

        Args:
            keywords: 关键词列表

        Returns:
            成功抓取的条数
        """
        print(f"\n{'='*50}")
        print(f"[平台] {self.PLATFORM_NAME}")
        print(f"[状态] 小红书反爬严格，纯requests方式无法抓取")
        print(f"[建议] 使用Playwright浏览器自动化方案")
        print(f"{'='*50}")

        # 默认使用模拟数据填充（练手阶段可用）
        count = self._generate_mock_data(keywords)
        return count

    def _generate_mock_data(self, keywords: list[str]) -> int:
        """
        生成模拟数据用于练手调试
        数据格式与真实抓取一致，仅用于前端联调

        Args:
            keywords: 关键词列表

        Returns:
            生成的模拟数据条数
        """
        print("\n[模式] 使用模拟数据（小红书真实抓取需Playwright）")

        mock_cases = [
            {
                "id": "vc_xhs_mock_01",
                "title": "用一句话让AI生成天气可视化网站",
                "cover_img": "https://images.unsplash.com/photo-1592210454359-9043f067919b?w=800&q=80",
                "demo_video_url": "",
                "full_prompt": "帮我做一个天气可视化网站，输入城市名显示当前天气，用动画效果展示温度变化趋势",
                "source_platform": "小红书",
                "source_url": "https://www.xiaohongshu.com/discovery/item/mock01",
                "like_count": 1240,
                "tag_list": ["Web应用", "数据可视化"],
                "difficulty": "零基础",
                "create_time": "2026-06-20T08:30:00Z",
            },
            {
                "id": "vc_xhs_mock_02",
                "title": "AI 3分钟生成个人作品集网站",
                "cover_img": "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80",
                "demo_video_url": "",
                "full_prompt": "帮我做一个个人作品集网站，包含首页介绍、项目展示、技能标签、联系方式",
                "source_platform": "小红书",
                "source_url": "https://www.xiaohongshu.com/discovery/item/mock02",
                "like_count": 3560,
                "tag_list": ["Web应用"],
                "difficulty": "零基础",
                "create_time": "2026-06-18T14:00:00Z",
            },
            {
                "id": "vc_xhs_mock_03",
                "title": "用ChatGPT写Chrome扩展插件",
                "cover_img": "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80",
                "demo_video_url": "",
                "full_prompt": "写一个Chrome浏览器扩展，功能是在网页上选中文本后右键翻译为中文",
                "source_platform": "小红书",
                "source_url": "https://www.xiaohongshu.com/discovery/item/mock03",
                "like_count": 890,
                "tag_list": ["Chrome插件", "工具脚本"],
                "difficulty": "进阶",
                "create_time": "2026-06-15T10:20:00Z",
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

    def _playwright_crawl(self, keywords: list[str]) -> int:
        """
        使用Playwright进行浏览器自动化抓取（推荐方案）

        需要安装: pip install playwright && playwright install chromium

        思路：
        1. 启动无头浏览器
        2. 访问小红书搜索页
        3. 模拟输入关键词并搜索
        4. 滚动加载笔记列表
        5. 解析笔记卡片信息
        6. 点击进入详情页获取完整内容

        Args:
            keywords: 关键词列表

        Returns:
            成功抓取的条数
        """
        print("\n[Playwright] 启动浏览器自动化抓取...")
        print("[提示] 如需使用此功能，请取消注释main.py中的相关代码")

        # 以下为Playwright实现框架，取消注释并安装依赖后可运行
        """
        from playwright.sync_api import sync_playwright

        count = 0
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36...",
                viewport={"width": 1280, "height": 800},
            )
            page = context.new_page()

            for keyword in keywords:
                if count >= MAX_PER_PLATFORM:
                    break

                # 访问搜索页
                search_url = f"https://www.xiaohongshu.com/search_result?keyword={keyword}"
                page.goto(search_url, wait_until="networkidle")
                page.wait_for_timeout(3000)

                # 滚动加载更多
                for _ in range(3):
                    page.evaluate("window.scrollBy(0, 800)")
                    page.wait_for_timeout(2000)

                # 解析笔记卡片
                cards = page.query_selector_all(".note-item")
                for card in cards:
                    if count >= MAX_PER_PLATFORM:
                        break
                    # 提取标题、链接、封面等信息
                    # ... 解析逻辑 ...

            browser.close()
        return count
        """
        return 0
