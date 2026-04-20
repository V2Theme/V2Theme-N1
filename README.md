# 🚀 V2Theme for XiaoV2Board

一个基于 **Vue 3 + TypeScript + Vite** 构建的现代化 V2Board 用户前端主题，专注于美观设计与良好的用户体验。

---

## 🌐 在线演示

- 演示地址：https://xb4.9996333.xyz/
- 测试账号：`test@9996333.xyz`

---

## ✨ 项目简介

V2Theme 是一个面向 V2Board 用户端的前端项目，采用现代前端技术栈开发，提供简洁、高端的 UI 设计以及完善的功能支持，适用于各类代理 / VPN 面板。

---

## 🔥 核心特性

- 🎨 现代化 UI 设计（简约 / 高端）
- 🌗 深色 / 浅色主题切换
- 🔐 支持中间件加密
- 📱 响应式设计，适配 PC / 平板 / 手机
- 🔑 完整的登录认证系统
- ⬇️ 支持自定义客户端下载地址

---

## 🧱 技术栈

- Vue 3
- TypeScript
- Vite
- Axios
- Pinia

---

## 🚀 快速开始

### 1️⃣ 安装依赖

```bash
npm install
```

### 2️⃣ 环境配置

将 `env.example` 重命名为 `.env`，然后根据需求修改：

#### 🔗 API 地址（直连后端）

```env
VITE_API_BASE_URL=https://your-api-domain/api/v1
```

#### 🔐 使用中间件（可选）

```env
VITE_API_BASE_URL=https://your-middleware-domain
```

> ⚠️ 如果启用中间件，请将 API 地址替换为中间件地址。

#### 🔒 是否开启中间件加密

```env
VITE_SECURITY_ENABLED=true
```

#### 🔑 中间件密钥

```env
VITE_SECURITY_PASSWORD=your-security-key
```

#### 🧭 中间件 API 路径前缀

```env
VITE_SECURITY_PATH_PREFIX=/api/v1
```

---

## 📦 客户端下载地址配置

```env
VITE_CLIENT_DOWNLOAD_IOS=#
VITE_CLIENT_DOWNLOAD_ANDROID=#
VITE_CLIENT_DOWNLOAD_MACOS=#
VITE_CLIENT_DOWNLOAD_WINDOWS=#
VITE_CLIENT_DOWNLOAD_LINUX=#
```

---

## 🧪 开发环境运行

```bash
npm run serve
```

---

## 📦 生产环境构建

```bash
npm run build
```

构建产物输出目录：

```bash
dist/
```

---

## ⚠️ 注意事项

- 构建前请修改 `index.html` 中的站点名称
- 请确保 API 地址配置正确，否则会导致接口请求失败
- 使用中间件时，请确保后端与中间件配置一致

---

## 📄 License

仅供学习交流使用，请遵守当地法律法规。
