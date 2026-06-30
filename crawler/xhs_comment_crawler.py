#!/usr/bin/env python3
"""
小红书评论爬虫 - Playwright 版本
抓取11个帖子的完整评论数据（包括评论文本和图片URL）
"""

import json
import os
import re
import sys
import time
from datetime import datetime

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

# 输出路径
OUTPUT_DIR = "/Users/yushaozu/Library/Application Support/TRAE SOLO CN/ModularData/ai-agent/work-mode-projects/6a3ddd38c5c4ad3d11908c89/vibe-inspire-gallery/crawler/output/data"
SCREENSHOT_DIR = os.path.join(OUTPUT_DIR, "screenshots")
DRAFT_DIR = os.path.join(OUTPUT_DIR, "draft")
JSON_OUTPUT = os.path.join(DRAFT_DIR, "xhs_all_posts_full.json")

# 确保目录存在
os.makedirs(SCREENSHOT_DIR, exist_ok=True)
os.makedirs(DRAFT_DIR, exist_ok=True)

# 11个小红书帖子链接
URLS = [
    "https://www.xiaohongshu.com/explore/699d7ccf000000001a02c1cd?xsec_token=ABuui4tLP8E-WpRQocYrLcoqkJLynaD2TsqAxStOewcS8=&xsec_source=pc_search&source=web_explore_feed",
    "https://www.xiaohongshu.com/explore/69a035e1000000001502055b?xsec_token=ABOGr2eMEWDeEoCEb3pmcm4N4Q5pA8_av8hExyh3i_l5s=&xsec_source=pc_search&source=web_explore_feed",
    "https://www.xiaohongshu.com/explore/6a391122000000002201a0e2?xsec_token=ABxgiLRO4GPKQxmBjsqOmAjFMaWRTNOduXoyXKvAu6XfA=&xsec_source=pc_search&source=web_explore_feed",
    "https://www.xiaohongshu.com/explore/6a0bdf4c000000003701cd97?xsec_token=AB7X0DarhiNqIjXvQHlk_2i0ZUP158_1f-PfF9H50rvKk=&xsec_source=pc_search&source=web_explore_feed",
    "https://www.xiaohongshu.com/explore/6a02ea2b00000000070290d6?xsec_token=ABZf-vGpZPA_Uk5nupDnus9ySZSvYuPdm7ZrENhWnoPak=&xsec_source=pc_search&source=web_explore_feed",
    "https://www.xiaohongshu.com/explore/6a36a67c000000001603f38c?xsec_token=ABuYWbziKWIoIEfXiPtSVNQPtwlE-G_a9LkpwLrXxpwnQ=&xsec_source=pc_search&source=web_explore_feed",
    "https://www.xiaohongshu.com/explore/69abf9a5000000000d008b81?xsec_token=AB2yaii7cFSeXeYJis_7zxnkrFvub4DyNvbOGJ1s9682I=&xsec_source=pc_search&source=web_explore_feed",
    "https://www.xiaohongshu.com/explore/69f3ed830000000013020401?xsec_token=ABH1i-URXaI9SLI0huW2DWY-Uq4I1y5qJXHf6MrDqEKF4=&xsec_source=pc_search&source=web_explore_feed",
    "https://www.xiaohongshu.com/explore/69900b52000000000d008247?xsec_token=ABGP4TlPBcr51tj8gFZBDTsib6qixTiN1Nc14px-RwAq4=&xsec_source=pc_search&source=web_explore_feed",
    "https://www.xiaohongshu.com/explore/699f5173000000001b01dc8c?xsec_token=ABDD-C8oE4AyfEaMTNY7uVZDXGsZHFT11ipzmehb9z-Sk=&xsec_source=pc_search&source=web_explore_feed",
    "https://www.xiaohongshu.com/explore/69a54cc6000000002303a3a6?xsec_token=AB27snDa96MyyzLgMperFk53OAwAjjcH0c6qU_OVYt5x4=&xsec_source=pc_search&source=web_explore_feed",
]

# JavaScript 提取函数
EXTRACT_JS = r"""
async function extractFullComments() {
  const allComments = [];
  const seenIds = new Set();
  
  // 点击展开按钮
  document.querySelectorAll('button, div, span, a').forEach(btn => {
    const text = btn.innerText?.trim();
    if (text && (text.includes('展开') || text.includes('查看更多') || text === '展开')) {
      try { btn.click(); } catch(e) {}
    }
  });
  
  // 滚动加载
  for (let i = 0; i < 5; i++) {
    window.scrollBy(0, 1000);
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // 提取评论
  const commentItems = document.querySelectorAll('.comment-item, .parent-comment, [class*="comment-item"], [class*="parent-comment"]');
  
  commentItems.forEach((item, index) => {
    const userEl = item.querySelector('a[href*="user"] .name, a[href*="user"] span, [class*="name"], [class*="user-name"]');
    const username = userEl?.innerText?.trim() || '匿名';
    
    const contentEl = item.querySelector('[class*="content"], [class*="comment-content"]');
    const content = contentEl?.innerText?.trim() || '';
    
    const likeEl = item.querySelector('[class*="like"], [class*="count"]');
    let likes = 0;
    if (likeEl) {
      const likeText = likeEl.innerText?.trim();
      const match = likeText?.match(/(\d+)/);
      if (match) likes = parseInt(match[1]);
    }
    
    // 提取评论中的图片URL（排除头像和图标）
    const images = [];
    item.querySelectorAll('img').forEach(img => {
      const src = img.src;
      if (src && !src.includes('avatar') && !src.includes('profile') && !src.includes('icon') && src.startsWith('http')) {
        images.push(src);
      }
    });
    
    const timeEl = item.querySelector('[class*="time"], [class*="date"]');
    const time = timeEl?.innerText?.trim() || '';
    
    const isReply = content.startsWith('回复') || item.querySelector('[class*="reply"]') !== null;
    
    const id = username + '_' + content.substring(0, 20).replace(/\s/g, '_');
    
    if (content.length > 3 && !seenIds.has(id)) {
      seenIds.add(id);
      allComments.push({
        index: allComments.length,
        username: username,
        content: content,
        likes: likes,
        images: images,
        time: time,
        isReply: isReply
      });
    }
  });
  
  return {
    url: window.location.href,
    title: document.title,
    totalComments: allComments.length,
    comments: allComments
  };
}

return await extractFullComments();
"""

