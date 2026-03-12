# CeramiCraft 商家端前端

[English](./README.md) | 简体中文

<div align="center">

![Vue.js](https://img.shields.io/badge/Vue.js-3.5.22-4FC08D?style=flat&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.1.12-646CFF?style=flat&logo=vite&logoColor=white)
![Element Plus](https://img.shields.io/badge/Element_Plus-2.11.7-409EFF?style=flat&logo=element&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

一个基于 Vue 3 + TypeScript + Element Plus 构建的现代化手工艺品购物网站商家管理平台

[特性](#-特性) •
[快速开始](#-快速开始) •
[项目结构](#-项目结构) •
[开发指南](#-开发指南) •
[部署](#-部署)

</div>

---

## 📋 目录

- [特性](#-特性)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [核心功能](#-核心功能)
- [开发指南](#-开发指南)
- [API 接口](#-api-接口)
- [构建与部署](#-构建与部署)
- [代码规范](#-代码规范)
- [浏览器支持](#-浏览器支持)
- [许可证](#-许可证)

## ✨ 特性

- 🎨 **现代化 UI** - 基于 Element Plus 构建的美观界面
- 🚀 **极速开发** - Vite 提供快速的 HMR 热更新
- 📱 **响应式设计** - 适配各种屏幕尺寸
- 🔐 **用户认证** - 完整的登录/登出流程
- 📦 **产品管理** - 商品的 CRUD 操作
- 📋 **订单管理** - 订单查看和状态管理
- ⭐ **评价管理** - 查看和管理商品评价
- 🐳 **Docker 支持** - 容器化部署方案
- 🎯 **TypeScript** - 完整的类型安全
- 📊 **数据可视化** - Dashboard 数据展示

## 🛠 技术栈

### 核心框架
- **[Vue 3](https://vuejs.org/)** `3.5.22` - 渐进式 JavaScript 框架
- **[TypeScript](https://www.typescriptlang.org/)** `5.9.3` - 类型安全的 JavaScript 超集
- **[Vite](https://vitejs.dev/)** `7.1.12` - 下一代前端构建工具

### UI 组件库
- **[Element Plus](https://element-plus.org/)** `2.11.7` - Vue 3 UI 组件库
- **[Font Awesome](https://fontawesome.com/)** `7.1.0` - 图标库

### 路由与状态
- **[Vue Router](https://router.vuejs.org/)** `4.6.3` - 官方路由管理器

### HTTP 客户端
- **[Axios](https://axios-http.com/)** `1.13.1` - Promise 基础的 HTTP 客户端

### 开发工具
- **[ESLint](https://eslint.org/)** `9.39.0` - 代码质量和风格检查
- **[Vue TSC](https://github.com/vuejs/language-tools)** `3.1.3` - Vue 的 TypeScript 类型检查

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 或 **pnpm**: >= 8.0.0

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/NUS-ISS-Agile-Team/cerami-craft-admin.git

# 进入项目目录
cd cerami-craft-admin

# 安装依赖
npm install
```

### 开发模式

```bash
# 启动开发服务器
npm run dev

# 服务将运行在 http://localhost:5173
```

### 构建生产版本

```bash
# 构建项目
npm run build

# 预览生产构建
npm run preview
```

### 代码检查

```bash
# 运行 ESLint 检查
npm run lint
```

## 🎯 核心功能

### 1. 认证系统
- ✅ 商家登录
- ✅ 登出
- ✅ 路由守卫（基于 Token）
- ✅ 自动重定向

### 2. 产品管理
- ✅ 查看产品列表（支持搜索、分类筛选）
- ✅ 添加新产品（支持多图上传）
- ✅ 编辑产品信息
- ✅ 上架/下架产品
- ✅ 管理产品库存
- ✅ 产品详情查看

### 3. 订单管理
- ✅ 查看订单列表
- ✅ 订单详情查看
- ✅ 订单状态管理
- ✅ 订单搜索和筛选

### 4. 评价管理
- ✅ 查看商品评价列表
- ✅ 评价详情查看
- ✅ 评价筛选

### 5. Dashboard
- ✅ 销售数据统计
- ✅ 订单数量统计
- ✅ 平均订单金额
- ✅ 客户数量统计
- ✅ 最近订单展示

## 💻 开发指南

### API 代理配置

本项目使用 Vite 的代理功能，将所有以 `/api` 开头的请求转发到后端服务：

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://cerami-craft-admin',
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

### 路由守卫

路由守卫通过检查 `localStorage` 中的 `userToken` 来验证用户身份：

```typescript
// src/router/index.ts
router.beforeEach((to, _from, next) => {
  const isAuthenticated = localStorage.getItem('userToken')
  
  if (to.meta?.requiresAuth && !isAuthenticated) {
    next('/auth/login')
  } else if (to.path === '/auth/login' && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})
```

### 添加新页面

1. 在 `src/views/` 下创建新的 `.vue` 文件
2. 在 `src/router/index.ts` 中添加路由配置
3. 如需认证，添加 `meta: { requiresAuth: true }`

示例：

```typescript
{
  path: 'new-page',
  name: 'NewPage',
  component: () => import('../views/NewPage.vue'),
  meta: { requiresAuth: true }
}
```

### 调用 API

使用 `services/` 目录下的 API 类：

```typescript
import { ProductAPI } from '@/services/product'

// 获取产品列表
const response = await ProductAPI.getProductList({
  keyword: 'ceramic',
  category: 'vase',
  offset: 0
})

if (response.code === 0) {
  console.log(response.data)
}
```

## 🔌 API 接口

### 认证 API (`auth.ts`)
- `POST /api/user-ms/v1/merchant/login` - 商家登录
- `POST /api/user-ms/v1/merchant/logout` - 商家登出
- `GET /api/user-ms/v1/merchant/info` - 获取商家信息

### 产品 API (`product.ts`)
- `GET /api/product-ms/v1/merchant/list` - 获取产品列表
- `POST /api/product-ms/v1/merchant/create` - 创建产品
- `PUT /api/product-ms/v1/merchant/update` - 更新产品信息
- `PUT /api/product-ms/v1/merchant/update_status` - 更新产品状态
- `PUT /api/product-ms/v1/merchant/update_stock` - 更新产品库存
- `DELETE /api/product-ms/v1/merchant/delete` - 删除产品
- `POST /api/product-ms/v1/merchant/img/upload` - 上传产品图片

### 订单 API (`order.ts`)
- `GET /api/order-ms/v1/merchant/list` - 获取订单列表
- `GET /api/order-ms/v1/merchant/info` - 获取订单详情
- `PUT /api/order-ms/v1/merchant/update_status` - 更新订单状态

### 评价 API (`review.ts`)
- `GET /api/review-ms/v1/merchant/list` - 获取评价列表

## 🐳 构建与部署

### Docker 部署

#### 方式一：使用构建脚本

```bash
# 给脚本添加执行权限
chmod +x build_dkimg.sh

# 构建 Docker 镜像
./build_dkimg.sh

# 运行容器
docker run -d -p 8080:8080 --name ceramicraft-merchant cerami-craft-admin:latest
```

#### 方式二：手动构建

```bash
# 构建镜像
docker build -t cerami-craft-admin:latest .

# 运行容器
docker run -d -p 8080:8080 --name ceramicraft-merchant cerami-craft-admin:latest

# 访问应用
# http://localhost:8080
```

### 镜像特点

- **多阶段构建**：减小最终镜像体积
- **基于 Alpine**：轻量级 Linux 发行版
- **Nginx 部署**：使用非特权 Nginx 镜像
- **安全性**：使用 `nginx-unprivileged` 提高安全性

### 生产环境优化

构建配置已自动移除生产环境中的 `console.log` 和 `debugger`：

```typescript
// vite.config.ts
esbuild: {
  drop: ['console', 'debugger']
}
```

## 📝 代码规范

### TypeScript 配置

项目使用严格的 TypeScript 配置：

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### ESLint 规则

- 使用 Vue 3 推荐规则
- TypeScript ESLint 规则
- 自定义项目规则

运行检查：
```bash
npm run lint
```

### 代码注释规范

所有文件都应包含顶部注释：

```typescript
/**
 * @file 文件名称
 * @description 文件功能描述
 */
```

## 🌐 浏览器支持

| ![Chrome](https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![Safari](https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png) | ![Edge](https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png) |
| --- | --- | --- | --- |
| Chrome ≥ 87 | Firefox ≥ 78 | Safari ≥ 14 | Edge ≥ 88 |

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 👥 团队

NUS-ISS Agile Team

---

<div align="center">

**[⬆ 回到顶部](#ceramicraft-商家端前端)**

Made with ❤️ by NUS-ISS Agile Team

</div>
