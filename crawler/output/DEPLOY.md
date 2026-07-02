# Vibe Bubble 部署指南

## 方案一：Vercel 部署（推荐）

Vercel 对静态站点支持最好，国内访问有香港 CDN 节点，速度较快。

### 步骤 1：创建 Git 仓库

```bash
# 进入输出目录
cd /path/to/vibe-inspire-gallery/crawler/output

# 初始化 git 仓库
git init
git add .
git commit -m "Initial deployment"

# 在 GitHub 上创建新仓库（如 vibebubble-site），然后推送
git remote add origin https://github.com/你的用户名/vibebubble-site.git
git branch -M main
git push -u origin main
```

### 步骤 2：Vercel 一键部署

1. 打开 https://vercel.com/new
2. 选择 GitHub 上的 `vibebubble-site` 仓库
3. Framework Preset 选择 **Other**（纯静态站点）
4. Root Directory 保持默认（`.`）
5. 点击 Deploy

### 步骤 3：绑定域名 vibebubble.co

1. 在 Vercel Dashboard 进入项目 → Settings → Domains
2. 添加域名 `vibebubble.co`
3. Vercel 会提示你添加 DNS 记录，通常是一个 **A 记录**：
   - 类型：A
   - 名称：@（或 www）
   - 值：`76.76.21.21`（Vercel 的 Anycast IP）
4. 去你的域名注册商（Namecheap/阿里云等）的 DNS 管理页面添加该记录
5. 等待 DNS 生效（通常 5-30 分钟）

---

## 方案二：Cloudflare Pages 部署

Cloudflare 全球 CDN 覆盖广，国内访问稳定。

### 步骤

1. 打开 https://dash.cloudflare.com
2. Pages → Create a project → Connect to Git
3. 选择 GitHub 仓库，Build settings：
   - Framework preset: None
   - Build command: 留空
   - Build output directory: 留空（根目录）
4. 部署完成后，进入项目 → Custom domains → 添加 `vibebubble.co`
5. 按照 Cloudflare 提示修改 DNS 记录（如果在 Cloudflare 管理 DNS，会自动配置）

---

## 方案三：Netlify 部署

1. 打开 https://app.netlify.com/drop
2. 直接将 `output` 文件夹拖拽上传
3. Site settings → Domain management → Add custom domain
4. 输入 `vibebubble.co`，按提示配置 DNS

---

## 部署前检查清单

- [ ] `index.html` → 已设置为自动跳转到 `landing.html`
- [ ] `landing.html` → 启动页（项目介绍链接指向 `about.html`）
- [ ] `gallery.html` → 灵感库（项目介绍链接指向 `about.html`）
- [ ] `about.html` → 项目介绍（返回首页链接指向 `landing.html`）
- [ ] `detail.html` → 灵感详情
- [ ] `data/cases.js` → 灵感数据
- [ ] `audio/bgm.mp3` → 背景音乐
- [ ] 所有页面间相对链接正确（`./about.html`、`./gallery.html` 等）

## 域名购买建议

如果还没有购买 `vibebubble.co`：
- **Namecheap**：https://namecheap.com（.co 域名约 $10-15/年）
- **阿里云**：https://wanwang.aliyun.com（中文界面，支持支付宝）
- **腾讯云**：https://dnspod.cloud.tencent.com

购买后记得在 DNS 管理中添加 Vercel/Netlify 要求的解析记录。
