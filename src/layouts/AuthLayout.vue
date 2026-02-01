<template>
  <div class="auth-layout">
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
/**
 * 认证页面布局组件
 * @description 为登录注册等认证页面提供简洁的布局
 */
</script>

<style scoped>
.auth-layout {
  display: flex;
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  background-color: #fff;
}
</style>
