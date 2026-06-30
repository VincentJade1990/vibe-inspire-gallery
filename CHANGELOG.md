# Vibe Coding 灵感库 - 演进日志

## v0.1 - 项目骨架搭建
- 搭建前后端分离架构
  - 前端：Vite + React + TypeScript + TailwindCSS + Framer Motion
  - 后端：Node.js Express + 本地JSON存储
  - 爬虫：Python3 + requests + BeautifulSoup4
- 设计目录规范：`src/views`, `src/components`, `src/store`, `src/api`, `src/utils`

## v0.2 - 爬虫模块开发
- 实现多平台爬虫框架（config.py + utils.py + platforms/适配器）
- 完成小红书、抖音、掘金、B站、X的爬虫适配
- 输出标准化 `cases.json` 供前端渲染
- 小红书爬取触发反爬（-412错误），部分平台使用Mock数据兜底

## v0.3 - 气泡Demo原型
- 创建 `bubble_demo.html`：纯Canvas气泡沉浸体验
- 46条小红书案例数据注入气泡
- 实现基础交互：漂浮、碰撞、点击破碎、音频反馈

## v0.4 - 交互升级
- 气泡改为完美圆形，移除白色外环
- 简化气泡内容：仅显示项目标题（移除用户名、点赞数）
- 新增鼠标交互：滑过扰动水流效果
- 新增长按拖拽：气泡可被拖动，其他气泡被挤开
- 移除hover效果

## v0.5 - 数据质量与审核体系
- 用户反馈：数据不符合预期、描述太简单、缺图片
- 提出「本地JSON + 人工审核」方案，用户接受
- 建立三级目录：`draft/` / `approved/` / `rejected/` / `screenshots/`
- 重新抓取 post_01 完整评论（77条 + 图片URL）
- 剩余11个链接触发反爬（300031），暂用旧文本数据

## v0.6 - 审核工作台
- 创建 `review_workflow.html`：暗色主题人工审核界面
- 功能：筛选（全部/待审核/有价值/无价值/有图片）、搜索、帖子切换
- 操作：有价值 / 无价值 / 编辑（标题/标签/难度/描述）
- 图片灯箱预览、JSON导出
- 注入137条评论供用户审核

## v0.7 - 用户审核与Demo更新
- 用户完成人工审核，导出 `approved_cases_2026-06-30.json`
- 标注36条有价值评论
- 7条含图片（28张），29条纯文本
- `bubble_demo.html` 数据更新为36条用户审核版
- 气泡大小按点赞数分层（高赞>20 / 中赞5-20 / 低赞<5）
