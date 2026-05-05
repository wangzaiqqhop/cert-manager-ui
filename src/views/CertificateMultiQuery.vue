<template>
  <div class="page-container">
    <!-- 标题 -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <el-button text @click="$router.push('/certificates')">
        <el-icon><ArrowLeft /></el-icon>返回
      </el-button>
      <span style="font-size:16px;font-weight:700;color:var(--brand-dark)">多证书人员查询</span>
    </div>

    <!-- 筛选区 -->
    <el-card shadow="never" style="margin-bottom:16px">
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start">
        <div>
          <div style="font-size:12px;color:#909399;margin-bottom:4px">证书名称 <span style="color:#f56c6c">*</span></div>
          <el-popover placement="bottom-start" :width="320" trigger="click">
            <template #reference>
              <div class="name-trigger" :class="{ 'has-value': query.names.length > 0 }">
                <span v-if="query.names.length === 0" class="name-placeholder">请选择证书名称</span>
                <span v-else class="name-summary">已选 <strong>{{ query.names.length }}</strong> 项：{{ query.names.slice(0, 2).join('、') }}<template v-if="query.names.length > 2">...</template></span>
                <el-icon style="color:#c0c4cc;flex-shrink:0;margin-left:auto"><ArrowDown /></el-icon>
              </div>
            </template>
            <div style="padding:4px 0">
              <div style="padding:0 12px 8px;border-bottom:1px solid #f0f0f0;margin-bottom:4px">
                <el-button text size="small" @click="query.names=[]" v-if="query.names.length">清空已选</el-button>
                <span v-else style="font-size:12px;color:#c0c4cc">勾选需要查询的证书名称</span>
              </div>
              <div style="max-height:280px;overflow-y:auto;padding:0 12px">
                <el-checkbox-group v-model="query.names">
                  <el-checkbox v-for="n in certNames" :key="n" :label="n" style="display:flex;align-items:center;height:34px;margin:0;border-bottom:1px solid #fafafa">{{ n }}</el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
          </el-popover>
        </div>
        <div>
          <div style="font-size:12px;color:#909399;margin-bottom:4px">证书状态</div>
          <el-select v-model="query.status" placeholder="全部" clearable style="width:180px">
            <el-option label="有效" value="VALID" />
            <el-option label="即将过期" value="EXPIRING_SOON" />
            <el-option label="已过期" value="EXPIRED" />
          </el-select>
        </div>
        <div>
          <div style="font-size:12px;color:#909399;margin-bottom:4px">到期不早于</div>
          <el-date-picker v-model="query.validToAfter" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:160px" />
        </div>
        <div>
          <div style="font-size:12px;color:#909399;margin-bottom:4px">姓名搜索</div>
          <el-input v-model="query.keyword" placeholder="人员姓名" clearable style="width:160px" @keyup.enter="handleQuery" />
        </div>
        <el-button type="primary" :loading="loading" @click="handleQuery" style="margin-top:20px">
          <el-icon><Search /></el-icon>查询
        </el-button>
      </div>
    </el-card>

    <!-- 结果区 -->
    <el-card v-if="queried" shadow="never" style="margin-bottom:16px" v-loading="loading">
      <template #header>
        <span class="brand-card-header">查询结果：共 <strong>{{ results.length }}</strong> 人</span>
      </template>

      <el-empty v-if="results.length === 0" description="未找到匹配的人员" />

      <div v-for="person in results" :key="person.personId" style="border:1px solid #e8eaed;border-radius:8px;margin-bottom:12px;overflow:hidden">
        <div style="background:#f5f7fa;padding:10px 16px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <strong style="font-size:14px;color:#0a2540">{{ person.personName }}</strong>
            <span style="color:#909399;margin-left:8px;font-size:12px">{{ person.personNo }}</span>
            <el-tag size="small" type="info" style="margin-left:8px">{{ person.department }}</el-tag>
          </div>
          <span style="font-size:11px;color:#c0c4cc">{{ person.certificates.length }} 本证书</span>
        </div>
        <el-table :data="person.certificates" size="small" stripe>
          <el-table-column prop="name" label="证书名称" min-width="140">
            <template #default="{ row }">
              <router-link :to="`/certificates/${row.id}`" style="color:var(--brand-primary);font-weight:500">{{ row.name }}</router-link>
            </template>
          </el-table-column>
          <el-table-column prop="serialNumber" label="证书编号" width="130">
            <template #default="{ row }">{{ row.serialNumber || '-' }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="90" align="center">
            <template #default="{ row }">
              <StatusBadge :status="row.status" />
            </template>
          </el-table-column>
          <el-table-column label="到期日" width="110">
            <template #default="{ row }">{{ row.validTo ? row.validTo.substring(0, 10) : '-' }}</template>
          </el-table-column>
          <el-table-column label="文件" width="120" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.hasJpg" type="success" size="small" effect="plain">JPG</el-tag>
              <el-tag v-if="row.hasPdf" size="small" effect="plain" style="margin-left:4px">PDF</el-tag>
              <span v-if="!row.hasJpg && !row.hasPdf" style="color:#c0c4cc">无</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 下载区 -->
    <el-card v-if="results.length > 0" shadow="never" style="border:1px solid #b3d9ff;background:#f0f6ff">
      <template #header>
        <span class="brand-card-header">一键下载</span>
      </template>
      <div style="display:flex;gap:20px;align-items:flex-end;flex-wrap:wrap">
        <div>
          <div style="font-size:12px;color:#909399;margin-bottom:4px">水印文字</div>
          <el-input v-model="watermark" placeholder="仅供XX备案使用" maxlength="200" style="width:240px" show-word-limit />
        </div>
        <div>
          <div style="font-size:12px;color:#909399;margin-bottom:4px">文件类型</div>
          <el-checkbox-group v-model="downloadTypes">
            <el-checkbox label="JPG">JPG</el-checkbox>
            <el-checkbox label="PDF">PDF</el-checkbox>
          </el-checkbox-group>
        </div>
        <el-button type="primary" :loading="downloading" @click="handleDownload" size="large" style="height:44px">
          <el-icon><Download /></el-icon>一键下载全部证书
        </el-button>
      </div>
      <div style="font-size:11px;color:#909399;margin-top:10px">
        将打包所有查询结果中的证书文件，按 人员编号_姓名/证书名称.ext 命名
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Search, Download, ArrowDown } from '@element-plus/icons-vue'
import { certificateApi } from '../api/certificate'
import StatusBadge from '../components/StatusBadge.vue'

