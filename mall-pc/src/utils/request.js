import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 不需要token的API白名单
    const noAuthUrls = ['/admin/login', '/sso/login', '/sso/register']

    // 标记是否发送了认证信息
    config._hasAuth = false

    // 如果不是白名单API，则添加token
    if (!noAuthUrls.includes(config.url)) {
      const token = localStorage.getItem('token')
      const tokenHead = localStorage.getItem('tokenHead') || 'Bearer '

      if (token) {
        config.headers.Authorization = `${tokenHead}${token}`
        config._hasAuth = true
      }
    }

    return config
  },
  (error) => {
    console.error('请求错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data

    // 如果返回的状态码为200，说明接口请求成功
    if (res.code === 200 || response.status === 200) {
      return res
    }

    // 其他错误提示
    ElMessage.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  (error) => {
    console.error('响应错误：', error)

    if (error.response) {
      const { status, data, config } = error.response

      switch (status) {
        case 401:
          // 只有在发送了认证信息的请求才处理401错误
          // 避免未认证的API请求触发登出
          if (config?._hasAuth) {
            ElMessage.error('登录已过期，请重新登录')
            localStorage.removeItem('token')
            localStorage.removeItem('tokenHead')
            localStorage.removeItem('userInfo')
            router.push({
              name: 'Login',
              query: { redirect: router.currentRoute.value.fullPath }
            })
          } else {
            // 未发送认证的请求返回401，静默失败（登录等接口）
            console.warn('未认证的API返回401，已忽略，将降级到Mock模式')
          }
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          if (data?.message) {
            ElMessage.error(data.message)
          }
      }
    } else if (error.request) {
      // 网络错误不显示消息，让上层处理（如Mock登录）
      console.warn('网络请求失败，将由上层降级处理')
    } else {
      ElMessage.error('请求失败')
    }

    return Promise.reject(error)
  }
)

export default request
