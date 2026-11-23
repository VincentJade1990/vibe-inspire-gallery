"""
候选案例筛选管线
================
把「书签 / 历史抓取数据」导入候选池，做去重、规则评分、页面信息补全，
可选调用 DeepSeek 做语义评分，最后输出可审核的 JSON。

用法：
  python3 candidates.py import          # 导入书签 + 历史数据
  python3 candidates.py enrich          # 补全页面标题/摘要/封面 URL（不下载图片）
  python3 candidates.py score           # 规则评分
  python3 candidates.py score --ai      # 规则 + DeepSeek 评分
  python3 candidates.py report          # 查看结果分布
  python3 candidates.py run             # import + enrich + score

输出：
  output/candidates_work.json   工作数据（可反复覆盖）
  output/candidates.json        最终评分结果
"""

import argparse
import hashlib
import json
import os
import re
import sys
import time
import unicodedata
from datetime import datetime
from difflib import SequenceMatcher
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

import requests
from bs4 import BeautifulSoup

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
WORK_FILE = os.path.join(OUTPUT_DIR, "candidates_work.json")
RESULT_FILE = os.path.join(OUTPUT_DIR, "candidates.json")
ENRICH_CACHE = os.path.join(OUTPUT_DIR, ".enrich_cache.json")

CHROME_BOOKMARKS = os.path.expanduser(
    "~/Library/Application Support/Google/Chrome/Default/Bookmarks"
)

DEFAULT_FOLDERS = ["设计资源", "AI相关", "视觉", "教程"]

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)

# ---------------------------------------------------------------- 域名规则

INTERNAL_HOSTS = (
    "bytedance.net", "bytedance.com", "feishu.cn", "larkoffice.com",
    "sso.", "tapd.cn", "localhost", "127.0.0.1", "10.", "192.168.",
)

NON_CONTENT_PAT = re.compile(
    r"(login|signin|signup|register|logout|password|checkout|cart|account)", re.I
)

# 工具/素材站首页：本身不是案例
RESOURCE_DOMAINS = (
    "figma.com", "sketch.com", "adobe.com", "iconfont.cn", "freepik.com",
    "mockupworld.co", "ls.graphics", "unsplash.com", "pexels.com",
    "fonts.google.com", "axure.com", "oursketch.com", "oschina.net",
    "chrome.google.com", "uimaker.com", "uishe.cn", "25xt.com",
    "xunue.com", "uigreat.com", "ui.cn", "s.muz.li",
)

# 内容/案例平台
INSPIRATION_DOMAINS = (
    "dribbble.com", "behance.net", "awwwards.com", "pinterest.",
    "zcool.com.cn", "uisdc.com", "medium.com", "youtube.com",
    "bilibili.com", "xiaohongshu.com", "douyin.com", "github.com",
    "sspai.com", "woshipm.com", "36kr.com", "juejin.cn", "vimeo.com",
)

ARTICLE_PAT = re.compile(
    r"/(p|post|posts|note|notes|article|articles|video|videos|case|cases|"
    r"detail|details|a|status|pin|pins|shot|shots|work|works|project|projects)/",
    re.I,
)

GENERIC_TITLES = {
    "首页", "主页", "home", "homepage", "登录", "login", "搜索", "search",
    "untitled", "无标题", "pinterest", "dribbble", "站酷", "优设",
}

TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "spm", "from", "share_source", "share_medium", "timestamp", "_t",
}

TOOL_DOMAINS = (
    "chatgpt.com", "openai.com", "claude.ai", "gemini.google.com",
    "tongyi.aliyun.com", "yiyan.baidu.com", "kimi.moonshot.cn",
    "doubao.com", "midjourney.com", "runwayml.com", "clipdrop.co",
    "volcengine.com", "aliyun.com", "huaweicloud.com", "cloud.baidu.com",
    "canva.com", "notion.so",
)

TOOL_PATH_PAT = re.compile(
    r"(/product/|/welcome|/gpts|/pricing|/download|/features|/solutions/)", re.I
)

AI_KEYWORDS = (
    "ai", "aigc", "人工智能", "大模型", "llm", "gpt", "chatgpt", "midjourney",
    "stable diffusion", "sora", "vibe coding", "cursor", "trae", "提示词",
    "生成式", "智能体", "agent", "文生图", "文生视频",
)

