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
        <el-menu-item v-if="userStore.isSuperAdmin" index="/admin/users">
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
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-dropdown">
              <span style="color: #606266">{{ userStore.userInfo?.username || '' }}</span>
              <el-icon style="margin-left: 4px"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="changePassword">修改密码</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="danger" size="small" @click="handleLogout">退出</el-button>
        </div>
      </el-header>

      <!-- Main Content -->
      <el-main style="background: #f0f2f5">
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <!-- Password Change Dialog -->
  <el-dialog v-model="dialogVisible" title="修改密码" width="400px" :close-on-click-modal="false">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="旧密码" prop="oldPassword">
        <el-input v-model="form.oldPassword" type="password" show-password placeholder="请输入旧密码" />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="form.newPassword" type="password" show-password placeholder="请输入新密码" />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { userApi } from '../api/user'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

function handleLogout() {
  userStore.logout()
  router.push('/login')
}

const dialogVisible = ref(false)
const loading = ref(false)
const formRef = ref(null)

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirm = (rule, value, callback) => {
  if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

function handleCommand(command) {
  if (command === 'changePassword') {
    form.oldPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
    dialogVisible.value = true
  }
}

async function handleSubmit() {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await userApi.changePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword })
      ElMessage.success('密码修改成功')
      dialogVisible.value = false
    } catch (err) {
      ElMessage.error(err.message || '修改密码失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 4px;
}
.user-dropdown:hover {
  color: #409eff;
}
</style>