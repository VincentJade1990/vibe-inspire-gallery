"""
B站平台爬虫适配器

B站的视频搜索和信息获取有一定开放性，但存在以下限制：
1. 搜索页可获取视频列表基础信息（标题、封面、播放量、UP主）
2. 视频详情页需要额外请求API获取简介和标签
3. 视频Prompt通常无法直接从页面获取，需要依赖标题和简介推断

API说明：
- 搜索API: https://api.bilibili.com/x/web-interface/search/type
  参数: keyword, search_type=video, page
- 视频详情API: https://api.bilibili.com/x/web-interface/view
  参数: bvid

合规声明：
- 本脚本仅调用B站公开API，模拟正常用户搜索行为
- 请求间隔2-5秒，不造成服务器压力
- 仅用于个人学习练手

已知限制：
- B站视频内容无法直接提取"Prompt"，此字段使用视频简介替代
- 部分视频可能需要登录才能查看完整信息
"""

from typing import Any

from config import MAX_PER_PLATFORM
from utils import (
    fetch_json,
    infer_difficulty,
    infer_scene_tags,
    format_timestamp,
    clean_text,
    extract_number,
)


class BilibiliCrawler:
    """
    B站视频爬虫
    通过公开搜索API抓取Vibe Coding相关视频
    """

    PLATFORM = "bilibili"
    PLATFORM_NAME = "B站"
    API_SEARCH = "https://api.bilibili.com/x/web-interface/search/type"
    API_DETAIL = "https://api.bilibili.com/x/web-interface/view"

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
        使用关键词搜索B站视频

        Args:
            keyword: 搜索关键词

        Returns:
            本关键词成功入库的条数
        """
        count = 0
        page = 1

        while count < MAX_PER_PLATFORM and page <= 3:  # 最多翻3页
            params = {
                "keyword": keyword,
                "search_type": "video",
                "page": page,
            }

            print(f"  [搜索] 第{page}页")

            result = fetch_json(self.API_SEARCH, params=params)
            if not result:
                break

            # 检查API返回状态
            code = result.get("code", -1)
            if code != 0:
                message = result.get("message", "未知错误")
                print(f"  [API错误] code={code}, message={message}")
                # 如果是-412（请求被拦截），停止抓取
                if code == -412:
                    print("  [提示] 请求被B站反爬系统拦截，建议增加延时或使用Cookie")
                break

            videos = result.get("data", {}).get("result", [])
            if not videos:
                print("  [完成] 没有更多结果")
                break

            for video in videos:
                if count >= MAX_PER_PLATFORM:
                    break

                bvid = video.get("bvid", "")
                title = video.get("title", "")

                if not bvid or not title:
                    continue

                # 清洗标题（去除HTML标签）
                title = clean_text(title.replace("<em class=\"keyword\">", "").replace("</em>", ""))

                source_url = f"https://www.bilibili.com/video/{bvid}"

                # 去重检查
                if self.dedup.is_seen(source_url):
                    print(f"  [去重] 跳过已抓取: {title[:30]}...")
                    continue

                # 获取视频详情（简介等信息）
                detail = self._fetch_video_detail(bvid)

                # 构建案例数据
                case = self._build_case(video, detail)
                if case and self.store.add(case):
                    self.dedup.add(source_url)
                    count += 1

            page += 1

        return count

    def _fetch_video_detail(self, bvid: str) -> dict[str, Any]:
        """
        获取视频详情信息

        Args:
            bvid: 视频BV号

        Returns:
            视频详情字典，失败返回空字典
        """
        url = f"{self.API_DETAIL}?bvid={bvid}"
        result = fetch_json(url)

        if not result or result.get("code") != 0:
            return {}

        return result.get("data", {})

    def _build_case(self, video: dict[str, Any], detail: dict[str, Any]) -> dict[str, Any] | None:
        """
        将B站视频数据转换为标准案例格式

        Args:
            video: 搜索结果中的视频信息
            detail: 视频详情信息

        Returns:
            标准化案例字典
        """
        bvid = video.get("bvid", "")
        title = video.get("title", "")

        if not bvid or not title:
            return None

        # 清洗标题
        title = clean_text(title.replace("<em class=\"keyword\">", "").replace("</em>", ""))

        # 提取内容（视频简介）
        desc = detail.get("desc", "")
        # B站视频通常不包含明确Prompt，用简介+标题构建
        content = desc or title

        # 推断难度和标签
        difficulty = infer_difficulty(title)
        tags = infer_scene_tags(title, content)

        # 播放量转点赞数（B站搜索API不直接返回点赞，用播放数估算）
        play_count = extract_number(video.get("play", "0"))

        case = {
            "id": f"vc_bilibili_{bvid}",
            "title": title,
            "cover_img": video.get("pic", ""),
            "demo_video_url": f"https://www.bilibili.com/video/{bvid}",
            "full_prompt": content or f"B站视频: {title}",
            "source_platform": "B站",
            "source_url": f"https://www.bilibili.com/video/{bvid}",
            "like_count": play_count,  # 使用播放量作为热度参考
            "tag_list": tags,
            "difficulty": difficulty,
            "create_time": format_timestamp(video.get("pubdate", 0)),
        }

        return case
