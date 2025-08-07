import axios from 'axios'

// 从环境变量获取API基础路径
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 创建API实例
const apiClient = axios.create({
  baseURL: API_BASE_URL+"/api",
  timeout: 10000
})

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 可以在这里添加请求头，如token等
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('响应错误:', error)
    // 可以在这里添加统一的错误处理
    return Promise.reject(error)
  }
)

export default apiClient
