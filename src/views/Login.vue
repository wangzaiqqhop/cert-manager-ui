<template>
  <div class="login-wrapper-brand">
    <!-- 装饰几何元素 -->
    <div class="login-decor-geo"></div>
    <div class="login-decor-geo-2"></div>
    <div class="login-decor-dots">
      <span v-for="i in 20" :key="i" class="dot" :style="dotStyle(i)"></span>
    </div>

    <el-card class="login-card-brand" shadow="never">
      <!-- 品牌Logo区域 -->
      <div class="login-brand-area">
        <div class="brand-logo-icon login-logo">
          <img src="/images/logo.svg" alt="CHATONE 捷通" />
        </div>
        <div class="login-system-title">证书管理系统</div>
        <div class="login-system-sub">Certificate Management System</div>
      </div>

      <!-- 分隔线 -->
      <div class="login-divider">
        <span>账号登录</span>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%; height: 44px; font-size: 16px" :loading="loading" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 底部版权 -->
    <div class="login-copyright">
      捷通智慧科技股份有限公司 © {{ new Date().getFullYear() }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
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

function dotStyle(i) {
  const size = 2 + Math.random() * 3
  const top = Math.random() * 100
  const left = Math.random() * 100
  const delay = Math.random() * 3
  return {
    width: size + 'px',
    height: size + 'px',
    top: top + '%',
    left: left + '%',
    animationDelay: delay + 's'
  }
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
    // handled by axios interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-decor-geo {
  position: absolute;
  width: 500px;
  height: 500px;
  border: 2px solid rgba(255, 255, 255, 0.06);
  border-radius: 40% 60% 55% 45% / 45% 50% 50% 55%;
  top: 15%;
  left: 10%;
  animation: geoRotate 20s linear infinite;
  pointer-events: none;
}

.login-decor-geo-2 {
  position: absolute;
  width: 350px;
  height: 350px;
  border: 1.5px solid rgba(255, 255, 255, 0.05);
  border-radius: 55% 45% 40% 60% / 50% 55% 45% 50%;
  bottom: 20%;
  right: 12%;
  animation: geoRotate 25s linear infinite reverse;
  pointer-events: none;
}

@keyframes geoRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.login-decor-dots {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.dot {
  position: absolute;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  animation: dotPulse 3s ease-in-out infinite;
}

@keyframes dotPulse {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.8); }
}

.login-brand-area {
  text-align: center;
  margin-bottom: 28px;
}

.login-brand-area .brand-logo-icon {
  margin: 0 auto 12px;
  width: 72px;
  height: 72px;
  padding: 14px;
}

.login-system-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--brand-dark);
  letter-spacing: 2px;
}

.login-system-sub {
  font-size: 12px;
  color: #909399;
  letter-spacing: 1px;
  margin-top: 6px;
  text-transform: uppercase;
}

.login-divider {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
  color: #c0c4cc;
  font-size: 12px;
}

.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #eee;
}

.login-copyright {
  position: absolute;
  bottom: 28px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 1px;
}
</style>
