<template>
  <div class="page-container">
    <el-card v-loading="loading">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-size: 16px; font-weight: bold">编辑证书</span>
          <el-button @click="$router.push(`/certificates/${route.params.id}`)">返回详情</el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 700px">
        <el-form-item label="归属人" prop="personId">
          <el-select v-model="form.personId" placeholder="请选择归属人" style="width: 100%">
            <el-option v-for="p in persons" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="证书名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入证书名称" clearable />
        </el-form-item>

        <el-form-item label="证书类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择证书类型" style="width: 100%">
            <el-option v-for="t in certTypes" :key="t.code" :label="t.name" :value="t.code" />
          </el-select>
        </el-form-item>

        <el-form-item label="颁发机构" prop="issuer">
          <el-input v-model="form.issuer" placeholder="请输入颁发机构" clearable />
        </el-form-item>

        <el-form-item label="证书编号" prop="serialNumber">
          <el-input v-model="form.serialNumber" placeholder="请输入证书编号" clearable />
        </el-form-item>

        <el-form-item label="主题" prop="subject">
          <el-input v-model="form.subject" placeholder="请输入证书主题" clearable />
        </el-form-item>

        <el-form-item label="生效时间" prop="validFrom">
          <el-date-picker v-model="form.validFrom" type="date" placeholder="选择生效时间" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>

        <el-form-item label="失效时间" prop="validTo">
          <el-date-picker v-model="form.validTo" type="date" placeholder="选择失效时间" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="可选" clearable />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
          <el-button @click="$router.push(`/certificates/${route.params.id}`)">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { certificateApi } from '../api/certificate'
import { personApi } from '../api/person'
import { certTypeApi } from '../api/certType'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const persons = ref([])
const certTypes = ref([])

const form = reactive({
  personId: null,
  name: '',
  type: '',
  issuer: '',
  serialNumber: '',
  subject: '',
  validFrom: '',
  validTo: '',
  description: ''
})

const rules = {
  personId: [{ required: true, message: '请选择归属人', trigger: 'change' }],
  name: [{ required: true, message: '请输入证书名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择证书类型', trigger: 'change' }],
  issuer: [{ required: true, message: '请输入颁发机构', trigger: 'blur' }],
  validTo: [{ required: true, message: '请选择失效时间', trigger: 'change' }]
}

onMounted(async () => {
  await Promise.all([loadPersons(), loadData()])
})

async function loadPersons() {
  try {
    const [pRes, tRes] = await Promise.all([
      personApi.list({ size: 1000 }),
      certTypeApi.list()
    ])
    persons.value = pRes.data?.content || pRes.data?.records || pRes.data?.data || []
    certTypes.value = tRes.data || []
  } catch (e) {
    // ignore
  }
}

async function loadData() {
  loading.value = true
  try {
    const res = await certificateApi.getById(route.params.id)
    const cert = res.data
    if (cert) {
      form.personId = cert.personId
      form.name = cert.name
      form.type = cert.type
      form.issuer = cert.issuer
      form.serialNumber = cert.serialNumber || ''
      form.subject = cert.subject || ''
      form.validFrom = cert.validFrom ? cert.validFrom.substring(0, 10) : ''
      form.validTo = cert.validTo ? cert.validTo.substring(0, 10) : ''
      form.description = cert.description || ''
    }
  } catch (e) {
    ElMessage.error('加载证书信息失败')
    router.push(`/certificates/${route.params.id}`)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  // 判重检查（排除自身）
  try {
    const dupRes = await certificateApi.checkDuplicate({
      serialNumber: form.serialNumber || '',
      issuer: form.issuer || '',
      name: form.name || '',
      type: form.type || '',
      personId: form.personId ? String(form.personId) : ''
    })
    const otherDupes = (dupRes.data || []).filter(d => d.id !== Number(route.params.id))
    if (otherDupes.length > 0) {
      const names = otherDupes.map(d => `「${d.name}」(${d.serialNumber || '无编号'})`).join('、')
      await ElMessageBox.confirm(
        `修改后与已有证书重复：${names}，是否继续保存？`,
        '重复提醒',
        { confirmButtonText: '继续保存', cancelButtonText: '取消', type: 'warning' }
      )
    }
  } catch (e) {
    if (e === 'cancel' || e === 'close') return
  }

  saving.value = true
  try {
    await certificateApi.update(route.params.id, {
      personId: form.personId,
      name: form.name,
      type: form.type,
      issuer: form.issuer,
      serialNumber: form.serialNumber,
      subject: form.subject,
      validFrom: form.validFrom,
      validTo: form.validTo,
      description: form.description
    })
    ElMessage.success('保存成功')
    router.push(`/certificates/${route.params.id}`)
  } catch (e) {
    // handled by axios interceptor
  } finally {
    saving.value = false
  }
}
</script>