# 提取作者信息的 JS
EXTRACT_AUTHOR_JS = """
() => {
  // 尝试多种方式提取作者
  const authorSelectors = [
    'a[href*="user"] .name',
    'a[href*="user"] span',
    '[class*="author"] [class*="name"]',
    '[class*="nickname"]',
    '[class*="user-name"]',
    '.author-name',
    '.user-name'
  ];
  for (const sel of authorSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText && el.innerText.trim().length > 0 && el.innerText.trim().length < 50) {
      return el.innerText.trim();
    }
  }
  return '';
}
"""


def get_short_id(url: str) -> str:
    """从URL中提取explore/后面的8位字符"""
    match = re.search(r'/explore/([a-f0-9]{8,})', url)
    if match:
        return match.group(1)[:8]
    return "unknown"


def crawl_post(page, url: str, index: int) -> dict:
    """抓取单个帖子的评论数据"""
    short_id = get_short_id(url)
    print(f"\n[{index+1}/11] 正在处理: {short_id}")
    
    result = {
        "post_url": url,
        "post_title": "",
        "author": "",
        "screenshot": "",
        "comments": []
    }
    
    max_retries = 2
    for attempt in range(max_retries):
        try:
            # 导航到页面
            print(f"  导航到页面... (尝试 {attempt+1}/{max_retries})")
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            
            # 等待页面加载
            print(f"  等待页面加载...")
            page.wait_for_timeout(5000)
            
            # 再次点击展开按钮
            page.evaluate("""() => {
                document.querySelectorAll('button, div, span, a').forEach(btn => {
                    const text = btn.innerText?.trim();
                    if (text && (text.includes('展开') || text.includes('查看更多') || text === '展开')) {
                        try { btn.click(); } catch(e) {}
                    }
                });
            }""")
            page.wait_for_timeout(2000)
            
            # 滚动加载更多评论
            print(f"  滚动加载评论...")
            for i in range(5):
                page.evaluate("window.scrollBy(0, 1000)")
                page.wait_for_timeout(1500)
            
            # 再次点击展开
            page.evaluate("""() => {
                document.querySelectorAll('button, div, span, a').forEach(btn => {
                    const text = btn.innerText?.trim();
                    if (text && (text.includes('展开') || text.includes('查看更多') || text === '展开')) {
                        try { btn.click(); } catch(e) {}
                    }
                });
            }""")
            page.wait_for_timeout(2000)
            
            # 提取评论数据
            print(f"  提取评论数据...")
            data = page.evaluate(EXTRACT_JS)
            
            result["post_title"] = data.get("title", "")
            result["comments"] = data.get("comments", [])
            print(f"  提取到 {len(result['comments'])} 条评论")
            
            # 提取作者
            author = page.evaluate(EXTRACT_AUTHOR_JS)
            if author:
                result["author"] = author
                print(f"  作者: {author}")
            
            # 截图
            screenshot_path = os.path.join(SCREENSHOT_DIR, f"post_{index+1:02d}_{short_id}_fullpage.png")
            print(f"  截取整页截图...")
            page.screenshot(path=screenshot_path, full_page=True)
            result["screenshot"] = screenshot_path
            print(f"  截图已保存: {screenshot_path}")
            
            break  # 成功，跳出重试循环
            
        except PlaywrightTimeout:
            print(f"  超时，正在重试...")
            if attempt == max_retries - 1:
                print(f"  最终失败，跳过此链接")
        except Exception as e:
            print(f"  错误: {e}")
            if attempt == max_retries - 1:
                print(f"  最终失败，跳过此链接")
    
    return result


def main():
    print("=" * 60)
    print("小红书评论爬虫 - Playwright")
    print(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"共 {len(URLS)} 个链接")
    print("=" * 60)
    
    all_posts = []
    
    with sync_playwright() as p:
        # 启动浏览器
        print("\n启动浏览器...")
        browser = p.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
            ]
        )
        
        # 创建上下文
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
            locale="zh-CN",
            timezone_id="Asia/Shanghai",
        )
        
        # 添加额外脚本隐藏自动化特征
        context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
        """)
        
        page = context.new_page()
        
        # 处理每个链接
        for i, url in enumerate(URLS):
            post_data = crawl_post(page, url, i)
            all_posts.append(post_data)
            
            # 间隔等待，避免触发反爬
            if i < len(URLS) - 1:
                wait_time = 3
                print(f"  等待 {wait_time} 秒后处理下一个...")
                time.sleep(wait_time)
        
        # 关闭浏览器
        browser.close()
        print("\n浏览器已关闭")
    
    # 构建最终输出
    output = {
        "source": "xiaohongshu",
        "crawl_time": datetime.now().strftime("%Y-%m-%d"),
        "posts": all_posts
    }
    
    # 保存 JSON
    with open(JSON_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 60)
    print(f"爬取完成!")
    print(f"总帖子数: {len(all_posts)}")
    total_comments = sum(len(p["comments"]) for p in all_posts)
    print(f"总评论数: {total_comments}")
    print(f"JSON 输出: {JSON_OUTPUT}")
    print("=" * 60)


if __name__ == "__main__":
    main()
