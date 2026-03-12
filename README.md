# CeramiCraft Merchant Frontend

[ English | [简体中文](./README_zh.md) ]

<div align="center">

![Vue.js](https://img.shields.io/badge/Vue.js-3.5.22-4FC08D?style=flat&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.1.12-646CFF?style=flat&logo=vite&logoColor=white)
![Element Plus](https://img.shields.io/badge/Element_Plus-2.11.7-409EFF?style=flat&logo=element&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

A modern merchant management platform for handcraft shopping website built with Vue 3 + TypeScript + Element Plus

[Features](#-features) •
[Quick Start](#-quick-start) •
[Project Structure](#-project-structure) •
[Development Guide](#-development-guide) •
[Deployment](#-deployment)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Core Features](#-core-features)
- [Development Guide](#-development-guide)
- [API Endpoints](#-api-endpoints)
- [Build & Deployment](#-build--deployment)
- [Code Standards](#-code-standards)
- [Browser Support](#-browser-support)
- [License](#-license)

## ✨ Features

- 🎨 **Modern UI** - Beautiful interface built with Element Plus
- 🚀 **Lightning Fast** - Powered by Vite with instant HMR
- 📱 **Responsive Design** - Adapts to all screen sizes
- 🔐 **Authentication** - Complete login/logout flow
- 📦 **Product Management** - Full CRUD operations for products
- 📋 **Order Management** - View and manage orders
- ⭐ **Review Management** - View and manage product reviews
- 🐳 **Docker Support** - Containerized deployment solution
- 🎯 **TypeScript** - Full type safety
- 📊 **Data Visualization** - Dashboard with statistics

## 🛠 Tech Stack

### Core Framework
- **[Vue 3](https://vuejs.org/)** `3.5.22` - Progressive JavaScript Framework
- **[TypeScript](https://www.typescriptlang.org/)** `5.9.3` - Typed superset of JavaScript
- **[Vite](https://vitejs.dev/)** `7.1.12` - Next Generation Frontend Tooling

### UI Component Library
- **[Element Plus](https://element-plus.org/)** `2.11.7` - Vue 3 UI Component Library
- **[Font Awesome](https://fontawesome.com/)** `7.1.0` - Icon Library

### Router & State
- **[Vue Router](https://router.vuejs.org/)** `4.6.3` - Official Router for Vue.js

### HTTP Client
- **[Axios](https://axios-http.com/)** `1.13.1` - Promise based HTTP client

### Development Tools
- **[ESLint](https://eslint.org/)** `9.39.0` - Code quality and style checker
- **[Vue TSC](https://github.com/vuejs/language-tools)** `3.1.3` - TypeScript type checker for Vue

## 🚀 Quick Start

### Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 or **pnpm**: >= 8.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/NUS-ISS-Agile-Team/cerami-craft-admin.git

# Navigate to project directory
cd cerami-craft-admin

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Server will run at http://localhost:5173
```

### Build for Production

```bash
# Build the project
npm run build

# Preview production build
npm run preview
```

### Code Linting

```bash
# Run ESLint
npm run lint
```

## 🎯 Core Features

### 1. Authentication System
- ✅ Merchant login
- ✅ Logout
- ✅ Route guards (Token-based)
- ✅ Auto-redirect

### 2. Product Management
- ✅ View product list (with search & category filter)
- ✅ Add new products (with multi-image upload)
- ✅ Edit product information
- ✅ Publish/unpublish products
- ✅ Manage product inventory
- ✅ View product details

### 3. Order Management
- ✅ View order list
- ✅ View order details
- ✅ Manage order status
- ✅ Order search and filtering

### 4. Review Management
- ✅ View product review list
- ✅ View review details
- ✅ Filter reviews

### 5. Dashboard
- ✅ Sales statistics
- ✅ Order count statistics
- ✅ Average order amount
- ✅ Customer count statistics
- ✅ Recent orders display

## 💻 Development Guide

### API Proxy Configuration

This project uses Vite's proxy feature to forward all requests starting with `/api` to the backend service:

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

### Route Guards

Route guards verify user identity by checking `userToken` in `localStorage`:

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

### Adding New Pages

1. Create a new `.vue` file in `src/views/`
2. Add route configuration in `src/router/index.ts`
3. Add `meta: { requiresAuth: true }` if authentication is required

Example:

```typescript
{
  path: 'new-page',
  name: 'NewPage',
  component: () => import('../views/NewPage.vue'),
  meta: { requiresAuth: true }
}
```

### Calling APIs

Use API classes from the `services/` directory:

```typescript
import { ProductAPI } from '@/services/product'

// Get product list
const response = await ProductAPI.getProductList({
  keyword: 'ceramic',
  category: 'vase',
  offset: 0
})

if (response.code === 0) {
  console.log(response.data)
}
```

## 🔌 API Endpoints

### Authentication API (`auth.ts`)
- `POST /api/user-ms/v1/merchant/login` - Merchant login
- `POST /api/user-ms/v1/merchant/logout` - Merchant logout
- `GET /api/user-ms/v1/merchant/info` - Get merchant info

### Product API (`product.ts`)
- `GET /api/product-ms/v1/merchant/list` - Get product list
- `POST /api/product-ms/v1/merchant/create` - Create product
- `PUT /api/product-ms/v1/merchant/update` - Update product info
- `PUT /api/product-ms/v1/merchant/update_status` - Update product status
- `PUT /api/product-ms/v1/merchant/update_stock` - Update product stock
- `DELETE /api/product-ms/v1/merchant/delete` - Delete product
- `POST /api/product-ms/v1/merchant/img/upload` - Upload product image

### Order API (`order.ts`)
- `GET /api/order-ms/v1/merchant/list` - Get order list
- `GET /api/order-ms/v1/merchant/info` - Get order details
- `PUT /api/order-ms/v1/merchant/update_status` - Update order status

### Review API (`review.ts`)
- `GET /api/review-ms/v1/merchant/list` - Get review list

## 🐳 Build & Deployment

### Docker Deployment

#### Option 1: Using Build Script

```bash
# Make script executable
chmod +x build_dkimg.sh

# Build Docker image
./build_dkimg.sh

# Run container
docker run -d -p 8080:8080 --name ceramicraft-merchant cerami-craft-admin:latest
```

#### Option 2: Manual Build

```bash
# Build image
docker build -t cerami-craft-admin:latest .

# Run container
docker run -d -p 8080:8080 --name ceramicraft-merchant cerami-craft-admin:latest

# Access application
# http://localhost:8080
```

### Image Features

- **Multi-stage build**: Reduces final image size
- **Alpine-based**: Lightweight Linux distribution
- **Nginx deployment**: Uses unprivileged Nginx image
- **Security**: Enhanced security with `nginx-unprivileged`

### Production Optimization

Build configuration automatically removes `console.log` and `debugger` in production:

```typescript
// vite.config.ts
esbuild: {
  drop: ['console', 'debugger']
}
```

## 📝 Code Standards

### TypeScript Configuration

Project uses strict TypeScript configuration:

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

### ESLint Rules

- Vue 3 recommended rules
- TypeScript ESLint rules
- Custom project rules

Run linting:
```bash
npm run lint
```

### Code Comment Standards

All files should include a top comment:

```typescript
/**
 * @file File name
 * @description File functionality description
 */
```

## 🌐 Browser Support

| ![Chrome](https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![Safari](https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png) | ![Edge](https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png) |
| --- | --- | --- | --- |
| Chrome ≥ 87 | Firefox ≥ 78 | Safari ≥ 14 | Edge ≥ 88 |

## 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the [MIT](LICENSE) License.

## 👥 Team

NUS-ISS Agile Team

---

<div align="center">

**[⬆ Back to Top](#cerami-craft-admin)**

Made with ❤️ by NUS-ISS Agile Team

</div>
