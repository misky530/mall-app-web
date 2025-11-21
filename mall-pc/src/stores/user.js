import { defineStore } from 'pinia'
import { adminLogin, memberInfo } from '@/api/user'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    tokenHead: localStorage.getItem('tokenHead') || 'Bearer ',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}')
  }),

  getters: {
    // 是否已登录
    isLogin: (state) => !!state.token,

    // 用户名
    username: (state) => state.userInfo.username || '',

    // 用户头像
    avatar: (state) => state.userInfo.icon || '',

    // 完整的 Authorization token
    authToken: (state) => state.token ? `${state.tokenHead}${state.token}` : ''
  },

  actions: {
    // 管理员登录
    async login(loginData) {
      try {
        const res = await adminLogin(loginData)
        if (res && res.code === 200 && res.data) {
          const { token, tokenHead } = res.data
          this.token = token
          this.tokenHead = tokenHead || 'Bearer '

          // 保存到 localStorage
          localStorage.setItem('token', token)
          localStorage.setItem('tokenHead', tokenHead || 'Bearer ')

          ElMessage.success('登录成功')

          // 获取用户信息
          await this.getUserInfo()

          return true
        } else {
          ElMessage.error(res.message || '登录失败')
          return false
        }
      } catch (error) {
        console.error('登录失败：', error)
        ElMessage.error('登录失败，请检查网络连接')
        return false
      }
    },

    // 获取用户信息
    async getUserInfo() {
      try {
        const res = await memberInfo()
        if (res && res.code === 200 && res.data) {
          this.userInfo = res.data
          localStorage.setItem('userInfo', JSON.stringify(res.data))
        }
      } catch (error) {
        console.error('获取用户信息失败：', error)
      }
    },

    // 手动设置 token（兼容旧方法）
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },

    // 设置用户信息
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    },

    // 退出登录
    logout() {
      this.token = ''
      this.tokenHead = 'Bearer '
      this.userInfo = {}
      localStorage.removeItem('token')
      localStorage.removeItem('tokenHead')
      localStorage.removeItem('userInfo')
      ElMessage.success('已退出登录')
    }
  }
})