PLATFORM_ALIASES = {
    "掘金": "juejin",
    "小红书": "xiaohongshu",
    "抖音": "douyin",
    "B站": "bilibili",
    "bilibili": "bilibili",
    "微信": "wechat",
}

PLATFORM_MAP = {
    "xiaohongshu.com": "xiaohongshu",
    "xhslink.com": "xiaohongshu",
    "douyin.com": "douyin",
    "iesdouyin.com": "douyin",
    "bilibili.com": "bilibili",
    "b23.tv": "bilibili",
    "github.com": "github",
    "twitter.com": "twitter",
    "x.com": "twitter",
    "reddit.com": "reddit",
    "weixin.qq.com": "wechat",
    "mp.weixin.qq.com": "wechat",
}


def detect_platform(url: str) -> str:
    host = urlparse(url).netloc.lower()
    for domain, slug in PLATFORM_MAP.items():
        if host.endswith(domain):
            return slug
    return "other"


# ---------------------------------------------------------------- URL 处理

def normalize_url(raw: str) -> str:
    if not raw:
        return ""
    raw = raw.strip()
    if not re.match(r"^https?://", raw, re.I):
        return ""
    p = urlparse(raw)
    host = p.netloc.lower()
    if host.startswith("www."):
        host = host[4:]
    path = re.sub(r"/+$", "", p.path) or "/"
    query = [(k, v) for k, v in parse_qsl(p.query, keep_blank_values=True)
             if k.lower() not in TRACKING_PARAMS]
    return urlunparse(("https", host, path, "", urlencode(query), ""))


def fingerprint(url: str) -> str:
    return hashlib.sha1(url.encode("utf-8")).hexdigest()[:16]


def norm_title(title: str) -> str:
    title = unicodedata.normalize("NFKC", title or "").lower()
    return re.sub(r"[^0-9a-z\u4e00-\u9fa5]+", "", title)


def is_homepage(url: str) -> bool:
    return urlparse(url).path.strip("/") == ""


# ---------------------------------------------------------------- 导入

def parse_chrome_date(value) -> str:
    try:
        dt = datetime(1601, 1, 1) + __import__("datetime").timedelta(
            microseconds=int(value)
        )
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return ""


def read_chrome_bookmarks(path: str, folders: list[str]) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    items: list[dict] = []

    def walk(node, trail):
        node_type = node.get("type")
        name = node.get("name", "")
        if node_type == "url":
            if not trail or any(f in trail for f in folders):
                items.append({
                    "source_kind": "bookmark",
                    "source_url": node.get("url", ""),
                    "title": name,
                    "folder": "/".join(trail),
                    "date_added": parse_chrome_date(node.get("date_added")),
                    "raw_text": None,
                    "cover_image_url": None,
                    "author_name": None,
                })
            return
        for child in node.get("children", []) or []:
            walk(child, trail + ([name] if name else []))

    for root in data.get("roots", {}).values():
        if isinstance(root, dict):
            walk(root, [])
    return items


def read_netscape_bookmarks(path: str, folders: list[str]) -> list[dict]:
    with open(path, encoding="utf-8", errors="ignore") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    items = []
    for a in soup.find_all("a"):
        href = a.get("href", "")
        trail = []
        parent = a.parent
        while parent is not None:
            h3 = parent.find("h3", recursive=False)
            if h3:
                trail.insert(0, h3.get_text(strip=True))
            parent = parent.parent
        trail = [t for t in trail if t]
        if folders and trail and not any(f in trail for f in folders):
            continue
        items.append({
            "source_kind": "bookmark",
            "source_url": href,
            "title": a.get_text(strip=True),
            "folder": "/".join(trail),
            "date_added": a.get("add_date", ""),
            "raw_text": None,
            "cover_image_url": None,
            "author_name": None,
        })
    return items


ARCHIVE_FILES = [
    ("output/../_archive/xhs_cases.json", "xiaohongshu"),
    ("_archive/xhs_cases.json", "xiaohongshu"),
    ("_archive/cases.json", "juejin"),
    ("_archive/douyin_comments_cases.json", "douyin"),
]


