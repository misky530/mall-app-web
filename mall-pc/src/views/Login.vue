<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 登录表单
const loginForm = reactive({
  username: 'admin',
  password: 'macro123'
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 登录加载状态
const loading = ref(false)

// 表单引用
const loginFormRef = ref(null)

// 处理登录
const handleLogin = async () => {
  // 验证表单
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()
  } catch (error) {
    return
  }

  loading.value = true

  try {
    const success = await userStore.login({
      username: loginForm.username,
      password: loginForm.password
    })

    if (success) {
      // 登录成功，跳转到重定向页面或首页
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    }
  } catch (error) {
    console.error('登录错误：', error)
  } finally {
    loading.value = false
  }
}

// 去注册
const goToRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <!-- Logo 和标题 -->
        <div class="login-header">
          <h1 class="login-title">B2B托管交易系统</h1>
          <p class="login-subtitle">安全 · 高效 · 可信</p>
        </div>

        <!-- 登录表单 -->
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          size="large"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="login-button"
              :loading="loading"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 提示信息 -->
        <div class="login-tips">
          <p class="tips-title">💡 演示账号</p>
          <p>用户名：admin</p>
          <p>密码：macro123</p>
          <p class="tips-note">系统使用线上API + 本地存储混合模式</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;

  .login-container {
    width: 100%;
    max-width: 400px;

    .login-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);

      .login-header {
        text-align: center;
        margin-bottom: 32px;

        .login-title {
          font-size: 28px;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: 8px;
        }

        .login-subtitle {
          font-size: 14px;
          color: $text-secondary;
        }
      }

      .login-form {
        .el-form-item {
          margin-bottom: 24px;

          &:last-child {
            margin-bottom: 0;
          }
        }

        .login-button {
          width: 100%;
          height: 44px;
          font-size: 16px;
          font-weight: 500;
        }
      }

      .login-tips {
        margin-top: 24px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        text-align: center;

        .tips-title {
          font-size: 14px;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: 8px;
        }

        p {
          font-size: 13px;
          color: $text-secondary;
          margin: 4px 0;
        }

        .tips-note {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #9ca3af;
        }
      }

      .login-footer {
        margin-top: 24px;
        text-align: center;

        .register-link {
          font-size: 14px;
          color: $text-secondary;
          cursor: pointer;
          transition: color 0.3s;

          &:hover {
            color: $primary-color;
          }

          .link-text {
            color: $primary-color;
            font-weight: 500;
          }
        }
      }
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .login-page {
    padding: 16px;

    .login-card {
      padding: 24px !important;

      .login-header {
        margin-bottom: 24px !important;

        .login-title {
          font-size: 24px !important;
        }
      }
    }
  }
}
</style>
