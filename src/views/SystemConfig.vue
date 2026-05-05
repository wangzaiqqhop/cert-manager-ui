<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div style="display:flex;align-items:center;gap:10px">
          <span class="brand-card-header">系统配置</span>
          <span style="font-size:12px;color:#909399">SMTP 邮件 & 证书提醒策略</span>
        </div>
      </template>
      <el-form label-width="140px" v-loading="loading">

        <!-- SMTP 配置 -->
        <div class="config-section">
          <div class="config-section-title">
            <el-icon><Message /></el-icon> SMTP 邮件配置
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="SMTP 服务器">
                <el-input v-model="form['smtp.host']" placeholder="smtp.example.com" />
                <div class="form-hint">邮件服务商提供的 SMTP 地址</div>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="端口">
                <el-input v-model="form['smtp.port']" placeholder="465" />
                <div class="form-hint">通常是 465(SSL) 或 587</div>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="SSL">
                <el-switch v-model="sslSwitch" />
                <div class="form-hint">建议开启</div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="发件人邮箱">
                <el-input v-model="form['smtp.username']" placeholder="sender@example.com" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="授权码">
                <el-input v-model="form['smtp.password']" type="password" show-password placeholder="邮箱授权码（非登录密码）" />
                <div class="form-hint">在邮箱设置中生成，非登录密码</div>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 提醒设置 -->
        <div class="config-section">
          <div class="config-section-title">
            <el-icon><Bell /></el-icon> 提醒策略
          </div>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="启用邮件提醒">
                <el-switch v-model="reminderSwitch" />
                <div class="form-hint">关闭后不再发送过期提醒</div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="提醒天数">
                <el-input v-model="form['reminder.days']" placeholder="7,3,1" />
                <div class="form-hint">逗号分隔，如 14,7,3,1</div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="即将过期阈值">
                <el-input v-model="form['cert.expiryWarningDays']" placeholder="30">
                  <template #append>天</template>
                </el-input>
                <div class="form-hint">到期前 N 天标记为"即将过期"</div>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-form-item style="margin-top:28px">
          <el-button type="primary" size="large" :loading="saving" @click="handleSave">
            <el-icon><Select /></el-icon>保存配置
          </el-button>
          <span style="margin-left:14px;font-size:12px;color:#909399">保存后立即生效</span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Message, Bell, Select } from '@element-plus/icons-vue'
import { configApi } from '../api/systemConfig'

const loading = ref(false)
const saving = ref(false)
const form = reactive({})

const sslSwitch = computed({
  get: () => form['smtp.ssl'] === 'true',
  set: (v) => form['smtp.ssl'] = v ? 'true' : 'false'
})
const reminderSwitch = computed({
  get: () => form['reminder.enabled'] === 'true',
  set: (v) => form['reminder.enabled'] = v ? 'true' : 'false'
})

onMounted(async () => {
  loading.value = true
  try {
    const res = await configApi.list()
    for (const item of res.data || []) {
      form[item.configKey] = item.configValue
    }
  } catch(e) {} finally { loading.value = false }
})

async function handleSave() {
  saving.value = true
  try {
    await configApi.update(form)
    ElMessage.success('配置已保存，立即生效')
  } catch(e) { ElMessage.error('保存失败') }
  finally { saving.value = false }
}
</script>

<style scoped>
.config-section {
  background: #f8f9fb;
  border: 1px solid #eef0f4;
  border-radius: 10px;
  padding: 20px 24px;
  margin-bottom: 20px;
}
.config-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--brand-dark);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.config-section-title .el-icon {
  color: var(--brand-primary);
}
.form-hint {
  font-size: 11px;
  color: #c0c4cc;
  line-height: 1.4;
  margin-top: 2px;
}
</style>
