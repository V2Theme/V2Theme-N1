# V2Theme for XiaoV2Board
一个基于 Vue 3 + TypeScript + Vite 的前端主题 

演示站：
- https://xb4.9996333.xyz/
- 测试账号密码 test@9996333.xyz

# V2Board User 前端项目
一个美观、现代的V2Board管理后台前端项目，基于Vue 3开发。

## 特性
-  美观的UI设计，简约高端
-  支持亮色/暗色主题切换
-  支持 中间件加密
-  响应式设计，适配各种设备
-  完善的登录认证系统
-  支持自定义客户端下载链接


## 开始使用

### 安装依赖

```bash
npm install
```

## 配置

配置文件：
- `将env.example 重命名 .env`
-`VITE_API_BASE_URL=后端API域名/api/v1`
-`如果开启中间件`VITE_API_BASE_URL=中间件域名`
-`VITE_SECURITY_ENABLED=true`  开启中间件
-`VITE_SECURITY_PASSWORD=xWiPdLebVEiYUgB94` 配置中间件密钥
-`VITE_SECURITY_PATH_PREFIX=/api/v1` 中间件路径

#配置客户端下载地址
VITE_CLIENT_DOWNLOAD_IOS=#
VITE_CLIENT_DOWNLOAD_ANDROID=#
VITE_CLIENT_DOWNLOAD_MACOS=#
VITE_CLIENT_DOWNLOAD_WINDOWS=#
VITE_CLIENT_DOWNLOAD_LINUX=#


### 开发环境运行

```bash
npm run serve
```

### 生产环境构建

```bash
npm run build
```

构建产物输出到：
- `dist/`


PS: 构建前请修改 index.html 站点名称


