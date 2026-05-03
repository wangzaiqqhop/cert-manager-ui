<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <span style="font-size: 16px; font-weight: bold">回收站</span>
      </template>
      <el-alert type="info" :closable="false" style="margin-bottom: 12px">
        删除的证书保留 30 天，期间可恢复。超期系统自动清理。
      </el-alert>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="name" label="证书名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">{{ certTypeLabel(row.type) }}</template>
        </el-table-column>
        <el-table-column label="归属人" width="100">
          <template #default="{ row }">{{ personName(row.personId) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="原状态" width="90" align="center" />
        <el-table-column prop="updatedAt" label="删除时间" width="160">
          <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="info" size="small" link @click="$router.push(`/certificates/${row.id}`)">查看</el-button>
            <el-button type="primary" size="small" link @click="handleRestore(row)">恢复</el-button>
            <el-button type="danger" size="small" link @click="handlePermanentDelete(row)">彻底删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top: 16px; display: flex; justify-content: flex-end">
        <el-pagination
          v-model:current-page="page" v-model:page-size="size" :total="total"
          :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next"
          @size-change="loadData" @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { certificateApi } from '../api/certificate'
import { personApi } from '../api/person'
import { certTypeLabel } from '../utils/certType'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const persons = ref([])

onMounted(async () => {
  try {
    const res = await personApi.list({ size: 1000 })
    persons.value = res.data?.content || res.data?.records || res.data?.data || []
  } catch (e) { /* ignore */ }
  loadData()
})

function personName(personId) {
  return persons.value.find(p => p.id === personId)?.name || '-'
}

function formatDate(d) { return d ? d.substring(0, 16) : '-' }

async function loadData() {
  loading.value = true
  try {
    const res = await certificateApi.listRecycleBin({ page: page.value, size: size.value })
    tableData.value = res.data?.content || res.data?.records || res.data?.data || []
    total.value = res.data?.totalElements || 0
  } catch (e) { /* ignore */ } finally { loading.value = false }
}

async function handleRestore(row) {
  try {
    await ElMessageBox.confirm(`确定恢复「${row.name}」吗？`, '恢复确认', { type: 'info' })
    await certificateApi.restore(row.id)
    ElMessage.success('已恢复')
    loadData()
  } catch (e) { if (e !== 'cancel') ElMessage.error('恢复失败') }
}

async function handlePermanentDelete(row) {
  try {
    await ElMessageBox.confirm(`彻底删除后无法恢复，确定删除「${row.name}」？`, '警告', { type: 'error' })
    await certificateApi.permanentDelete(row.id)
    ElMessage.success('已彻底删除')
    loadData()
  } catch (e) { if (e !== 'cancel') ElMessage.error('删除失败') }
}
</script>
