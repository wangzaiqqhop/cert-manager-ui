<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <span style="font-size: 16px; font-weight: bold">上传证书</span>
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

        <el-form-item label="证书文件" prop="files">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :multiple="true"
            :limit="2"
            :on-change="handleFilesChange"
            :on-remove="handleFilesRemove"
            accept=".pdf,.jpg,.jpeg,.png"
            drag
          >
            <el-icon style="font-size: 40px; color: #409eff"><UploadFilled /></el-icon>
            <div style="margin-top: 8px; color: #606266">将文件拖到此处，或<em style="color: #409eff">点击上传</em></div>
            <template #tip>
              <div style="color: #909399; font-size: 12px; margin-top: 4px">支持 PDF/JPG/PNG，可同时上传多份（同一类型限一份），大小不超过 50MB</div>
            </template>
          </el-upload>
        </el-form-item>

        <!-- 已上传文件列表 -->
        <el-form-item label="已选文件" v-if="selectedFiles.length > 0">
          <div style="display: flex; flex-direction: column; gap: 8px">
            <div v-for="f in selectedFiles" :key="f.name" style="display: flex; align-items: center; gap: 8px">
              <el-tag :type="f.type === 'PDF' ? 'danger' : 'success'" size="small">{{ f.type }}</el-tag>
              <span style="flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ f.name }}</span>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">提交</el-button>
          <el-button @click="$router.push('/certificates')">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { certificateApi } from '../api/certificate'
import { personApi } from '../api/person'
import { certTypeApi } from '../api/certType'

const router = useRouter()
const formRef = ref(null)
const uploadRef = ref(null)
const loading = ref(false)
const persons = ref([])
const certTypes = ref([])
const selectedFiles = ref([])  // [{ raw: File, type: 'JPG'|'PDF', name: string }]

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
})

function detectFileType(file) {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return 'PDF'
  return 'JPG'
}

function handleFilesChange(fileItem, newFiles) {
  const newFile = fileItem.raw
  const type = detectFileType(newFile)
  // 同类型文件已存在则替换
  selectedFiles.value = selectedFiles.value.filter(f => f.type !== type)
  selectedFiles.value.push({ raw: newFile, type, name: newFile.name })
}

function handleFilesRemove(fileItem) {
  selectedFiles.value = selectedFiles.value.filter(f => f.raw !== fileItem.raw)
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (selectedFiles.value.length === 0) {
    ElMessage.warning('请上传至少一个证书文件')
    return
  }

  loading.value = true
  try {
    const formData = new FormData()
    Object.entries(form).forEach(([key, val]) => {
      if (val !== null && val !== '') {
        formData.append(key, val)
      }
    })
    selectedFiles.value.forEach(({ raw }) => {
      formData.append('files', raw)
    })

    await certificateApi.create(formData)
    ElMessage.success('上传成功')
    router.push('/certificates')
  } catch (e) {
    // handled by axios interceptor
  } finally {
    loading.value = false
  }
}
</script>
