import axios from 'axios'

export const BASE = "http://localhost:3000"
// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 5000
})

// 请求拦截器
api.interceptors.request.use(
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
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('响应错误:', error)
    // 可以在这里添加统一的错误处理
    return Promise.reject(error)
  }
)

export default api
