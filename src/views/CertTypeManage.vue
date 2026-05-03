<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-size: 16px; font-weight: bold">证书类型管理</span>
          <el-button type="primary" size="small" @click="openDialog()">新增类型</el-button>
        </div>
      </template>
      <el-table :data="tableData" stripe>
        <el-table-column prop="code" label="编码" min-width="160" />
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="openDialog(row)">编辑</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editId ? '编辑类型' : '新增类型'" width="400px">
      <el-form ref="formRef" :model="form" label-width="80px">
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" placeholder="如: BUSINESS_LICENSE" :disabled="!!editId" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如: 营业执照" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { certTypeApi } from '../api/certType'

const tableData = ref([])
const dialogVisible = ref(false)
const editId = ref(null)
const formRef = ref(null)
const form = reactive({ code: '', name: '', sortOrder: 0 })

onMounted(() => loadData())

async function loadData() {
  try { tableData.value = (await certTypeApi.list()).data || [] } catch (e) {}
}

function openDialog(row) {
  if (row) {
    editId.value = row.id
    Object.assign(form, { code: row.code, name: row.name, sortOrder: row.sortOrder })
  } else {
    editId.value = null
    Object.assign(form, { code: '', name: '', sortOrder: 0 })
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.code || !form.name) { ElMessage.warning('编码和名称不能为空'); return }
  try {
    if (editId.value) {
      await certTypeApi.update(editId.value, form)
    } else {
      await certTypeApi.create(form)
    }
    ElMessage.success(editId.value ? '已更新' : '已创建')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.name}」吗？`, '删除确认', { type: 'warning' })
    await certTypeApi.remove(row.id)
    ElMessage.success('已删除')
    loadData()
  } catch (e) { if (e !== 'cancel') ElMessage.error('删除失败') }
}
</script>