const loading = ref(false)
const queried = ref(false)
const results = ref([])
const certNames = ref([])
const downloadTypes = ref(['JPG', 'PDF'])
const watermark = ref('')
const downloading = ref(false)

const query = reactive({
  names: [],
  status: '',
  validToAfter: '',
  keyword: ''
})

onMounted(async () => {
  try {
    const res = await certificateApi.listNames()
    certNames.value = res.data || []
  } catch (e) { /* ignore */ }
})

async function handleQuery() {
  if (query.names.length === 0) {
    ElMessage.warning('请至少选择一个证书名称')
    return
  }
  loading.value = true
  queried.value = true
  try {
    const res = await certificateApi.queryByNames({
      names: query.names,
      status: query.status || null,
      validToAfter: query.validToAfter || null,
      keyword: query.keyword || null
    })
    results.value = res.data || []
  } catch (e) {
    results.value = []
  } finally {
    loading.value = false
  }
}

async function handleDownload() {
  const certIds = []
  results.value.forEach(p => {
    p.certificates.forEach(c => certIds.push(c.id))
  })
  if (certIds.length === 0) {
    ElMessage.warning('没有可下载的证书')
    return
  }
  downloading.value = true
  try {
    const blob = await certificateApi.batchDownload({
      certIds,
      fileTypes: downloadTypes.value.length > 0 ? downloadTypes.value : ['JPG', 'PDF'],
      watermark: watermark.value || null
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'certificates-' + new Date().toISOString().substring(0, 10) + '.zip'
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('下载完成')
  } catch (e) {
    ElMessage.error('下载失败')
  } finally {
    downloading.value = false
  }
}
</script>
<style scoped>
.name-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 240px;
  max-width: 100%;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  user-select: none;
}
.name-trigger:hover { border-color: var(--brand-primary); box-shadow: 0 0 0 1px rgba(0,160,233,0.1); }
.name-trigger.has-value { border-color: var(--brand-primary); background: #f0f9ff; }
.name-placeholder { color: #c0c4cc; font-size: 13px; }
.name-summary { font-size: 13px; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
