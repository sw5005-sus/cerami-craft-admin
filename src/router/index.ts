/**
 * @file 路由配置文件
 * @description 定义应用的路由结构和全局导航守卫 (BFF + ZITADEL OIDC)
 */

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import AppLayout from '../layouts/AppLayout.vue'
import { checkAuth, login } from '../services/auth'
import { fetchRoles, isAdmin, isEditor } from '../services/role'

// Extend RouteMeta to include roles
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    /** If set, user must have at least one of these roles to access */
    roles?: string[]
  }
}

/** 路由配置数组 */
const routes: Array<RouteRecordRaw> = [
  // 主应用路由 - 需要认证的页面
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/Home.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('../views/Products.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'products/add',
        name: 'AddProduct',
        component: () => import('../views/AddProduct.vue'),
        meta: { requiresAuth: true, roles: ['merchant_admin', 'product_editor'] }
      },
      {
        path: 'products/:id',
        name: 'ProductDetail',
        component: () => import('../views/ProductDetail.vue'),
        meta: { requiresAuth: true },
        props: true
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('../views/OrderList.vue'),
        meta: { requiresAuth: true, roles: ['merchant_admin'] }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('../views/OrderDetail.vue'),
        meta: { requiresAuth: true, roles: ['merchant_admin'] }
      },
      {
        path: 'reviews',
        name: 'Reviews',
        component: () => import('../views/ReviewList.vue'),
        meta: { requiresAuth: true, roles: ['merchant_admin'] }
      },
      // 临时：不需要认证的审计日志页面（调试用）
      {
        path: 'logs',
        name: 'AuditLogs',
        component: () => import('../views/AuditLogs.vue'),
        meta: { requiresAuth: true, roles: ['merchant_admin'] }
      },
    ]
  },

  // 兼容后端 callback 仍重定向到旧登录路径的情况
  { path: '/auth/login', redirect: '/' },

  // 其余未匹配路由一律回首页
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

/** 创建路由实例 */
const router = createRouter({ history: createWebHistory(), routes })

/**
 * 全局路由前置守卫
 * @description
 *  - 对 requiresAuth 路由，先用 checkAuth() 确认 session 是否有效
 *  - 如果未认证，调用 login() 做全页跳转到 ZITADEL (通过后端 BFF)
 *  - 认证后获取角色，校验 meta.roles 权限
 */
router.beforeEach(async (to, _from, next) => {
  // 不需要认证的路由直接放行
  if (!to.meta?.requiresAuth) {
    next()
    return
  }

  // 检查 session（首次访问会发起一次轻量级 API 调用，后续走缓存）
  const authed = await checkAuth()
  if (!authed) {
    // 未认证 → 重定向到 ZITADEL 登录页（全页跳转，不调用 next()）
    login()
    return
  }

  // 获取角色（首次获取后会缓存）
  await fetchRoles()

  // 校验角色权限
  const requiredRoles = to.meta?.roles
  if (requiredRoles && requiredRoles.length > 0) {
    const hasPermission = isAdmin() || requiredRoles.some(role =>
      role === 'merchant_admin' ? isAdmin() :
      role === 'product_editor' ? isEditor() :
      false
    )
    if (!hasPermission) {
      // 无权限 → 重定向到首页
      next('/')
      return
    }
  }

  next()
})

export default router
