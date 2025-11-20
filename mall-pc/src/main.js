import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 引入全局样式
import '@/assets/styles/reset.scss'
import '@/assets/styles/common.scss'
import 'element-plus/dist/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(router)
app.use(pinia)

app.mount('#app')
