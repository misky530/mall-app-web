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
        console.error('登录API调用失败，使用Mock登录：', error)

        // Mock登录 fallback（用于演示环境）
        const mockUsers = [
          { username: 'admin', password: 'macro123' },
          { username: 'test', password: '123456' }
        ]

        const user = mockUsers.find(
          u => u.username === loginData.username && u.password === loginData.password
        )

        if (user) {
          // 生成Mock token
          const mockToken = 'mock_token_' + Date.now()
          this.token = mockToken
          this.tokenHead = 'Bearer '

          // 保存到 localStorage
          localStorage.setItem('token', mockToken)
          localStorage.setItem('tokenHead', 'Bearer ')

          // 设置Mock用户信息
          const mockUserInfo = {
            username: loginData.username,
            icon: '',
            nickName: loginData.username
          }
          this.userInfo = mockUserInfo
          localStorage.setItem('userInfo', JSON.stringify(mockUserInfo))

          ElMessage.success('登录成功（演示模式）')
          return true
        } else {
          ElMessage.error('用户名或密码错误')
          return false
        }
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
