"""
爬虫全局配置模块
集中管理请求参数、关键词、延时策略等配置项
"""

import random

# ============================================
# 请求配置
# ============================================

# 请求超时时间（秒）
REQUEST_TIMEOUT = 15

# 请求间隔基础秒数，实际间隔会在 [MIN_DELAY, MAX_DELAY] 范围内随机
MIN_DELAY = 2.0
MAX_DELAY = 5.0

# 最大重试次数
MAX_RETRIES = 3

# User-Agent 轮换池，模拟常见浏览器
USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
]


def get_random_ua() -> str:
    """随机获取一个 User-Agent"""
    return random.choice(USER_AGENTS)


def get_random_delay() -> float:
    """随机获取一个请求间隔时间"""
    return random.uniform(MIN_DELAY, MAX_DELAY)


# ============================================
# 抓取关键词配置
# ============================================

# 各平台抓取关键词列表
KEYWORDS = [
    "vibecoding",
    "AI网页生成",
    "Cursor案例",
    "v0开发案例",
    "vibe coding",
]

# ============================================
# 平台配置
# ============================================

PLATFORM_CONFIG = {
    "juejin": {
        "name": "掘金",
        "base_url": "https://juejin.cn",
        "search_url": "https://juejin.cn/search",
        "enabled": True,
        # 掘金公开搜索API，无需登录即可获取基础信息
        "api_search": "https://api.juejin.cn/search_api/v1/search",
    },
    "bilibili": {
        "name": "B站",
        "base_url": "https://www.bilibili.com",
        "search_url": "https://search.bilibili.com/all",
        "enabled": True,
        # B站搜索页可解析基础信息，但详情需要额外请求
        "api_search": "https://api.bilibili.com/x/web-interface/search/type",
    },
    "xiaohongshu": {
        "name": "小红书",
        "base_url": "https://www.xiaohongshu.com",
        "search_url": "https://www.xiaohongshu.com/search_result",
        "enabled": True,
        # 小红书有强反爬（签名验证+登录态），纯requests难以抓取
        # 需要Cookie或Playwright方案
        "note": "需要登录Cookie或Playwright自动化",
    },
    "x": {
        "name": "X(Twitter)",
        "base_url": "https://x.com",
        "search_url": "https://x.com/search",
        "enabled": True,
        # X有强反爬和认证机制，纯requests几乎无法抓取
        # 需要登录Cookie或Twitter API
        "note": "需要登录Cookie或官方API",
    },
}

# ============================================
# 输出配置
# ============================================

# 输出文件路径
OUTPUT_FILE = "output/cases.json"

# 去重记录文件（用于持久化已抓取的URL）
SEEN_URLS_FILE = "output/.seen_urls.json"

# 难度等级映射规则（基于标题关键词自动推断）
DIFFICULTY_KEYWORDS = {
    "零基础": ["入门", "新手", "零基础", "简单", "5分钟", "10分钟", "一句话", "一行代码"],
    "进阶": ["进阶", "中级", "实战", "完整项目", "全栈", "前后端"],
    "专业": ["高级", "专业", "架构", "源码", "原理", "深入", "优化", "性能"],
}

# 场景标签映射规则（基于标题关键词自动推断）
SCENE_TAGS = {
    "Web应用": ["网站", "网页", "Web", "前端", "React", "Vue", "Next.js"],
    "移动端": ["小程序", "App", "移动端", "H5", "uniapp", "flutter"],
    "游戏": ["游戏", "Game", "像素", "贪吃蛇", "Flappy", "2048"],
    "工具脚本": ["脚本", "工具", "插件", "扩展", "自动化", "爬虫", "CLI"],
    "AI应用": ["AI", "ChatGPT", "GPT", "LLM", "聊天", "机器人", "Bot"],
    "Chrome插件": ["Chrome", "浏览器扩展", "Extension", "插件"],
    "小程序": ["微信小程序", "小程序", "Mini Program"],
    "数据可视化": ["可视化", "图表", "Dashboard", "大屏", "ECharts", "D3"],
}

# 每个平台最大抓取条数（控制频率，避免过多请求）
MAX_PER_PLATFORM = 20