def read_archives() -> list[dict]:
    items = []
    seen_files = set()
    for rel, platform in ARCHIVE_FILES:
        path = os.path.normpath(os.path.join(BASE_DIR, rel))
        if path in seen_files or not os.path.exists(path):
            continue
        seen_files.add(path)
        try:
            data = json.load(open(path, encoding="utf-8"))
        except Exception as e:
            print(f"  跳过 {path}: {e}")
            continue
        rows = data if isinstance(data, list) else data.get("cases", [])
        for row in rows:
            title = row.get("title") or row.get("note_title") or ""
            url = row.get("source_url") or row.get("originalUrl") or ""
            items.append({
                "source_kind": "archive",
                "source_url": url,
                "title": title,
                "folder": "历史抓取",
                "date_added": (row.get("create_time") or "")[:10],
                "raw_text": row.get("description") or row.get("content") or row.get("full_prompt") or "",
                "cover_image_url": row.get("cover_img") or row.get("coverImage"),
                "author_name": row.get("author") or row.get("username"),
                "source_platform": row.get("source_platform") or platform,
            })
    return items


def normalize_items(items: list[dict]) -> list[dict]:
    out = []
    for item in items:
        url = normalize_url(item.get("source_url", ""))
        if not url:
            continue
        title = re.sub(r"\s+", " ", (item.get("title") or "")).strip()
        platform = item.get("source_platform") or detect_platform(url)
        platform = PLATFORM_ALIASES.get(platform, platform)
        out.append({
            "source_url": url,
            "original_url": item.get("source_url", ""),
            "title": title,
            "folder": item.get("folder", ""),
            "source_kind": item.get("source_kind", "bookmark"),
            "source_platform": platform,
            "date_added": item.get("date_added", ""),
            "raw_text": item.get("raw_text"),
            "summary": None,
            "author_name": item.get("author_name"),
            "cover_image_url": item.get("cover_image_url"),
            "fingerprint": fingerprint(url),
            "score": None,
            "ai_score": None,
            "final_score": None,
            "verdict": "pending",
            "reasons": [],
            "risk_flags": [],
        })
    return out


def dedupe(items: list[dict]) -> tuple[list[dict], int]:
    """URL 精确去重 + 标题相似度去重，保留规则分更高的一条。"""
    by_url: dict[str, dict] = {}
    for item in items:
        old = by_url.get(item["source_url"])
        if old is None or rule_score(item)["score"] > rule_score(old)["score"]:
            by_url[item["source_url"]] = item
    unique_url = list(by_url.values())

    kept: list[dict] = []
    removed = 0
    for item in sorted(unique_url, key=lambda x: -rule_score(x)["score"]):
        title_key = norm_title(item["title"])
        duplicate = False
        if title_key and len(title_key) >= 6:
            for other in kept:
                other_key = norm_title(other["title"])
                if not other_key:
                    continue
                if title_key == other_key:
                    duplicate = True
                    break
                if abs(len(title_key) - len(other_key)) <= 8:
                    if SequenceMatcher(None, title_key, other_key).ratio() >= 0.93:
                        duplicate = True
                        break
        if duplicate:
            removed += 1
            continue
        kept.append(item)
    return kept, removed


# ---------------------------------------------------------------- 规则评分

