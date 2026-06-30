"""
Vibe Coding 灵感库 - 爬虫主入口脚本
========================================
本脚本用于低频次、合规地抓取各平台 Vibe Coding 相关案例数据，
仅用于个人练手学习，不做商业用途，不执行高频请求。

【Robots 协议与合规声明】
- 各平台均有各自的 robots.txt 协议，本脚本严格遵循"低频次、不打扰"原则
- 每次请求前强制随机延时 2-5 秒，模拟真人浏览节奏
- 请求头模拟真实浏览器环境
- 不绕过验证码、不破解签名、不伪造登录态
- 小红书 / X(Twitter) 反爬严格，默认返回模拟数据并给出技术框架参考
- 如遇平台返回 403/429，脚本会自动跳过该平台，不会暴力重试

【使用方法】
1. 安装依赖（首次运行前执行）：
   pip install -r requirements.txt

2. 运行爬虫（抓取全部平台）：
   python main.py

3. 仅抓取指定平台：
   python main.py --platform juejin
   python main.py --platform bilibili

4. 指定输出文件路径：
   python main.py --output ../server/src/data/cases.json

【输出格式】
- 标准 cases.json，与前端数据格式完全兼容
- 自动按 source_url 去重合并，不会覆盖已有数据
- 去重记录持久化在 output/.seen_urls.json
"""

import argparse
import sys
from datetime import datetime

from config import KEYWORDS, PLATFORM_CONFIG, OUTPUT_FILE, SEEN_URLS_FILE
from platforms import JuejinCrawler, BilibiliCrawler, XiaohongshuCrawler, XTwitterCrawler
from utils import Deduplicator, CaseStore


# ============================================
# 平台适配器映射表
# ============================================
PLATFORM_CRAWLERS: dict[str, type] = {
    "juejin": JuejinCrawler,
    "bilibili": BilibiliCrawler,
    "xiaohongshu": XiaohongshuCrawler,
    "x": XTwitterCrawler,
}


def run_crawler(
    target_platforms: list[str] | None = None,
    output_path: str = OUTPUT_FILE,
    seen_urls_path: str = SEEN_URLS_FILE,
) -> int:
    """
    执行爬虫主流程

    Args:
        target_platforms: 指定抓取的平台列表，None 表示全部
        output_path: 输出 JSON 文件路径
        seen_urls_path: 去重记录文件路径

    Returns:
        本次运行新增的案例总数
    """
    print("=" * 60)
    print(" Vibe Coding 灵感库 - 爬虫启动")
    print(f" 启动时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f" 抓取关键词: {', '.join(KEYWORDS)}")
    print("=" * 60)

    # 初始化去重器和数据存储器
    deduplicator = Deduplicator(filepath=seen_urls_path)
    store = CaseStore(filepath=output_path)

    # 确定本次要抓取的 platforms
    if target_platforms:
        platforms_to_run = [
            name for name in target_platforms if name in PLATFORM_CRAWLERS
        ]
        if not platforms_to_run:
            print(f"[错误] 无效的平台名称，可选: {', '.join(PLATFORM_CRAWLERS.keys())}")
            return 0
    else:
        platforms_to_run = [
            name for name, cfg in PLATFORM_CONFIG.items()
            if cfg.get("enabled", True) and name in PLATFORM_CRAWLERS
        ]

    print(f"[计划] 本次抓取平台: {', '.join(platforms_to_run)}")
    print()

    total_new = 0
    platform_stats: dict[str, int] = {}

    # 逐个平台执行抓取
    for platform_name in platforms_to_run:
        config = PLATFORM_CONFIG.get(platform_name, {})
        platform_display = config.get("name", platform_name)
        crawler_cls = PLATFORM_CRAWLERS[platform_name]

        print("-" * 60)
        print(f"[平台] {platform_display} ({platform_name})")

        # 平台特殊提示
        note = config.get("note", "")
        if note:
            print(f"[提示] {note}")

        try:
            # 实例化适配器并执行抓取
            crawler = crawler_cls(deduplicator=deduplicator, store=store)
            count = crawler.crawl(KEYWORDS)
            platform_stats[platform_display] = count
            total_new += count
            print(f"[完成] {platform_display} 成功抓取 {count} 条案例")

        except Exception as e:
            print(f"[异常] {platform_display} 抓取失败: {type(e).__name__}: {e}")
            platform_stats[platform_display] = 0

        print()

    # 保存去重记录
    deduplicator.save()

    # 合并已有数据并输出最终文件
    print("-" * 60)
    print("[汇总] 开始合并并保存数据...")
    merged_total = store.merge_with_existing()

    # 输出统计报告
    print()
    print("=" * 60)
    print(" 爬虫运行报告")
    print("=" * 60)
    for name, count in platform_stats.items():
        status = "成功" if count > 0 else "无数据/失败"
        print(f"  {name:12s} | 新增 {count:3d} 条 | {status}")
    print("-" * 60)
    print(f" 本次新增: {total_new} 条")
    print(f" 合并后总: {merged_total} 条")
    print(f" 输出文件: {output_path}")
    print("=" * 60)

    return total_new


def main() -> None:
    """命令行入口"""
    parser = argparse.ArgumentParser(
        description="Vibe Coding 灵感库 - 轻量化合规爬虫",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python main.py                          # 抓取全部平台
  python main.py --platform juejin        # 仅抓取掘金
  python main.py --platform bilibili --output ./data/cases.json
        """,
    )

    parser.add_argument(
        "--platform",
        type=str,
        default=None,
        help=f"指定单个平台抓取，可选: {', '.join(PLATFORM_CRAWLERS.keys())}",
    )

    parser.add_argument(
        "--output",
        type=str,
        default=OUTPUT_FILE,
        help=f"输出 JSON 文件路径，默认: {OUTPUT_FILE}",
    )

    parser.add_argument(
        "--seen-urls",
        type=str,
        default=SEEN_URLS_FILE,
        help=f"去重记录文件路径，默认: {SEEN_URLS_FILE}",
    )

    args = parser.parse_args()

    target = [args.platform] if args.platform else None

    try:
        total = run_crawler(
            target_platforms=target,
            output_path=args.output,
            seen_urls_path=args.seen_urls,
        )
        sys.exit(0 if total >= 0 else 1)
    except KeyboardInterrupt:
        print("\n[中断] 用户手动终止爬虫")
        sys.exit(130)
    except Exception as e:
        print(f"\n[致命错误] {type(e).__name__}: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
