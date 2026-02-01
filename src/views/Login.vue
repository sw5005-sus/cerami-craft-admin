<template>
  <div class="login-container">
    <div class="login-left">
      <img src="/img/headImage.png" alt="Ceramic Vase" class="head-image" />
    </div>
    <div class="login-right">
      <!-- 顶部标题和logo -->
      <div class="login-header">
        <div class="login-logo">
          <img src="/img/logo.png" alt="CERAMIC-CRAFT Logo" class="logo-image" />
          <span class="logo-text">CERAMIC-CRAFT | MERCHANT</span>
        </div>
      </div>

      <div class="login-tabs">
        <div class="tab-header">
          <div class="tab-item active">Login</div>
        </div>
        <div class="login-form form-container">
          <div class="form-group">
            <div class="form-label">EMAIL ADDRESS</div>
            <input type="email" v-model="loginForm.email" class="form-input" />
          </div>
          <div class="form-group">
            <div class="form-label">PASSWORD</div>
            <input type="password" v-model="loginForm.password" class="form-input" />
          </div>
          <div class="form-group">
            <button class="sign-in-button" @click="onLogin">SIGN IN</button>
          </div>
        </div>
      </div>

      <!-- 底部政策链接和GitHub图标 -->
      <div class="login-footer">
        <div class="policy-links">
          <a href="https://github.com/NUS-ISS-Agile-Team/ceramicraft-merchant-frontend/blob/main/LICENSE"
            class="policy-link">Privacy Policy</a>
          <a href="https://github.com/NUS-ISS-Agile-Team/ceramicraft-merchant-frontend/blob/main/LICENSE"
            class="policy-link">Terms of Use</a>
        </div>
        <div class="social-links">
          <a href="https://github.com/NUS-ISS-Agile-Team/ceramicraft-merchant-frontend" target="_blank"
            class="github-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
              <path fill="currentColor"
                d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 用户登录注册页面
 * @description 提供用户登录和注册功能的表单页面
 */

import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { AuthAPI, HTTP_STATUS } from '../services/auth'
import { notification } from '../utils/notification'
/** 路由实例 */
const router = useRouter()

/** 登录表单数据 */
const loginForm = ref({
  email: '',
  password: ''
})

/**
 * 处理用户登录
 * @description 验证登录信息并跳转到首页
 */
