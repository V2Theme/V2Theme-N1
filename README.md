🚀 V2Theme for XiaoV2Board

一个基于 Vue 3 + TypeScript + Vite 构建的现代化 V2Board 用户前端主题，专注于美观设计与良好的用户体验。

🌐 在线演示
演示地址：https://xb4.9996333.xyz/
测试账号：test@9996333.xyz
✨ 项目简介

V2Theme 是一个面向 V2Board 用户端的前端项目，采用现代前端技术栈开发，提供简洁、高端的 UI 设计以及完善的功能支持，适用于各类代理/VPN 面板的用户系统。

🔥 核心特性
🎨 现代化 UI 设计 — 简约、干净、高端视觉风格
🌗 深色 / 浅色模式 — 一键切换主题
🔐 中间件加密支持 — 提升接口安全性
📱 响应式布局 — 完美适配 PC / 平板 / 手机
🔑 完整认证系统 — 登录、鉴权流程完善
⬇️ 客户端下载配置 — 支持多平台下载入口自定义
🧱 技术栈
Vue 3
TypeScript
Vite
Axios（API 请求）
Pinia（状态管理）
🚀 快速开始
1️⃣ 安装依赖
npm install
2️⃣ 环境配置

将 env.example 重命名为 .env，并根据实际情况进行修改：

# API 地址（直连后端）
VITE_API_BASE_URL=https://your-api-domain/api/v1

# 如果启用中间件，请填写中间件地址
# VITE_API_BASE_URL=https://your-middleware-domain

# 是否开启中间件加密
VITE_SECURITY_ENABLED=true

# 中间件密钥
VITE_SECURITY_PASSWORD=your-security-key

# 中间件 API 路径前缀
VITE_SECURITY_PATH_PREFIX=/api/v1
📦 客户端下载地址配置
VITE_CLIENT_DOWNLOAD_IOS=#
VITE_CLIENT_DOWNLOAD_ANDROID=#
VITE_CLIENT_DOWNLOAD_MACOS=#
VITE_CLIENT_DOWNLOAD_WINDOWS=#
VITE_CLIENT_DOWNLOAD_LINUX=#
🧪 开发环境运行
npm run serve
📦 生产环境构建
npm run build

构建完成后，产物将输出至：

dist/
⚠️ 注意事项
构建前请务必修改 index.html 中的站点名称
请确保 API 地址配置正确，否则会导致接口请求失败
开启中间件时，请确保后端与中间件配置一致
💡 适用场景
V2Board 用户前端替换
VPN / 代理服务用户中心
自定义面板 UI 二次开发
📄 License

本项目仅供学习与交流使用，请遵守相关法律法规。
