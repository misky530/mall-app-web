import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 路由切换时滚动到顶部
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  const title = to.meta.title
  if (title) {
    document.title = `${title} - ${import.meta.env.VITE_APP_TITLE || 'Mall商城'}`
  }

  // 演示模式：自动创建演示用户token（屏蔽登录功能）
  const token = localStorage.getItem('token')
  if (!token) {
    // 自动创建演示用户
    const demoToken = 'demo_token_' + Date.now()
    localStorage.setItem('token', demoToken)
    localStorage.setItem('tokenHead', 'Bearer ')

    const demoUserInfo = {
      username: 'demo',
      icon: '',
      nickName: '演示用户'
    }
    localStorage.setItem('userInfo', JSON.stringify(demoUserInfo))
    console.log('演示模式：已自动创建演示用户')
  }

  next()
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 可以在这里添加页面访问统计等逻辑
})

export default router