const onLogin = async () => {
  // 基本表单验证
  if (!loginForm.value.email || !loginForm.value.password) {
    notification.error('Please enter email and password', 'Login Error')
    return
  }
  // 邮箱格式校验
  const emailPattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/
  if (!emailPattern.test(loginForm.value.email)) {
    notification.error('Please enter a valid email address', 'Invalid Email')
    return
  }

  // 调用后端登录API
  try {
    const response = await AuthAPI.login({
      email: loginForm.value.email,
      password: loginForm.value.password
    })

    console.log('Login response status:', response.status)

    if (response.status === HTTP_STATUS.OK) {
      // 登录成功，解析响应
      const jsonData = await response.json()
      console.log('Login successful:', jsonData)

      // 保存登录状态（token会通过cookie自动设置）
      localStorage.setItem('userToken', 'logged_in')

      notification.success('Login successful! Redirecting...', 'Welcome')

      // 导航到首页
      await nextTick()
      try {
        await router.replace('/')
        console.log('Navigation to home successful!')
      } catch (navError) {
        console.error('Router navigation failed:', navError)
        window.location.href = '/'
      }

    } else {
      // 登录失败，解析错误信息
      try {
        const errorData = await response.json()
        console.error('Login failed:', errorData)
        notification.error(errorData.error || 'Login failed', 'Login Error')
      } catch {
        notification.error('Login failed', 'Login Error')
      }
    }
  } catch (err) {
    notification.error('Network error, please try again later', 'Connection Error')
    console.error('Login error:', err)
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  /* 在无头部/底部的情况下，使用完整视口高度 */
  height: auto;
  /* 允许内容自动撑开高度 */
  background-color: #fff;
  width: 100%;
  margin: 0;
  padding: 0;
}

.login-left {
  flex: none;
  /* 不使用flex拉伸 */
  width: auto;
  /* 宽度根据图片内容自动调整 */
  position: relative;
  background-color: #f5e1d0;
  /* 添加与花瓶背景相匹配的颜色 */
  display: flex;
  justify-content: center;
  /* 居中显示 */
  align-items: center;
  padding: 0;
  overflow: hidden;
}

.login-left .head-image {
  height: auto;
  /* 改为自适应高度 */
  max-height: 100vh;
  /* 最大高度为整个视口高度 */
  width: auto;
  object-fit: contain;
  margin: 0;
  display: block;
}

.login-right {
  flex: 1;
  /* 填充剩余空间 */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  /* 在顶部、中间和底部之间分配空间 */
  align-items: center;
  padding: 40px 0 20px;
  /* 调整上下内边距 */
  background-color: #fff;
  position: relative;
}

.login-header {
  width: 90%;
  max-width: 400px;
  display: flex;
  justify-content: flex-end;
  /* 靠右对齐 */
  margin-bottom: 20px;
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-image {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.logo-text {
  font-weight: 600;
  font-size: 18px;
  color: var(--text-color);
  letter-spacing: 0.5px;
}

.login-tabs {
  width: 90%;
  max-width: 400px;
  padding: 0;
  min-height: 340px;
  /* 稍微减小高度，为底部留出空间 */
}

.login-footer {
  width: 90%;
  max-width: 400px;
  display: flex;
  justify-content: flex-end;
  /* 靠右对齐 */
  margin-top: 20px;
  gap: 20px;
}

.policy-links {
  display: flex;
  align-items: center;
  gap: 15px;
}

.policy-link {
  font-size: 13px;
  color: var(--text-lightest);
  text-decoration: none;
  transition: color 0.3s;
}

.policy-link:hover {
  color: var(--primary-color);
}

.github-link {
  color: var(--text-color);
  font-size: 20px;
  display: flex;
  align-items: center;
  transition: color 0.3s;
}

.github-link:hover {
  color: var(--primary-color);
}

.tab-header {
  display: flex;
  margin-bottom: 30px;
  border-bottom: 1px solid #ddd;
  width: 100%;
  /* 确保宽度一致 */
}

.tab-item {
  padding: 10px 0;
  margin-right: 30px;
  cursor: pointer;
  position: relative;
  color: var(--text-lighter);
  font-size: 16px;
  font-weight: 500;
}

.tab-item.active {
  color: var(--text-color);
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary-color);
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  margin-bottom: 8px;
  color: var(--text-color);
  font-size: 12px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  box-sizing: border-box;
  /* 确保宽度包含内边距和边框 */
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 0;
  font-size: 14px;
  background-color: #fff;
  color: var(--text-color);
  transition: border-color 0.3s;
  outline: none;
  /* 移除默认的浏览器焦点样式 */
}

.form-input:focus {
  border-color: var(--primary-color);
}



.sign-in-button {
  width: 100%;
  box-sizing: border-box;
  /* 确保宽度包含内边距和边框 */
  padding: 14px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0;
  cursor: pointer;
  font-weight: 500;
  font-size: 16px;
  letter-spacing: 1px;
  transition: background-color 0.3s;
  margin-top: 10px;
}

.sign-in-button:hover {
  background-color: var(--primary-hover);
}

/* 添加表单容器样式 */
.form-container {
  min-height: 280px;
  /* 设置表单最小高度，让按钮位置相对固定 */
  display: flex;
  flex-direction: column;
}

/* 将按钮推到底部 */
.form-container .form-group:last-child {
  margin-top: auto;
  padding-top: 20px;
}

/* 响应式布局调整 */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }

  .login-left {
    width: 100%;
    height: 200px;
    /* 限制高度 */
    overflow: hidden;
  }

  .login-left .head-image {
    max-height: 200px;
  }

  .login-right {
    padding: 30px 0 20px;
  }

  .login-header,
  .login-tabs,
  .login-footer {
    width: 85%;
  }
}

@media (max-width: 480px) {
  .login-left {
    height: 150px;
  }

  .login-left .head-image {
    max-height: 150px;
  }

  .login-header,
  .login-tabs,
  .login-footer {
    width: 90%;
  }

  .login-footer {
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
  }
}
</style>
