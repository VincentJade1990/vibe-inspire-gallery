# VibeBubble\_V2\_Space\_RecordIdea\_PRD\.md

# 记录灵感和个人空间开发需求文档

# 模块：Creative Space \& Record Idea

版本：V2\.1



---

# 一、功能背景

VibeBubble 从第一阶段的「灵感展示平台」升级为：

> AI 创作者学习与实践平台。
> 
> 

用户不仅可以发现别人的项目，也可以记录自己的想法，并让灵感逐渐成长为真实产品。

核心链路：

```Plain Text
Explore

发现灵感

↓

Record Idea

记录自己的想法

↓

Space

管理自己的创造

↓

AI分析 / 学习 / 开发

↓

Project

发布为公开作品
```

---

# 二、产品目标

## Record Idea

解决：

用户快速记录突然产生的想法。

特点：

- 快速；

- 低成本；

- 不要求完整信息。

---

## Creative Space

解决：

用户管理自己的创造过程。

定位：

> 一个记录、管理和成长个人创造项目的空间。
> 
> 

不是：

- 账号中心；

- 收藏夹；

- 项目管理工具。

---

# 三、导航调整

一级导航：

```Plain Text
Home

Explore

Learning

Space

Studio
```

右上角：

Avatar

仅负责：

- 用户信息

- 设置

- 退出登录

形式为下拉窗口，不再跳转页面

---

# 四、Space 页面设计

## 页面标题

Creative Space

副标题：

Welcome back, 用户昵称

Your creative journey with AI

---

# 页面结构

```Plain Text
Creative Space


[Ideas]  [Projects]  [Activity]


内容区域
```

---

# Tab 1：Ideas

## 我的灵感

展示用户所有未公开创造。

形式：

气泡展示。

每个灵感：

一个 Bubble。

---

## Bubble 信息

展示：

```Plain Text
标题

当前阶段

下一步操作
```

示例：

```Plain Text
🫧 AI宠物助手

Stage:
Explore Ideas


button:
AI Analysis →
```

---

# 灵感状态体系

状态对应 VibeBubble 八阶段：

---

## 01 Explore Ideas

探索灵感

说明：

刚记录的想法。

下一步：

AI分析

---

## 02 Discover Needs

需求分析

下一步：

需求分析结果

---

## 03 Define Product

产品定位

下一步：

完善产品方案

---

## 04 Design Product

产品设计

下一步：

进入设计学习

---

## 05 Build Product

产品构建

下一步：

开发记录

---

## 06 Launch Product

发布运营

下一步：

发布项目

---

## 07 Grow Users

用户增长

下一步：

查看反馈

---

# Bubble 点击交互

不要进入独立详情页。

采用：

Space 内展开。

直接展示：

```Plain Text
灵感名称


当前状态


主按钮


下一阶段


Key Outputs

```

---

# 五、Key Outputs 设计

## 产品定位

核心：

沉淀关键成果。

不是保存完整聊天过程。

---

## 第一阶段采用：

半结构化记录。

每个阶段提供模板。

用户可以：

- 使用模板填写；

- 自由编辑。

---

# 输出类型

## 需求分析

模板：

```Plain Text
用户是谁：

解决什么问题：

使用场景：

类似产品：
```

---

## 产品定位

模板：

```Plain Text
产品名称：

目标用户：

核心价值：

MVP功能：
```

---

## 产品设计

模板：

```Plain Text
用户流程：

设计方案：

相关链接：
```

---

## 产品构建

模板：

```Plain Text
技术方案：

Demo链接：

代码仓库：
```

---

## 发布运营

模板：

```Plain Text
产品链接：

发布渠道：

用户反馈：
```

---

# Key Output 数据要求

保存：

文本 / JSON

不保存：

- AI聊天全文；

- 每一次修改记录。

---

# 六、Record Idea 功能

入口：

Explore 页面。

按钮：

```Plain Text
+ Record Idea
```

---

# 弹窗设计

标题：

Record New Idea

---

## 字段

### 必填

## Idea Title

灵感标题

示例：

AI宠物陪伴助手

---

Tags

标签，可多选，和后台标签/筛选标签对应：

例如：

```Plain Text
AI

Design

Tool

Education

Life
```

---

按钮：

```Plain Text
Save Idea
```

---

# 七、保存后的流程

用户保存：

↓

创建 Idea 数据

↓

默认状态：

Explore Ideas

↓

进入 Space

↓

显示 Bubble

---

# 八、Projects Tab

定位：

用户已经公开发布的作品。

来源：

Ideas 转换。

流程：

```Plain Text
Idea

↓

完成开发

↓

申请发布

↓

审核

↓

Public Explore
```

---

# 发布项目最低要求

必须：

```Plain Text
项目名称

项目简介

项目图片

产品链接

分类
```

---

审核状态：

```Plain Text
Draft

Pending Review

Published

Rejected
```

---

# 九、Activity Tab

我的互动。

包含：

## 我点赞的

## 我收藏的

## 我的评论

不包含：

自己项目收到的互动。

---

# 十、数据库设计

## ideas

用户灵感

字段：

```Plain Text
id

user_id

title

description

source_type

source_url

tags

status

created_at

updated_at
```

---

## idea\_outputs

阶段产出

字段：

```Plain Text
id

idea_id

stage

content

template_type

created_at
```

---

## projects

公开项目

字段：

```Plain Text
id

idea_id

title

description

cover

url

review_status

created_at
```

---

## interactions

字段：

```Plain Text
id

user_id

project_id

type

created_at
```

type:

```Plain Text
like

favorite

rating

comment
```

---

# 十一、开发范围控制

## 本阶段实现

✅ Space 页面

✅ Ideas展示

✅ Record Idea弹窗

✅ 状态切换

✅ Key Outputs展示

✅ Projects基础结构

✅ Activity基础结构

---

## 暂不开发

❌ AI自动分析

❌ AI Agent

❌ 完整版本管理

❌ 社区系统

❌ 评论系统

---

# Trae 开发提示词

复制：

```Plain Text
你现在开始开发 VibeBubble 第二阶段功能。

请先理解当前项目定位：

VibeBubble 已经不是简单的AI案例展示网站。

现在定位：

AI创作者学习与实践平台。

本次开发重点：

Creative Space
+
Record Idea


核心理念：

帮助用户记录一个想法，并让它逐渐成长为一个真实产品。


请不要重新设计项目架构。

基于当前代码继续开发。


开发前请先输出：

1. 当前项目技术架构分析
2. 当前数据库结构分析
3. 新功能需要新增的数据表
4. 页面改造方案
5. 开发步骤拆分


确认后再开始编码。


开发原则：

1. 保持当前 VibeBubble视觉风格：
- 深色背景
- 气泡视觉
- 玻璃效果
- AI创造感


2. Space不要设计成传统后台。

它应该像：

个人创造空间。


3. 不增加复杂层级。

不要新增：

Idea Detail独立页面。

采用：

Space内展开。


4. 控制数据量。

不要保存：

AI聊天全文。

只保存：

关键产出。


优先完成：

Phase 1:

Record Idea

Phase 2:

Space Ideas展示

Phase 3:

Key Outputs

Phase 4:

Projects / Activity框架


请先输出开发计划。
```

---

这一版的核心是把 VibeBubble 从“内容展示”推进到“用户创造闭环”，同时保持轻量，避免过早做成复杂 SaaS。后续接入 AI 分析能力时，只需要在 `Idea → Stage → Output` 这个结构上增加 AI 服务即可。