def rule_score(item: dict) -> dict:
    """返回 {score, reasons, risk_flags}，0-100。"""
    url = item["source_url"]
    title = item.get("title") or ""
    host = urlparse(url).netloc
    path = urlparse(url).path
    score = 50
    reasons: list[str] = []
    risks: list[str] = []

    if any(h in host for h in INTERNAL_HOSTS):
        return {"score": 0, "reasons": ["内部/企业站点"], "risk_flags": ["internal"]}

    if NON_CONTENT_PAT.search(path) or NON_CONTENT_PAT.search(url):
        score -= 40
        risks.append("non_content")
        reasons.append("登录/搜索/账户页")

    title_key = norm_title(title)
    if not title:
        score -= 25
        risks.append("no_title")
        reasons.append("缺少标题")
    elif title_key in GENERIC_TITLES or len(title_key) <= 2:
        score -= 25
        risks.append("generic_title")
        reasons.append("标题过于笼统")

    if item["source_kind"] == "archive":
        score += 12
        reasons.append("已有正文/摘要")

    if is_homepage(url):
        score -= 22
        risks.append("homepage")
        reasons.append("站点首页而非具体案例")
    elif ARTICLE_PAT.search(path):
        score += 10
        reasons.append("详情页链接")

    if any(d in host for d in RESOURCE_DOMAINS):
        score -= 28
        risks.append("resource_site")
        reasons.append("工具/素材站")
    elif any(d in host for d in TOOL_DOMAINS):
        if is_homepage(url) or TOOL_PATH_PAT.search(path):
            score -= 30
            risks.append("tool_page")
            reasons.append("AI 工具产品页")
        else:
            score -= 12
            risks.append("tool_page")
            reasons.append("工具站内容")
    elif any(d in host for d in INSPIRATION_DOMAINS):
        score += 8
        reasons.append("内容平台")

    haystack = " ".join([
        title,
        item.get("summary") or "",
        (item.get("raw_text") or "")[:300],
    ]).lower()
    if any(k in haystack for k in AI_KEYWORDS):
        score += 6
        reasons.append("AI 主题相关")

    folder = item.get("folder", "")
    if "AI相关" in folder:
        score += 6
        reasons.append("AI 相关收藏")
    elif "设计资源" in folder or "视觉" in folder:
        score += 4

    date_str = item.get("date_added") or ""
    year = None
    m = re.match(r"(\d{4})", date_str)
    if m:
        year = int(m.group(1))
    if year:
        if year >= 2024:
            score += 12
            reasons.append(f"{year} 年收藏")
        elif year >= 2022:
            score += 8
            reasons.append(f"{year} 年收藏")
        elif year >= 2020:
            score += 2
        else:
            score -= 10
            risks.append("old")
            reasons.append(f"{year} 年收藏，偏旧")

    if item.get("raw_text"):
        length = len(item["raw_text"])
        if length >= 200:
            score += 6
        elif length >= 80:
            score += 3

    score = max(0, min(100, score))
    return {"score": score, "reasons": reasons, "risk_flags": risks}


def apply_rules(items: list[dict]) -> None:
    for item in items:
        result = rule_score(item)
        item["score"] = result["score"]
        item["reasons"] = result["reasons"]
        item["risk_flags"] = result["risk_flags"]
        item["final_score"] = result["score"]
        if "internal" in result["risk_flags"]:
            item["verdict"] = "reject"
        elif result["score"] >= 70:
            item["verdict"] = "approve"
        elif result["score"] >= 50:
            item["verdict"] = "review"
        else:
            item["verdict"] = "reject"


# ---------------------------------------------------------------- 页面补全

def load_env() -> None:
    """读取 crawler/.env 与 crawler/.env.local，不覆盖已有环境变量。"""
    for name in (".env", ".env.local"):
        path = os.path.join(BASE_DIR, name)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = value


def load_json(path: str, default):
    try:
        return json.load(open(path, encoding="utf-8"))
    except Exception:
        return default


def save_json(path: str, data) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


def enrich_item(item: dict) -> dict:
    url = item["source_url"]
    headers = {"User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"}
    resp = requests.get(url, headers=headers, timeout=12, allow_redirects=True)
    resp.raise_for_status()
    resp.encoding = resp.apparent_encoding or resp.encoding
    soup = BeautifulSoup(resp.text, "html.parser")

    def meta(name: str) -> str:
        tag = soup.find("meta", attrs={"property": name}) or soup.find(
            "meta", attrs={"name": name}
        )
        return (tag.get("content") or "").strip() if tag else ""

    page_title = meta("og:title") or (soup.title.get_text(strip=True) if soup.title else "")
    desc = meta("og:description") or meta("description") or ""
    image = meta("og:image")
    author = meta("author") or meta("og:article:author")

    if page_title:
        item["title"] = re.sub(r"\s+", " ", page_title)[:160]
    if desc:
        item["summary"] = re.sub(r"\s+", " ", desc)[:500]
    if image:
        item["cover_image_url"] = image
    if author:
        item["author_name"] = author[:80]
    return item


def enrich(items: list[dict], limit: int) -> None:
    cache = load_json(ENRICH_CACHE, {})
    targets = sorted(
        [x for x in items if x["score"] is not None and x["score"] >= 40],
        key=lambda x: -x["score"],
    )[:limit]

    print(f"补全页面信息：{len(targets)} 条（已有缓存 {len(cache)} 条）")
    ok = fail = cached = 0
    for index, item in enumerate(targets, 1):
        key = item["fingerprint"]
        if key in cache:
            item.update(cache[key])
            cached += 1
            continue
        try:
            enrich_item(item)
            cache[key] = {
                "title": item.get("title"),
                "summary": item.get("summary"),
                "cover_image_url": item.get("cover_image_url"),
                "author_name": item.get("author_name"),
            }
            ok += 1
        except Exception as exc:
            item["risk_flags"] = list(set(item.get("risk_flags", []) + ["unreachable"]))
            fail += 1
            if index <= 5 or index % 20 == 0:
                print(f"  [{index}/{len(targets)}] 失败 {urlparse(item['source_url']).netloc}: {exc}")
        time.sleep(1.0)
        if index % 10 == 0:
            save_json(ENRICH_CACHE, cache)
            print(f"  进度 {index}/{len(targets)}（成功 {ok}，失败 {fail}，缓存 {cached}）")
    save_json(ENRICH_CACHE, cache)
    print(f"补全完成：成功 {ok}，失败 {fail}，命中缓存 {cached}")


