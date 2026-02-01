/**
 * @file 路由配置文件
 * @description 定义应用的路由结构，包括主应用路由和认证路由
 */

import {createRouter, createWebHistory} from 'vue-router'
import type {RouteRecordRaw} from 'vue-router'

import AppLayout from '../layouts/AppLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'

/** 路由配置数组 */
const routes: Array<RouteRecordRaw> =
    [
      // 主应用路由 - 需要认证的页面
      {
        path: '/',
        component: AppLayout,
        children: [
          {
            path: '',
            name: 'Home',
            component: () => import('../views/Home.vue'),
            meta: {requiresAuth: true}
          },
          {
            path: 'products',
            name: 'Products',
            component: () => import('../views/Products.vue'),
            meta: {requiresAuth: true}
          },
          {
            path: 'products/add',
            name: 'AddProduct',
            component: () => import('../views/AddProduct.vue'),
            meta: {requiresAuth: true}
          },
          {
            path: 'products/:id',
            name: 'ProductDetail',
            component: () => import('../views/ProductDetail.vue'),
            meta: {requiresAuth: true},
            props: true
          },
          {
            path: 'orders',
            name: 'Orders',
            component: () => import('../views/OrderList.vue')
          },
          {
            path: 'orders/:id',
            name: 'OrderDetail',
            component: () => import('../views/OrderDetail.vue')
          },
          {
            path: 'reviews',
            name: 'Reviews',
            component: () => import('../views/ReviewList.vue'),
            meta: {requiresAuth: true}
          }

        ]  
      },

      // 认证路由 - 登录注册等页面
      {
        path: '/auth',
        component: AuthLayout,
        children: [{
          path: 'login',
          name: 'Login',
          component: () => import('../views/Login.vue')
        }]
      },

      // 路由重定向配置
      {path: '/login', redirect: '/auth/login'},
      {path: '/:pathMatch(.*)*', redirect: '/'}
    ]

    /** 创建路由实例 */
    const router = createRouter({history: createWebHistory(), routes})

/**
 * 全局路由前置守卫
 * @description 处理路由跳转前的逻辑，如权限验证和重定向
 */
router.beforeEach((to, _from, next) => {
  // 简单的认证状态检查（可以后续扩展为真实的认证逻辑）
  const isAuthenticated =
      localStorage.getItem('userToken')  // 检查本地存储中的认证状态

  console.log('=== Route Guard ===')
  console.log('To:', to.path)
  console.log('From:', _from.path)
  console.log('Is Authenticated:', !!isAuthenticated)
  console.log('Token:', isAuthenticated)
  console.log('Requires Auth:', to.meta?.requiresAuth)

  // 如果访问需要认证的页面但未登录，重定向到登录页面
  if (to.meta?.requiresAuth && !isAuthenticated) {
    console.log('Redirecting to login: not authenticated')
    next('/auth/login')
  }
  // 如果已登录但访问登录页面，重定向到首页
  else if (isAuthenticated && to.path === '/auth/login') {
    console.log('Redirecting to home: already authenticated')
    next('/')
  }
  // 其他情况正常跳转
  else {
    console.log('Normal navigation allowed')
    next()
  }
})

export default router
