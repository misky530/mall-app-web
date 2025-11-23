<script setup>
import { onMounted, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { Search, ShoppingCart, User } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

// 搜索关键词
const searchKeyword = ref('')

// 搜索商品
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    return
  }
  router.push({
    name: 'ProductSearch',
    query: { keyword: searchKeyword.value }
  })
}

// 跳转购物车
const goToCart = () => {
  router.push('/cart')
}

// 跳转用户中心
const goToProfile = () => {
  if (userStore.isLogin) {
    router.push('/user/profile')
  } else {
    router.push('/login')
  }
}

// 退出登录
const handleLogout = () => {
  userStore.logout()
  // 退出后清空购物车
  cartStore.cartList = []
  cartStore.selectedIds = []
  router.push('/')
}

// 如果已登录，获取购物车数据
const loadCartData = () => {
  if (userStore.isLogin) {
    cartStore.fetchCart()
  }
}

onMounted(() => {
  loadCartData()
})

// 监听登录状态变化
watch(
  () => userStore.isLogin,
  (isLogin) => {
    if (isLogin) {
      loadCartData()
    }
  }
)
</script>

<template>
  <header class="app-header">
    <!-- 顶部栏 -->
    <div class="header-top">
      <div class="container flex-between">
        <div class="top-left">
          <span>欢迎来到Mall商城！</span>
        </div>
        <div class="top-right">
          <template v-if="userStore.isLogin">
            <span class="username">{{ userStore.username }}</span>
            <el-divider direction="vertical" />
            <a @click="handleLogout">退出</a>
          </template>
          <template v-else>
            <router-link to="/login">登录</router-link>
            <el-divider direction="vertical" />
            <router-link to="/register">注册</router-link>
          </template>
          <el-divider direction="vertical" />
          <router-link to="/order/list">我的订单</router-link>
          <el-divider direction="vertical" />
          <router-link to="/seller">卖家中心</router-link>
          <el-divider direction="vertical" />
          <router-link to="/agent">经办人中心</router-link>
          <el-divider direction="vertical" />
          <router-link to="/report" class="report-link">📊 数据看板</router-link>
        </div>
      </div>
    </div>

    <!-- 主导航 -->
    <div class="header-main">
      <div class="container flex-between">
        <!-- Logo -->
        <div class="logo" @click="router.push('/')">
          <h1>MALL</h1>
        </div>

        <!-- 搜索框 -->
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索商品"
            size="large"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </div>

        <!-- 右侧功能 -->
        <div class="header-actions">
          <div class="cart-btn" @click="goToCart">
            <el-badge :value="cartStore.cartCount" :max="99">
              <el-icon :size="24">
                <ShoppingCart />
              </el-icon>
            </el-badge>
            <span>购物车</span>
          </div>
          <div class="user-btn" @click="goToProfile">
            <el-icon :size="24">
              <User />
            </el-icon>
            <span>{{ userStore.isLogin ? '我的' : '登录' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分类导航 -->
    <div class="header-nav">
      <div class="container">
        <nav class="nav-list">
          <router-link to="/" class="nav-item">首页</router-link>
          <router-link to="/product/list" class="nav-item">商品分类</router-link>
          <router-link to="/product/list?type=new" class="nav-item">新品上市</router-link>
          <router-link to="/product/list?type=hot" class="nav-item">热销商品</router-link>
        </nav>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.app-header {
  background: $bg-white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 999;

  .header-top {
    background: #f5f5f5;
    height: 36px;
    line-height: 36px;
    font-size: 12px;

    .top-left {
      color: $text-secondary;
    }

    .top-right {
      display: flex;
      align-items: center;
      gap: 8px;

      a {
        cursor: pointer;
        transition: color 0.3s;

        &:hover {
          color: $primary-color;
        }
      }

      .username {
        color: $primary-color;
        font-weight: 500;
      }
    }
  }

  .header-main {
    padding: 20px 0;

    .logo {
      cursor: pointer;

      h1 {
        font-size: 32px;
        font-weight: bold;
        color: $primary-color;
        margin: 0;
      }
    }

    .search-box {
      flex: 1;
      max-width: 600px;
      margin: 0 40px;
    }

    .header-actions {
      display: flex;
      gap: 30px;

      .cart-btn,
      .user-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transition: color 0.3s;

        &:hover {
          color: $primary-color;
        }

        span {
          font-size: 12px;
          margin-top: 4px;
        }
      }
    }
  }

  .header-nav {
    background: $primary-color;
    height: 48px;

    .nav-list {
      display: flex;
      align-items: center;
      height: 100%;

      .nav-item {
        padding: 0 24px;
        height: 100%;
        display: flex;
        align-items: center;
        color: white;
        font-size: 15px;
        transition: all 0.3s;

        &:hover,
        &.router-link-active {
          background: rgba(255, 255, 255, 0.2);
        }
      }
    }
  }
}
</style>
