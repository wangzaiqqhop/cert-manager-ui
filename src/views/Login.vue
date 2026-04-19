<template>
  <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
    <el-card style="width: 400px">
      <template #header>
        <div style="text-align: center; font-size: 20px; font-weight: bold">证书管理系统</div>
      </template>
      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" clearable />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" show-password clearable @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width: 100%" :loading="loading" @click="handleLogin">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '../api/auth'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const data = await authApi.login(form.username, form.password)
    userStore.setToken(data.data.token)
    userStore.setUserInfo({
      userId: data.data.userId,
      username: data.data.username,
      role: data.data.role,
      passwordChanged: data.data.passwordChanged
    })
    ElMessage.success('登录成功')

    if (data.data?.passwordChanged === false) {
      ElMessage.warning('建议修改默认密码')
    }

    router.push('/')
  } catch (e) {
    // error handled by axios interceptor
  } finally {
    loading.value = false
  }
}
</script>
