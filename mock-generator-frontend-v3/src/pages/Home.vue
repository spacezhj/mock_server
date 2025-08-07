<script setup>
import { ref } from 'vue'
import { ElCard, ElButton, ElRow, ElCol, ElIcon } from 'element-plus'
import { useRouter } from 'vue-router'
import { Coin,Box,MessageBox} from '@element-plus/icons-vue'

const router = useRouter()
</script>

<template>
  <div class="home-container">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>欢迎使用Mock数据生成平台</span>
        </div>
      </template>
      <div class="welcome-content">
        <p>快速生成高质量的Mock数据，支持自定义Schema和动态字段配置</p>
      </div>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="8">
        <el-card class="function-card" @click="router.push({ name: 'schemaList' })">
          <div class="card-content">
            <el-icon class="icon"><Coin /></el-icon>
            <h3>Schema管理</h3>
            <p>管理您的数据模型</p>
            <ElButton type="primary" size="small" style="margin-top: 10px;">进入管理</ElButton>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="function-card" @click="router.push({ name: 'createSchema' })">
          <div class="card-content">
            <el-icon class="icon"><Box /></el-icon>
            <h3>新建Schema</h3>
            <p>设计您的自定义数据结构</p>
            <ElButton type="primary" size="small" style="margin-top: 10px;">开始创建</ElButton>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="function-card" @click="router.push({ name: 'dataTest' })">
          <div class="card-content">
            <el-icon class="icon"><MessageBox /></el-icon>
            <h3>数据测试</h3>
            <p>测试生成的Mock数据</p>
            <ElButton type="primary" size="small" style="margin-top: 10px;">开始测试</ElButton>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.home-container {
  padding: 20px;
}

.welcome-card {
  margin-bottom: 20px;
}

.welcome-content {
  padding: 20px 0;
  text-align: center;
}

.function-card {
  height: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.function-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
}

p{
  /*禁止换行*/
  white-space: nowrap;
}
.icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 20px;
}

h3 {
  margin-bottom: 10px;
}
</style>
