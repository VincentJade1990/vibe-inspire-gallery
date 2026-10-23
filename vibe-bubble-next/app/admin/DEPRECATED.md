# DEPRECATED - 此 Admin 模块已废弃

本目录 (`app/admin/`) 中的后台管理功能已**废弃**，所有管理功能已迁移到独立的 **vibe-bubble-admin** 项目。

- **新管理后台地址**: https://admin.vibebubble.co
- **新管理后台仓库**: VincentJade1990/vibe-bubble-admin

## 废弃原因

1. **数据库不匹配**: 此 admin 连接的是旧 Supabase 项目 (`lnvejgunigxciltildiz`)，并非当前生产数据库 (`ndktjtrjczajihvntdqa`)
2. **从未公开部署使用**: 该 admin 模块从未在正式环境中对外部署使用
3. **实际运营使用独立项目**: 当前所有运营管理操作均通过独立的 `vibe-bubble-admin` 项目进行

## 迁移说明

- 灵感管理、候选池管理 → 已迁移至 vibe-bubble-admin
- 投稿管理、评论管理 → 暂不启用，后续在 vibe-bubble-admin 中实现

请勿修改或启用本目录下的代码。
