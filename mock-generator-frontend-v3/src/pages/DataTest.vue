<script setup>
import {ref, onMounted, computed, watchEffect} from 'vue'
import { ElTable, ElTableColumn, ElButton, ElSelect, ElOption, ElInputNumber, ElMessage, ElTabs, ElTabPane,ElAlert } from 'element-plus'
import axios from 'axios'
import { useRoute } from 'vue-router'
import {getSchemaData, getSchemas} from "../services/schemaService.js";

const route = useRoute()
const schemaId = ref(route.query.schemaId || '')
const schemas = ref([])
const data = ref([])
const loading = ref(false)
const count = ref(10)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const jsonView = ref('table')
const jsonData = ref('')
const selectedSchema = ref({})

// 获取Schema列表
const fetchSchemas = async () => {
  try {
    const response = await getSchemas()
    schemas.value = response
    // 如果有schemaId参数，自动选中对应的schema
    if (schemaId.value) {
      const schema = response.find(item => item.id === schemaId.value)
      if (schema) {
        selectedSchema.value = schema
        await fetchData(schema.id)
      }
    }
  } catch (error) {
    ElMessage.error('获取Schema列表失败: ' + error.message)
    console.error('获取Schema列表失败:', error)
  }
}

// 获取测试数据
const fetchData = async (id) => {
  if (!id) {
    // ElMessage.warning('请先选择Schema')
    return
  }

  loading.value = true
  try {
    const {data:list,pagination} = await getSchemaData(id,{
      page: currentPage.value,
      pageSize: pageSize.value
    })
    data.value = list
    total.value = pagination.total
    // 格式化JSON数据用于展示
    jsonData.value = JSON.stringify(list, null, 2)
  } catch (error) {
    ElMessage.error('获取数据失败: ' + error.message)
    console.error('获取数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  if (selectedSchema.value) {
    fetchData(selectedSchema.value.id)
  }
}

// 处理分页变化
const handlePageChange = (currentPageVal) => {
  currentPage.value = currentPageVal
}

// 处理页面大小变化
const handleSizeChange = (pageSizeVal) => {
  pageSize.value = pageSizeVal
}
//监听分页参数的变化
watchEffect(()=>{
  fetchData(selectedSchema.value.id||schemaId.value)
})


// 处理Schema选择变化
const handleSchemaChange = (id) => {
  const schema = schemas.value.find(item => item.id === id)
  if (schema) {
    selectedSchema.value = schema
    fetchData(id)
  }
}

// 下载数据
const downloadData = () => {
  if (!data.value || data.value.length === 0) {
    ElMessage.warning('没有数据可下载')
    return
  }
  loading.value= true

  const json = JSON.stringify(data.value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${Date.now()}_data.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  setTimeout(()=>{
    loading.value =false
  })
}

// 复制数据
const copyData = () => {
  navigator.clipboard.writeText(jsonData.value)
    .then(() => {
      ElMessage.success('数据已复制到剪贴板')
    })
    .catch(err => {
      ElMessage.error('复制失败: ' + err.message)
      console.error('复制失败:', err)
    })
}

onMounted(() => {
  fetchSchemas()
})
</script>

<template>
  <div class="data-test-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>数据测试</span>
        </div>
      </template>

      <el-alert
        title="提示"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        选择Schema并查看生成的Mock数据，可以复制或下载数据
      </el-alert>

      <div class="search-container">
        <el-select
          v-model="selectedSchema.id"
          placeholder="请选择Schema"
          :disabled="!!schemaId"
          style="width: 300px; margin-right: 10px"
          @change="handleSchemaChange"
        >
          <el-option
            v-for="schema in schemas"
            :key="schema.id"
            :label="schema.name"
            :value="schema.id"
          />
        </el-select>

        <el-button
          type="primary"
          @click="refreshData"
          :loading="loading"
        >
          刷新数据
        </el-button>

        <el-button
          type="success"
          @click="downloadData"
          style="margin-left: 10px"
          :disabled="data.length === 0"
          :loading="loading"
        >
          下载数据
        </el-button>
      </div>

      <div class="display-options" style="margin-top: 20px; margin-bottom: 20px">
        <el-tabs v-model="jsonView" type="card">
          <el-tab-pane label="表格视图" name="table" />
          <el-tab-pane label="JSON视图" name="json" />
        </el-tabs>
      </div>

      <!-- 表格视图 -->
      <div v-if="jsonView === 'table'">
        <el-table
          v-loading="loading"
          :data="data"
          style="width: 100%"
          height="300"
          border
        >
          <el-table-column

            v-for="(value, key) in data[0] || {}"
            :key="key"
            :prop="key"
            :label="key"
            min-width="200"
            show-overflow-tooltip
          />
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <!-- JSON视图 -->
      <div v-else-if="jsonView === 'json'">
        <el-button
          type="primary"
          @click="copyData"
          style="margin-top: 10px"
        >
          复制JSON
        </el-button>
        <div class="json-container">
          <pre><code class="json-display">{{ jsonData }}</code></pre>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.data-test-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-container {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.json-container {
  position: relative;
  height: 300px;
  overflow: auto;
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 15px;
  box-sizing: border-box;
}

.json-display {
  margin: 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
