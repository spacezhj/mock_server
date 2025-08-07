<script setup>
import {ref, reactive, onMounted, computed, onUnmounted, handleError} from 'vue'
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElMessage,
  ElSelect,
  ElOption,
  ElInputNumber,
  ElAlert,
  ElTooltip,
  ElAutocomplete
} from 'element-plus'
import {useRouter, useRoute} from 'vue-router'
import {createSchema, updateSchema, getSchemaById} from '../services/schemaService'

const router = useRouter()
const route = useRoute()
const schemaId = route.params.id
const isEdit = !!schemaId
const form = reactive({
  name: '',
  resourceName: '',
  count: 10,
  schema: {},
  customFields: []
})
const formRef = ref(null)
// 使用计算属性实现resourceName与name联动但可独立修改
const resourceName = ref('')
const resourceNameComputed = computed({
  get() {
    form.resourceName = form.name
    return resourceName.value || form.name.replace(/\s+/g, '_').toLowerCase()
  },
  set(val) {
    resourceName.value = val
    form.resourceName = val
  }
})
const loading = ref(false)
const formRules = {
  name: [
    {required: true, message: '请输入Schema名称', trigger: 'blur'}
  ],
  resourceName: [
    {required: false, message: '请输入资源名称', trigger: ['blur', 'change']},
    {pattern: /^[a-zA-Z0-9_]+$/, message: '资源名称只能包含字母、数字和下划线', trigger: 'blur'}
  ],
  count: [
    {required: true, message: '请输入数据条数', trigger: 'blur'},
    {type: 'number', min: 1, max: 1000, message: '数据条数必须在1-1000之间', trigger: 'blur'}
  ],
  'customFields': [
    {required: true, message: '至少需要添加一个字段', trigger: 'blur'},
    {type: 'array', min: 1, message: '至少需要添加一个字段', trigger: 'blur'}
  ],
  'customFields.*.name': [
    {required: true, message: '字段名称不能为空', trigger: 'blur'},
    {pattern: /^[a-zA-Z0-9_]+$/, message: '字段名称只能包含字母、数字和下划线', trigger: 'blur'}
  ],
  'customFields.*.mock': [
    {required: true, message: 'mock表达式不能为空', trigger: 'blur'},
    {pattern: /^@/, message: 'mock表达式必须以@开头', trigger: 'blur'}
  ]
}
// 添加字段名称验证规则
const fieldNameRules = [
  {required: true, message: '字段名称不能为空', trigger: 'blur'},
  {pattern: /^[a-zA-Z0-9_]+$/, message: '字段名称只能包含字母、数字和下划线', trigger: 'blur'}
]
// customFields现在是form的属性，不再需要独立定义

const activeSuggestionIndex = ref(-1)
const showSuggestions = ref(false)
const currentField = ref(null)
const suggestionsRef = ref(null)
// 增强的Mock语法提示
const mockSuggestions = ref([
  {label: '@string', value: '@string', desc: '生成随机字符串'},
  {label: '@string(min,max)', value: '@string(1,10)', desc: '生成指定长度的字符串'},
  {label: '@integer', value: '@integer', desc: '生成随机数字'},
  {label: '@integer(min,max)', value: '@integer(1,100)', desc: '生成指定范围的数字'},
  {label: '@boolean', value: '@boolean', desc: '生成布尔值'},
  {label: '@date', value: '@date', desc: '生成日期'},
  {label: '@time', value: '@time', desc: '生成时间'},
  {label: '@datetime', value: '@datetime', desc: '生成日期时间'},
  {label: '@id', value: '@id', desc: '生成唯一ID'},
  {label: '@name', value: '@name', desc: '生成姓名'},
  {label: '@email', value: '@email', desc: '生成邮箱'},
  {label: '@url', value: '@url', desc: '生成URL'},
  {label: '@ip', value: '@ip', desc: '生成IP地址'},
  {label: '@phone', value: '@phone', desc: '生成手机号'},
  {label: '@address', value: '@address', desc: '生成地址'},
  {label: '@paragraph', value: '@paragraph', desc: '生成段落'},
  {label: '@sentence', value: '@sentence', desc: '生成句子'}
])

