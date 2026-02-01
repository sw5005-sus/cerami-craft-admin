<template>
  <div class="app-layout">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-section">
          <img src="/img/logo.png" alt="CERAMIC-CRAFT Logo" class="logo-image" />
          <span class="logo-text">CERAMIC-CRAFT</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9,22 9,12 15,12 15,22" />
          </svg>
          <span>Home</span>
        </router-link>
        <router-link to="/products" class="nav-item" active-class="active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
          <span>Products</span>
        </router-link>
        <router-link to="/orders" class="nav-item" active-class="active">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 7h18M3 12h18M3 17h18" />
          </svg>
          <span>Orders</span>
        </router-link>
        <router-link to="/reviews" class="nav-item" active-class="active">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
          <span>Reviews</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button @click="handleLogout" class="logout-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- 主内容区域 -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * 主应用布局组件
 */
import { useRouter } from 'vue-router'
import { AuthAPI } from '../services/auth'

const router = useRouter()

/**
 * 处理用户登出
 */
const handleLogout = async () => {
  try {
    await AuthAPI.logout()
    // 清除本地存储的token
    localStorage.removeItem('userToken')
    // 跳转到登录页面
    router.push('/auth/login')
  } catch (err) {
    console.error('Logout error:', err)
    // 即使API调用失败，也要清除本地token并跳转
    localStorage.removeItem('userToken')
    router.push('/auth/login')
  }
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  position: relative;
}

/* 左侧边栏样式 */
.sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 1000;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-image {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.logo-text {
  font-weight: 700;
  font-size: 18px;
  color: #1e293b;
  letter-spacing: 0.5px;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
  font-size: 15px;
  padding: 12px 20px;
  margin: 0 12px;
  border-radius: 8px;
  transition: all 0.2s;
  position: relative;
}

.nav-item:hover {
  background: #f8fafc;
  color: #334155;
}

.nav-item.active {
  background: #fef2f2;
  color: #dc6643;
  border: 1px solid #fecaca;
}

.nav-item svg {
  flex-shrink: 0;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  border: 1px solid #d1d5db;
  color: #64748b;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: flex-start;
}

.logout-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #374151;
}

.logout-btn svg {
  flex-shrink: 0;
}

/* 主内容区域样式 */
.main-content {
  flex: 1;
  margin-left: 260px;
  background: #f8f9fb;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .sidebar {
    width: 240px;
  }

  .main-content {
    margin-left: 240px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 200px;
  }

  .main-content {
    margin-left: 200px;
  }

  .logo-text {
    font-size: 16px;
  }

  .nav-item {
    font-size: 14px;
    padding: 10px 16px;
    margin: 0 8px;
  }

  .sidebar-header {
    padding: 20px 16px;
  }

  .sidebar-footer {
    padding: 16px;
  }
}

@media (max-width: 640px) {
  .sidebar {
    width: 100%;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
  }

  .logo-text {
    display: none;
  }

  .nav-item span {
    display: none;
  }

  .logout-btn span {
    display: none;
  }

  .sidebar {
    width: 60px;
    transform: translateX(0);
  }

  .sidebar-header {
    padding: 20px 8px;
    justify-content: center;
  }

  .logo-section {
    justify-content: center;
  }

  .nav-item {
    justify-content: center;
    padding: 12px 8px;
    margin: 0 8px;
  }

  .logout-btn {
    justify-content: center;
    padding: 12px 8px;
  }

  .main-content {
    margin-left: 60px;
  }
}
</style>