# ---------------------------------------------------------------- AI 评分

AI_PROMPT = """你是灵感案例库的审核员。请判断下面这条内容是否值得收录进「AI 创作 / Vibe Coding 灵感库」。

评分维度（各 20 分）：
1. 原创性：是否是具体作品/项目，而不是平台首页、工具介绍或泛泛教程。
2. 过程价值：是否有可学习的过程、方法、提示词或制作细节。
3. 视觉质量：是否有明确的视觉/作品呈现。
4. 可复用性：读者能否据此复刻或获得启发。
5. 主题相关：是否与 AI 创作、设计、开发、内容生产相关。

只输出 JSON 数组，不要解释。每项格式：
{"id": 序号, "score": 0-100, "tags": ["标签"], "risk": "none|copyright|low_content|off_topic", "reason": "一句话理由"}

待评估内容：
"""


def ai_score(items: list[dict], batch_size: int = 10) -> None:
    key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if not key:
        print("未设置 DEEPSEEK_API_KEY，跳过 AI 评分（规则分照常保留）")
        return

    api = os.environ.get("DEEPSEEK_API_URL", "https://api.deepseek.com/chat/completions")
    model = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
    targets = [x for x in items if x["verdict"] != "reject"]
    print(f"AI 评分：{len(targets)} 条")

    for start in range(0, len(targets), batch_size):
        batch = targets[start:start + batch_size]
        payload_items = []
        for i, item in enumerate(batch):
            payload_items.append({
                "id": i,
                "title": item.get("title"),
                "summary": (item.get("summary") or item.get("raw_text") or "")[:600],
                "url": item["source_url"],
                "folder": item.get("folder"),
                "date": item.get("date_added"),
            })
        body = {
            "model": model,
            "messages": [
                {"role": "system", "content": "你只输出合法 JSON。"},
                {"role": "user", "content": AI_PROMPT + json.dumps(payload_items, ensure_ascii=False)},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }
        try:
            resp = requests.post(
                api,
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json=body,
                timeout=90,
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            rows = parsed if isinstance(parsed, list) else parsed.get("results", [])
        except Exception as exc:
            print(f"  批次 {start // batch_size + 1} 失败：{exc}")
            continue

        for row in rows:
            try:
                idx = int(row.get("id"))
                item = batch[idx]
            except Exception:
                continue
            ai = max(0, min(100, int(row.get("score", 0))))
            item["ai_score"] = ai
            item["final_score"] = round(ai * 0.7 + item["score"] * 0.3)
            if row.get("tags"):
                item["tags"] = row["tags"][:6]
            if row.get("risk") and row["risk"] != "none":
                item["risk_flags"] = list(set(item.get("risk_flags", []) + [row["risk"]]))
            if row.get("reason"):
                item["reasons"] = [row["reason"]] + item.get("reasons", [])
            if item["final_score"] >= 70:
                item["verdict"] = "approve"
            elif item["final_score"] >= 50:
                item["verdict"] = "review"
            else:
                item["verdict"] = "reject"
        print(f"  进度 {min(start + batch_size, len(targets))}/{len(targets)}")
        time.sleep(0.5)


# ---------------------------------------------------------------- 命令

def cmd_import(args) -> list[dict]:
    raw: list[dict] = []

    if args.chrome:
        path = os.path.expanduser(args.chrome)
        if os.path.exists(path):
            folders = [x.strip() for x in args.folders.split(",") if x.strip()]
            raw += read_chrome_bookmarks(path, folders)
            print(f"Chrome 书签：{len(raw)} 条（文件夹过滤：{', '.join(folders)}）")
        else:
            print(f"未找到 Chrome 书签：{path}")

    if args.netscape:
        path = os.path.expanduser(args.netscape)
        folders = [x.strip() for x in args.folders.split(",") if x.strip()]
        raw += read_netscape_bookmarks(path, folders)
        print(f"Netscape 书签：{len(raw)} 条")

    if not args.no_archive:
        archived = read_archives()
        raw += archived
        print(f"历史抓取：{len(archived)} 条")

    items = normalize_items(raw)
    items, removed = dedupe(items)
    print(f"归一化 {len(items)} 条，去重移除 {removed} 条")
    save_json(WORK_FILE, items)
    print(f"已写入 {WORK_FILE}")
    return items


def cmd_enrich(args) -> list[dict]:
    items = load_json(WORK_FILE, [])
    if not items:
        print("没有工作数据，请先执行 import")
        return []
    enrich(items, args.limit)
    save_json(WORK_FILE, items)
    return items


def cmd_score(args) -> list[dict]:
    items = load_json(WORK_FILE, [])
    if not items:
        print("没有工作数据，请先执行 import")
        return []
    apply_rules(items)
    if args.ai:
        print("检查 DeepSeek API Key …")
        ai_score(items)
        apply_rules_after_ai(items)
    save_json(WORK_FILE, items)
    save_json(RESULT_FILE, items)
    print(f"已写入 {RESULT_FILE}")
    return items


def apply_rules_after_ai(items: list[dict]) -> None:
    for item in items:
        if item.get("ai_score") is None:
            if "internal" in item.get("risk_flags", []):
                item["verdict"] = "reject"
            continue
        flags = item.get("risk_flags", [])
        if "internal" in flags:
            item["verdict"] = "reject"
        elif item["final_score"] >= 70:
            item["verdict"] = "approve"
        elif item["final_score"] >= 50:
            item["verdict"] = "review"
        else:
            item["verdict"] = "reject"


def cmd_report(args) -> None:
    items = load_json(RESULT_FILE, None) or load_json(WORK_FILE, [])
    if not items:
        print("没有结果，请先执行 score")
        return
    total = len(items)
    verdicts: dict[str, int] = {}
    platforms: dict[str, int] = {}
    for item in items:
        verdicts[item["verdict"]] = verdicts.get(item["verdict"], 0) + 1
        platform = item.get("source_platform", "other")
        platforms[platform] = platforms.get(platform, 0) + 1

    ai_used = sum(1 for x in items if x.get("ai_score") is not None)
    print(f"\n候选总数：{total}（AI 已评分 {ai_used} 条）")
    print("判定分布：" + "，".join(f"{k}={v}" for k, v in verdicts.items()))
    print("平台分布：" + "，".join(
        f"{k}={v}" for k, v in sorted(platforms.items(), key=lambda x: -x[1])
    ))

    approved = sorted(
        [x for x in items if x["verdict"] == "approve"],
        key=lambda x: -(x.get("final_score") or 0),
    )
    print(f"\n可直接通过 Top {min(15, len(approved))}：")
    for item in approved[:15]:
        print(f"  [{item.get('final_score')}] {item.get('title')[:46]}  {item['source_url'][:60]}")

    review = [x for x in items if x["verdict"] == "review"]
    print(f"\n待人工复核：{len(review)} 条")


def cmd_run(args) -> None:
    cmd_import(args)
    cmd_enrich(args)
    cmd_score(args)
    cmd_report(args)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="候选案例筛选管线")
    parser.add_argument("command", choices=["import", "enrich", "score", "report", "run"])
    parser.add_argument("--chrome", default=CHROME_BOOKMARKS, help="Chrome Bookmarks 文件路径")
    parser.add_argument("--netscape", default="", help="浏览器导出的书签 HTML 路径")
    parser.add_argument("--folders", default=",".join(DEFAULT_FOLDERS), help="只导入包含这些关键词的书签文件夹")
    parser.add_argument("--no-archive", action="store_true", help="不导入历史抓取数据")
    parser.add_argument("--limit", type=int, default=200, help="补全页面信息的上限")
    parser.add_argument("--ai", action="store_true", help="启用 DeepSeek 语义评分")
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    load_env()
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    {
        "import": cmd_import,
        "enrich": cmd_enrich,
        "score": cmd_score,
        "report": cmd_report,
        "run": cmd_run,
    }[args.command](args)


if __name__ == "__main__":
    main()
