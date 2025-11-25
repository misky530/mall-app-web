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

  // 白名单：不需要登录的页面
  const whiteList = ['/login', '/register']

  // B2B模式：强制登录
  if (!whiteList.includes(to.path)) {
    const token = localStorage.getItem('token')
    if (!token) {
      console.log('未登录，跳转到登录页。当前路径：', to.path)
      // 未登录，跳转到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }

  next()
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 可以在这里添加页面访问统计等逻辑
})

export default router