// 获取Schema详情
const fetchSchemaDetail = async () => {
  if (!isEdit) return
  loading.value = true
  try {
    const data = await getSchemaById(schemaId)
    form.name = data.name
    resourceName.value = data.resourceName
    form.count = data.count
    form.schema = data.schema || {type: 'object', properties: {}}
    // 转换schema为自定义字段格式
    form.customFields = []
    const parseSchema = (properties) => {
      return Object.entries(properties).map(([key, value]) => {
        const field = {
          name: key,
          type: 'string', // 默认字符串类型
          mock: value || ''
        }

        // 处理嵌套对象
        if (typeof value === 'object' && !Array.isArray(value)) {
          field.type = 'object'
          field.properties = parseSchema(value)
        }
        // 处理数组
        else if (Array.isArray(value)) {
          field.type = 'array'
          field.items = {
            type: 'string',
            mock: ''
          }
          // 处理数组中的对象
          if (value.length > 0 && typeof value[0] === 'object') {
            field.items.type = 'object'
            field.items.properties = parseSchema(value[0])
          }
          // 如果数组元素是字符串，则使用第一个元素作为mock示例
          else if (value.length > 0) {
            field.items.mock = value[0]
          }
        }

        return field
      })
    }

    form.customFields = parseSchema(form.schema)
  } catch (error) {
    ElMessage.error('获取Schema详情失败: ' + error.message)
    console.error('获取Schema详情失败:', error)
  } finally {
    loading.value = false
  }
}

// 保存Schema
const saveSchema = async () => {

  const buildSchemaProperties = (fields) => {
    const result = {}
    fields.forEach(field => {
      // 对于基本类型，直接使用mock表达式
      if (field.type === 'string' || field.type === 'number' || field.type === 'boolean') {
        result[field.name] = field.mock || ''
      }
      // 对于对象类型，递归处理
      else if (field.type === 'object' && field.properties) {
        result[field.name] = buildSchemaProperties(field.properties)
      }
      // 对于数组类型，处理为数组格式
      else if (field.type === 'array' && field.items) {
        if (field.items.type === 'object' && field.items.properties) {
          result[field.name] = [buildSchemaProperties(field.items.properties)]
        } else {
          result[field.name] = [field.items.mock || '']
        }
      }
    })
    return result
  }

  // 构建直接键值对结构的schema
  form.schema = buildSchemaProperties(form.customFields)

  // 表单验证
  try {
    await formRef.value.validate()
    loading.value = true
    if (isEdit) {
      updateSchema(schemaId, {
        ...form,
      }).then(() => {
        ElMessage.success('更新成功')
        router.push({name: 'schemaList'})
      }).catch(error => {
        handleError(error, '更新失败: ')
      }).finally(() => {
        loading.value = false
      })
    } else {
      createSchema({
        ...form,
        resourceName: resourceNameComputed.value
      }).then(() => {
        ElMessage.success('创建成功')
        router.push({name: 'schemaList'})
      }).catch(error => {
        handleError(error, '创建失败: ')
      }).finally(() => {
        loading.value = false
      })
    }
  } catch (error) {
     ElMessage.error('表单验证失败')
    loading.value = false
  }
}


// 处理Mock输入和提示
const handleMockInput = (field, value, event) => {
  field.mock = value
  currentField.value = field

  // 存储当前输入框元素引用
  if (event && event.target) {
    currentField.value = {
      ...field,
      $el: event.target
    }
  }

  // 检查是否需要显示建议
  if (value.includes('@')) {
    const lastAtPos = value.lastIndexOf('@')
    const prefix = value.substring(lastAtPos)

    // 过滤建议
    const filteredSuggestions = mockSuggestions.value.filter(item =>
        item.value.startsWith(prefix) || item.label.includes(prefix)
    )

    showSuggestions.value = filteredSuggestions.length > 0
    mockSuggestions.value = filteredSuggestions
  } else {
    showSuggestions.value = false
  }
}

