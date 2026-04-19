<template>
  <el-container style="height: 100vh">
    <!-- Left Sidebar -->
    <el-aside width="220px" style="background: #304156">
      <div style="height: 60px; line-height: 60px; text-align: center; color: #fff; font-size: 18px; font-weight: bold; background: #263445">
        证书管理系统
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/certificates">
          <el-icon><Document /></el-icon>
          <span>证书列表</span>
        </el-menu-item>
        <el-menu-item index="/certificates/upload">
          <el-icon><Upload /></el-icon>
          <span>上传证书</span>
        </el-menu-item>
        <el-menu-item v-if="userStore.isAdmin" index="/admin/persons">
          <el-icon><User /></el-icon>
          <span>归属人管理</span>
        </el-menu-item>
        <el-menu-item v-if="userStore.isAdmin" index="/admin/users">
          <el-icon><UserFilled /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item v-if="userStore.isAdmin" index="/admin/audit-logs">
          <el-icon><Operation /></el-icon>
          <span>审计日志</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- Top Header -->
      <el-header style="display: flex; align-items: center; justify-content: flex-end; background: #fff; border-bottom: 1px solid #e6e6e6; padding: 0 20px">
        <div style="display: flex; align-items: center; gap: 12px">
          <span style="color: #606266">{{ userStore.userInfo?.username || '' }}</span>
          <el-button type="danger" size="small" @click="handleLogout">退出</el-button>
        </div>
      </el-header>

      <!-- Main Content -->
      <el-main style="background: #f0f2f5">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>
