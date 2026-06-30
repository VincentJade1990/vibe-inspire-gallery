"""
爬虫通用工具模块
提供HTTP请求封装、数据去重、内容清洗、JSON存储等通用能力

设计原则：
- 所有请求强制添加延时，避免高频访问
- 自动重试机制，提高鲁棒性
- 完整的异常捕获和日志输出
"""

import json
import os
import re
import time
from datetime import datetime, timezone
from typing import Any

import requests
from bs4 import BeautifulSoup

from config import get_random_ua, get_random_delay, REQUEST_TIMEOUT, MAX_RETRIES, DIFFICULTY_KEYWORDS, SCENE_TAGS


# ============================================
# HTTP 请求封装
# ============================================

def fetch_html(url: str, headers: dict[str, str] | None = None, **kwargs) -> str | None:
    """
    发送HTTP GET请求获取HTML内容

    特性：
    - 自动添加随机User-Agent
    - 请求前强制延时
    - 失败自动重试
    - 完整的错误处理

    Args:
        url: 目标URL
        headers: 自定义请求头
        **kwargs: 传递给requests.get的额外参数

    Returns:
        HTML文本内容，失败返回None
    """
    # 构造请求头
    default_headers = {
        "User-Agent": get_random_ua(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0",
    }
    if headers:
        default_headers.update(headers)

    # 请求前延时（关键：避免高频请求）
    delay = get_random_delay()
    print(f"  [延时] 等待 {delay:.1f} 秒后请求...")
    time.sleep(delay)

    # 重试机制
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            print(f"  [请求] GET {url} (尝试 {attempt}/{MAX_RETRIES})")
            response = requests.get(
                url,
                headers=default_headers,
                timeout=REQUEST_TIMEOUT,
                **kwargs
            )
            response.raise_for_status()

            # 检查是否被反爬拦截（常见特征）
            if "captcha" in response.text.lower() or "验证码" in response.text:
                print(f"  [警告] 请求被拦截，出现验证码，跳过: {url}")
                return None

            return response.text

        except requests.exceptions.HTTPError as e:
            print(f"  [HTTP错误] {e.response.status_code}: {url}")
            if e.response.status_code == 403:
                print("  [提示] 403 Forbidden，可能触发反爬，建议添加Cookie或使用Playwright")
                return None
            if e.response.status_code == 429:
                print("  [提示] 429 Too Many Requests，增加延时后重试...")
                time.sleep(delay * 2)
                continue

        except requests.exceptions.Timeout:
            print(f"  [超时] 请求超时: {url}")
        except requests.exceptions.ConnectionError:
            print(f"  [连接错误] 无法连接: {url}")
        except Exception as e:
            print(f"  [异常] {type(e).__name__}: {e}")

        # 重试等待
        if attempt < MAX_RETRIES:
            wait = delay * attempt
            print(f"  [重试] {wait:.1f}秒后重试...")
            time.sleep(wait)

    print(f"  [失败] 超过最大重试次数，放弃: {url}")
    return None


def fetch_json(url: str, headers: dict[str, str] | None = None, **kwargs) -> dict[str, Any] | None:
    """
    发送HTTP GET请求获取JSON数据

    Args:
        url: 目标URL
        headers: 自定义请求头
        **kwargs: 传递给requests.get的额外参数

    Returns:
        解析后的JSON字典，失败返回None
    """
    html = fetch_html(url, headers, **kwargs)
    if html is None:
        return None
    try:
        return json.loads(html)
    except json.JSONDecodeError as e:
        print(f"  [JSON解析错误] {e}")
        return None


# ============================================
# HTML 解析工具
# ============================================

def parse_soup(html: str) -> BeautifulSoup:
    """将HTML文本解析为BeautifulSoup对象"""
    return BeautifulSoup(html, "lxml")


def extract_text(element) -> str:
    """安全提取元素的文本内容"""
    if element is None:
        return ""
    return element.get_text(strip=True)


def extract_attr(element, attr: str, default: str = "") -> str:
    """安全提取元素的属性值"""
    if element is None:
        return default
    return element.get(attr, default)


# ============================================
# 数据清洗工具
# ============================================

def clean_text(text: str | None) -> str:
    """
    清洗文本内容
    - 去除首尾空白
    - 去除多余换行和空格
    - 去除特殊控制字符
    """
    if not text:
        return ""
    text = str(text).strip()
    # 去除多余空白
    text = re.sub(r"\s+", " ", text)
    # 去除控制字符
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", text)
    return text


def extract_number(text: str | None) -> int:
    """从文本中提取数字"""
    if not text:
        return 0
    numbers = re.findall(r"\d+", str(text).replace(",", ""))
    return int(numbers[0]) if numbers else 0


def standardize_url(url: str | None) -> str:
    """标准化URL，去除跟踪参数"""
    if not url:
        return ""
    # 去除常见跟踪参数
    url = re.sub(r"[?&](utm_.*?|source|medium|campaign|share_source)=.*?(&|$)", "", url)
    # 去除末尾的?
    url = url.rstrip("?")
    return url


def infer_difficulty(title: str) -> str:
    """
    基于标题关键词自动推断难度等级

    Args:
        title: 案例标题

    Returns:
        难度等级：零基础/进阶/专业
    """
    title_lower = title.lower()
    for level, keywords in DIFFICULTY_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in title_lower:
                return level
    return "零基础"  # 默认难度


def infer_scene_tags(title: str, content: str = "") -> list[str]:
    """
    基于标题和内容关键词自动推断场景标签

    Args:
        title: 案例标题
        content: 案例内容文本（可选）

    Returns:
        场景标签列表
    """
    text = (title + " " + content).lower()
    tags: list[str] = []
    for tag, keywords in SCENE_TAGS.items():
        for kw in keywords:
            if kw.lower() in text:
                tags.append(tag)
                break
    return tags if tags else ["Web应用"]  # 默认标签


def format_timestamp(ts: int | str | None) -> str:
    """
    将各种时间格式统一转换为 ISO 8601 字符串

    Args:
        ts: 时间戳（秒级/毫秒级）或日期字符串

    Returns:
        ISO 8601 格式字符串
    """
    if not ts:
        return datetime.now(timezone.utc).isoformat()

    try:
        # 尝试解析为整数时间戳
        if isinstance(ts, (int, float)):
            # 判断是秒级还是毫秒级
            if ts > 1e12:
                ts = ts / 1000
            return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()

        # 尝试解析字符串
        if isinstance(ts, str):
            # 纯数字字符串
            if ts.isdigit():
                ts_int = int(ts)
                if ts_int > 1e12:
                    ts_int = ts_int // 1000
                return datetime.fromtimestamp(ts_int, tz=timezone.utc).isoformat()

            # 尝试常见日期格式
            for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y/%m/%d %H:%M:%S"):
                try:
                    dt = datetime.strptime(ts, fmt)
                    return dt.replace(tzinfo=timezone.utc).isoformat()
                except ValueError:
                    continue

        return datetime.now(timezone.utc).isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()


# ============================================
# 去重管理
# ============================================

class Deduplicator:
    """
    URL去重管理器
    使用内存+文件双重持久化，避免重复抓取同一案例
    """

    def __init__(self, filepath: str = "output/.seen_urls.json"):
        self.filepath = filepath
        self.seen: set[str] = set()
        self._load()

    def _load(self) -> None:
        """从文件加载已记录的URL"""
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.seen = set(data)
                print(f"[去重] 已加载 {len(self.seen)} 条历史URL记录")
            except Exception as e:
                print(f"[去重] 加载历史记录失败: {e}")

    def _save(self) -> None:
        """保存已记录的URL到文件"""
        try:
            os.makedirs(os.path.dirname(self.filepath) or ".", exist_ok=True)
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(list(self.seen), f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[去重] 保存记录失败: {e}")

    def is_seen(self, url: str) -> bool:
        """检查URL是否已抓取过"""
        return standardize_url(url) in self.seen

    def add(self, url: str) -> None:
        """添加URL到已抓取集合"""
        self.seen.add(standardize_url(url))

    def save(self) -> None:
        """手动触发保存"""
        self._save()


# ============================================
# 数据存储
# ============================================

class CaseStore:
    """
    案例数据存储器
    负责将抓取结果标准化并写入JSON文件
    """

    def __init__(self, filepath: str = "output/cases.json"):
        self.filepath = filepath
        self.cases: list[dict[str, Any]] = []

    def add(self, case: dict[str, Any]) -> bool:
        """
        添加一条案例数据

        Args:
            case: 案例字典，需包含标准字段

        Returns:
            是否添加成功
        """
        # 字段校验
        required = ["id", "title", "source_platform", "source_url"]
        for field in required:
            if not case.get(field):
                print(f"  [跳过] 缺少必填字段 '{field}': {case.get('title', 'N/A')}")
                return False

        # 清洗字段
        case["title"] = clean_text(case.get("title"))
        case["full_prompt"] = clean_text(case.get("full_prompt"))
        case["source_url"] = standardize_url(case.get("source_url"))

        self.cases.append(case)
        print(f"  [入库] {case['source_platform']} | {case['title'][:40]}...")
        return True

    def save(self) -> None:
        """将所有案例写入JSON文件"""
        if not self.cases:
            print("[存储] 没有数据需要保存")
            return

        try:
            os.makedirs(os.path.dirname(self.filepath) or ".", exist_ok=True)
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(self.cases, f, ensure_ascii=False, indent=2)
            print(f"[存储] 成功保存 {len(self.cases)} 条案例到 {self.filepath}")
        except Exception as e:
            print(f"[存储] 保存失败: {e}")

    def merge_with_existing(self) -> int:
        """
        与已有的cases.json合并，去重后保存

        Returns:
            合并后的总条数
        """
        existing: list[dict[str, Any]] = []
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    existing = json.load(f)
            except Exception as e:
                print(f"[合并] 读取已有文件失败: {e}")

        # 按URL去重合并
        url_map: dict[str, dict[str, Any]] = {}
        for case in existing + self.cases:
            url = case.get("source_url", "")
            if url:
                url_map[url] = case

        merged = list(url_map.values())

        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(merged, f, ensure_ascii=False, indent=2)
            print(f"[合并] 合并后共 {len(merged)} 条案例（新增 {len(self.cases)} 条，原有 {len(existing)} 条）")
            return len(merged)
        except Exception as e:
            print(f"[合并] 保存失败: {e}")
            return 0
