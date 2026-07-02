# Changelog

## v0.8 - 2026-07-02

### 启动页（landing.html）全面改版
- 新增 WebGL Shader 气泡（Three.js）：彩虹色 Fresnel 边缘 + 流光效果 + 透明内核
- 气泡尺寸 504px，相机距离同步调整，边缘效果清晰锐利
- 主标题 "Vibe Bubble" 使用 `clamp(96px, 24vw, 240px)` 响应式大字号，紫蓝青渐变
- 新增 Canvas 粒子气泡背景（上浮、摇摆、三层径向渐变、高光、描边）
- "发现灵感"按钮与标题间距 300px，紫色渐变 hover 效果
- 新增 "灵感气泡" logo + 右上角"项目介绍"入口
- 呼吸动画周期 8s

### 灵感库页（gallery.html）改版
- 去除右上角"已收录 46 个灵感"统计，替换为"项目介绍"入口
- 背景气泡效果替换为启动页同款 Canvas 粒子
- 背景音乐替换为本地 mp3，音量 20%，首次交互后自动播放
- 底部背景文字去除
- 气泡漂浮动作加强（速度 0.5~1.0，幅度 3~7）
- 气泡间软碰撞检测（边缘轻弹开，可配置弹开力度）
- 随机模式：气泡从正中弹出 + Back Ease Out 弹动效果
- 随机模式气泡放大 1 倍（2.6x）
- 随机模式左右滑动：250px 边缘触发 + 惯性自动切换 + 预显示下一个气泡
- 滑动音效：向右 520Hz，向左 380Hz

### 新增项目介绍页（about.html）
- 复用 detail.html 视觉体系：五彩干涉背景、玻璃拟态卡片
- 内容包含：项目背景、目标用户、项目定位、开发者介绍、联系方式
- 滚动入场动画（IntersectionObserver）
- 联系链接：小红书、抖音、邮箱、微信

### 链接更新
- landing.html / gallery.html 的"项目介绍"入口统一指向 about.html

### 文件变更
```
crawler/output/
  + about.html          (新增：项目介绍页)
  + landing.html        (重写：WebGL 气泡 + 全新布局)
  + gallery.html        (重写：粒子背景 + 碰撞 + 随机模式)
  + detail.html         (重写：玻璃拟态详情页)
  + index.html          (修改：重定向 landing.html)
  + audio/bgm.mp3       (新增：背景音乐)
  + data/cases.js       (新增：灵感数据)
  + DEPLOY.md           (新增：部署指南)
  ~ data/review_workflow.html (修改)
```