// 计算提示框位置样式
const suggestionsStyle = computed(() => {
  if (!currentField.value || !currentField.value.$el) {
    return {
      top: '0px',
      left: '0px',
      width: '300px'
    }
  }

  const el = currentField.value.$el
  const rect = el.getBoundingClientRect()
  const containerRect = document.querySelector('.schema-form-container').getBoundingClientRect()

  // 计算基本位置
  let top = rect.bottom - containerRect.top
  const left = rect.left - containerRect.left
  const width = rect.width

  // 确保提示框不会超出容器底部
  const suggestionsHeight = 200; // 提示框的大致高度
  if (top + suggestionsHeight > containerRect.height) {
    top = rect.top - containerRect.top - suggestionsHeight;
  }

  return {
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`
  }
})

// 处理字段类型变化
const handleFieldTypeChange = (field, index) => {
  // 初始化子字段配置
  if (field.type === 'object' && !field.properties) {
    field.properties = []
  } else if (field.type === 'array' && !field.items) {
    field.items = {
      type: 'string',
      properties: []
    }
  } else if (field.type === 'array' && field.items && field.items.type === 'object' && !field.items.properties) {
    field.items.properties = []
  }
}

// 添加新字段
const addField = () => {
  form.customFields.push({
    name: '',
    type: 'string',
    mock: '',
    required: false
  })
}

// 添加子字段
const addSubField = (parentField) => {
  if (parentField.type === 'object') {
    if (!parentField.properties) {
      parentField.properties = []
    }
    parentField.properties.push({
      name: '',
      type: 'string',
      mock: '',
      required: false
    })
  } else if (parentField.type === 'array') {
    if (!parentField.items) {
      parentField.items = {
        type: 'string',
        properties: []
      }
    } else if (parentField.items.type === 'object' && !parentField.items.properties) {
      parentField.items.properties = []
    }
    if (parentField.items.type === 'object') {
      parentField.items.properties.push({
        name: '',
        type: 'string',
        mock: '',
        required: false
      })
    }
  }
}

// 删除子字段
const removeSubField = (parentField, index) => {
  if (parentField.type === 'object' && parentField.properties) {
    parentField.properties.splice(index, 1)
  } else if (parentField.type === 'array' && parentField.items && parentField.items.type === 'object' && parentField.items.properties) {
    parentField.items.properties.splice(index, 1)
  }
}

// 删除字段
const removeField = (index) => {
  form.customFields.splice(index, 1)
}
const querySearch = (queryString, cb) => {
  const results = queryString
      ? mockSuggestions.value.filter(createFilter(queryString))
      : mockSuggestions.value
  // call callback function to return suggestion objects
  cb(results)
}
const createFilter = (queryString) => {
  return (restaurant) => {
    return (
        restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
    )
  }
}

// 选择建议
const selectSuggestion = (suggestion) => {
  if (currentField.value) {
    const currentValue = currentField.value.mock
    const lastAtPos = currentValue.lastIndexOf('@')
    if (lastAtPos !== -1) {
      // 替换@开始的部分
      currentField.value.mock = currentValue.substring(0, lastAtPos) + suggestion.value + '('
      // 如果是带参数的函数，自动添加括号和光标位置标记
      if (suggestion.label.includes('(')) {
        currentField.value.mock += 'min,max)'
      } else {
        currentField.value.mock += ')'
      }
    } else {
      currentField.value.mock += suggestion.value + '('
      if (suggestion.label.includes('(')) {
        currentField.value.mock += 'min,max)'
      } else {
        currentField.value.mock += ')'
      }
    }
  }
  showSuggestions.value = false
}

// 处理键盘事件
const handleKeydown = (e) => {
  if (!showSuggestions.value) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeSuggestionIndex.value = (activeSuggestionIndex.value + 1) % mockSuggestions.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeSuggestionIndex.value = (activeSuggestionIndex.value - 1 + mockSuggestions.value.length) % mockSuggestions.value.length
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (activeSuggestionIndex.value !== -1) {
      selectSuggestion(mockSuggestions.value[activeSuggestionIndex.value])
    }
  } else if (e.key === 'Escape') {
    showSuggestions.value = false
  }
}

// 点击空白处关闭建议
const handleClickOutside = () => {
  showSuggestions.value = false
}

onMounted(() => {
  fetchSchemaDetail()
  // 监听全局点击事件
  document.addEventListener('click', handleClickOutside)
  // 监听键盘事件
  document.addEventListener('keydown', handleKeydown)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="schema-form-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑Schema' : '创建Schema' }}</span>
        </div>
      </template>

      <el-alert
          title="提示"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
      >
        输入@可显示mock语法提示，支持@string, @number, @boolean等
      </el-alert>

      <el-form
          v-loading="loading"
          :model="form"
          :rules="formRules"
          ref="formRef"
          label-width="120px"
      >
        <el-form-item label="Schema名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入Schema名称"/>
        </el-form-item>

        <el-form-item label="资源名称" prop="resourceName">
          <el-input v-model="resourceNameComputed" placeholder="请输入资源名称"/>
        </el-form-item>

        <el-form-item label="数据条数" prop="count">
          <el-input-number
              v-model="form.count"
              :min="1"
              :max="1000"
              placeholder="请输入数据条数"
          />
        </el-form-item>

        <el-form-item label="字段配置">
          <div v-for="(field, index) in form.customFields" :key="index" class="field-item">
            <div class="field-header">
              <span>字段 {{ index + 1 }}</span>
              <el-button
                  type="danger"
                  size="mini"
                  @click="removeField(index)"
                  v-if="form.customFields.length > 0"
              >
                删除
              </el-button>
            </div>
            <div class="field-content">
              <el-form-item :prop="'customFields.' + index + '.name'" :rules="fieldNameRules">
                <el-input
                    v-model="field.name"
                    placeholder="字段名称"
                    style="width: 150px; margin-right: 10px"
                />
              </el-form-item>
              <el-select
                  v-model="field.type"
                  placeholder="字段类型"
                  style="width: 120px; margin-right: 10px"
                  @change="handleFieldTypeChange(field, index)"
              >
                <el-option label="字符串" value="string"/>
                <el-option label="数字" value="number"/>
                <el-option label="布尔值" value="boolean"/>
                <el-option label="对象" value="object"/>
                <el-option label="数组" value="array"/>
              </el-select>
              <template v-if="field.type === 'string' || field.type === 'number' || field.type === 'boolean'">
                <el-autocomplete
                    v-model="field.mock"
                    placeholder="mock表达式 (@开头)"
                    style="flex: 1"
                    :fetch-suggestions="querySearch"
                    :id="`mock-input-${index}`"
                    :popper-append-to-body="false"
                >
                  <template #suffix>
                    <el-tooltip placement="top" content="支持@语法，如@string、@number等">
                      <el-icon class="el-input__icon">
                        <question/>
                      </el-icon>
                    </el-tooltip>
                  </template>
                  <template #default="{ item }">
                    <div class="suggestion-item">
                      <div class="suggestion-label">{{ item.label }}</div>
                      <div class="suggestion-desc">{{ item.desc }}</div>
                    </div>
                  </template>
                </el-autocomplete>
              </template>
              <template v-else-if="field.type === 'object'">
                <div style="flex: 1; display: flex; flex-direction: column;">
                  <div style="display: flex; align-items: center;">
                    <el-button type="primary" size="mini" @click="addSubField(field)">添加子字段</el-button>
                  </div>
                  <div v-if="field.properties && field.properties.length > 0" class="sub-fields-container">
                    <div v-for="(subField, subIndex) in field.properties" :key="subIndex" class="sub-field-item">
                      <el-form-item :prop="'customFields.' + index + '.properties.' + subIndex + '.name'"
                                    :rules="fieldNameRules">
                        <el-input
                            v-model="subField.name"
                            placeholder="子字段名称"
                            style="width: 120px; margin-right: 10px"
                        />
                      </el-form-item>
                      <el-select
                          v-model="subField.type"
                          placeholder="子字段类型"
                          style="width: 100px; margin-right: 10px"
                      >
                        <el-option label="字符串" value="string"/>
                        <el-option label="数字" value="number"/>
                        <el-option label="布尔值" value="boolean"/>
                      </el-select>
                      <el-autocomplete
                          v-model="subField.mock"
                          placeholder="mock表达式"
                          style="width: 150px; margin-right: 10px"
                          :fetch-suggestions="querySearch"
                          :id="`mock-input-obj-${index}`"
                          :popper-append-to-body="false"
                      >
                        <template #default="{ item }">
                          <div class="suggestion-item">
                            <div class="suggestion-label">{{ item.label }}</div>
                            <div class="suggestion-desc">{{ item.desc }}</div>
                          </div>
                        </template>
                      </el-autocomplete>
                      <el-checkbox v-model="subField.required" style="margin-right: 10px">必填</el-checkbox>
                      <el-button type="danger" size="mini" @click="removeSubField(field, subIndex)">删除</el-button>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else-if="field.type === 'array'">
                <div style="flex: 1; display: flex; flex-direction: column;">
                  <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="margin-right: 10px">元素类型:</span>
                    <el-select
                        v-model="field.items.type"
                        placeholder="元素类型"
                        style="width: 100px; margin-right: 10px"
                        @change="() => handleFieldTypeChange(field.items, -1)"
                    >
                      <el-option label="字符串" value="string"/>
                      <el-option label="数字" value="number"/>
                      <el-option label="布尔值" value="boolean"/>
                      <el-option label="对象" value="object"/>
                    </el-select>
                    <template v-if="field.items.type === 'object'">
                      <el-button type="primary" size="mini" @click="addSubField(field)">添加对象属性</el-button>
                    </template>
                  </div>
                  <div
                      v-if="field.items.type === 'object' && field.items.properties && field.items.properties.length > 0"
                      class="sub-fields-container">
                    <div v-for="(subField, subIndex) in field.items.properties" :key="subIndex" class="sub-field-item">
                      <el-form-item :prop="'customFields.' + index + '.items.properties.' + subIndex + '.name'"
                                    :rules="fieldNameRules">
                        <el-input
                            v-model="subField.name"
                            placeholder="属性名称"
                            style="width: 120px; margin-right: 10px"
                        />
                      </el-form-item>
                      <el-select
                          v-model="subField.type"
                          placeholder="属性类型"
                          style="width: 100px; margin-right: 10px"
                      >
                        <el-option label="字符串" value="string"/>
                        <el-option label="数字" value="number"/>
                        <el-option label="布尔值" value="boolean"/>
                      </el-select>
                      <el-autocomplete
                          v-model="subField.mock"
                          placeholder="mock表达式"
                          style="width: 150px; margin-right: 10px"
                          :fetch-suggestions="querySearch"
                          :id="`mock-input-arr-${index}`"
                          :popper-append-to-body="false"
                      >
                        <template #default="{ item }">
                          <div class="suggestion-item">
                            <div class="suggestion-label">{{ item.label }}</div>
                            <div class="suggestion-desc">{{ item.desc }}</div>
                          </div>
                        </template>
                      </el-autocomplete>
                      <el-checkbox v-model="subField.required" style="margin-right: 10px">必填</el-checkbox>
                      <el-button type="danger" size="mini" @click="removeSubField(field, subIndex)">删除</el-button>
                    </div>
                  </div>
                </div>
              </template>
              <el-checkbox v-model="field.required" style="margin-left: 10px">必填</el-checkbox>
            </div>
          </div>

          <el-button
              type="primary"
              size="small"
              @click="addField"
              style="margin-top: 10px"
          >
            添加字段
          </el-button>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveSchema" :loading="loading">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
          <el-button @click="router.push({ name: 'schemaList' })" style="margin-left: 10px">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.schema-form-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-item {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px dashed #e6e6e6;
  border-radius: 4px;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.field-content {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
}

.sub-fields-container {
  margin-top: 10px;
  padding-left: 20px;
  width: 100%;
}

.sub-field-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  width: 100%;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.suggestion-item {
  padding: 8px 12px;
}

.suggestion-label {
  font-weight: bold;
  color: #333;
}

.suggestion-desc {
  font-size: 12px;
  color: #666;
}

</style>
