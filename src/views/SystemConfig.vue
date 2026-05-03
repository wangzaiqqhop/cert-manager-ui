<template>
  <div class="page-container">
    <el-card>
      <template #header><span style="font-size:16px;font-weight:bold">系统配置</span></template>
      <el-form label-width="120px" v-loading="loading">
        <el-divider content-position="left">SMTP 邮件配置</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="SMTP 服务器"><el-input v-model="form['smtp.host']" /></el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="端口"><el-input v-model="form['smtp.port']" /></el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="SSL"><el-switch v-model="sslSwitch" /></el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="发件人邮箱"><el-input v-model="form['smtp.username']" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="授权码"><el-input v-model="form['smtp.password']" type="password" show-password /></el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">提醒设置</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="启用邮件提醒"><el-switch v-model="reminderSwitch" /></el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="提醒天数"><el-input v-model="form['reminder.days']" placeholder="逗号分隔，如: 7,3,1" /></el-form-item>
          </el-col>
        </el-row>

        <el-form-item style="margin-top:24px">
          <el-button type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
          <span style="margin-left:12px;font-size:12px;color:#909399">保存后下次提醒生效</span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
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
    ElMessage.success('配置已保存，下次提醒生效')
  } catch(e) { ElMessage.error('保存失败') }
  finally { saving.value = false }
}
</script>
