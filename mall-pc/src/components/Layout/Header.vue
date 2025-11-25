<script setup>
import { onMounted, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { Search, ShoppingCart, User, Clock, Delete } from '@element-plus/icons-vue'
import { useSearchHistory } from '@/composables/useSearchHistory'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

// 搜索历史功能
const { history, hotSearches, addHistory, removeHistory, clearHistory } = useSearchHistory()

// 搜索关键词
const searchKeyword = ref('')
const showSearchPanel = ref(false)

// 搜索商品
const handleSearch = () => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    return
  }
  
  // 添加到搜索历史
  addHistory(keyword)
  
  // 隐藏搜索面板
  showSearchPanel.value = false
  
  // 跳转到商品列表页
  router.push({
    name: 'ProductList',
    query: { keyword }
  })
}

// 点击历史/热门搜索
const handleSearchTag = (keyword) => {
  searchKeyword.value = keyword
  handleSearch()
}

// 删除单条历史
const handleRemoveHistory = (keyword, event) => {
  event.stopPropagation()
  removeHistory(keyword)
}

// 清除所有历史
const handleClearHistory = () => {
  clearHistory()
}

// 输入框获得焦点
const handleSearchFocus = () => {
  showSearchPanel.value = true
}

// 输入框失去焦点
const handleSearchBlur = () => {
  // 延迟隐藏，以便点击事件能够触发
  setTimeout(() => {
    showSearchPanel.value = false
  }, 200)
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
  // 跳转到登录页
  router.push('/login')
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
          <span>欢迎来到Mall B2B托管交易系统！</span>
        </div>
        <div class="top-right">
          <template v-if="userStore.isLogin">
            <span class="username">{{ userStore.username || '用户' }}</span>
            <el-divider direction="vertical" />
            <a @click="handleLogout">退出登录</a>
            <el-divider direction="vertical" />
          </template>
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
            placeholder="支持多关键字搜索，如：华为 手机 5G"
            size="large"
            @keyup.enter="handleSearch"
            @focus="handleSearchFocus"
            @blur="handleSearchBlur"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch">搜索</el-button>
            </template>
          </el-input>

          <!-- 搜索建议面板 -->
          <transition name="slide-down">
            <div v-if="showSearchPanel" class="search-panel">
              <!-- 搜索历史 -->
              <div v-if="history.length > 0" class="search-section">
                <div class="section-header">
                  <span class="section-title">
                    <el-icon><Clock /></el-icon>
                    最近搜索
                  </span>
                  <el-button text size="small" @click="handleClearHistory">
                    清除历史
                  </el-button>
                </div>
                <div class="search-tags">
                  <span
                    v-for="item in history"
                    :key="item"
                    class="search-tag"
                    @click="handleSearchTag(item)"
                  >
                    {{ item }}
                    <el-icon class="delete-icon" @click="handleRemoveHistory(item, $event)">
                      <Delete />
                    </el-icon>
                  </span>
                </div>
              </div>

              <!-- 热门搜索 -->
              <div v-if="hotSearches.length > 0" class="search-section">
                <div class="section-header">
                  <span class="section-title">
                    🔥 热门搜索
                  </span>
                </div>
                <div class="search-tags hot-tags">
                  <span
                    v-for="(item, index) in hotSearches"
                    :key="item"
                    class="search-tag hot-tag"
                    :class="{ 'top-3': index < 3 }"
                    @click="handleSearchTag(item)"
                  >
                    <span class="tag-index">{{ index + 1 }}</span>
                    {{ item }}
                  </span>
                </div>
              </div>

              <!-- 搜索提示 -->
              <div class="search-tips">
                <div class="tip-item">💡 支持多关键字搜索，空格分隔</div>
                <div class="tip-item">💡 示例: 华为 手机 5G</div>
              </div>
            </div>
          </transition>
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
            <span>我的</span>
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
      position: relative;

      :deep(.el-input__wrapper) {
        border-radius: 4px;
      }

      // 搜索建议面板
      .search-panel {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 16px;
        z-index: 1000;
        max-height: 400px;
        overflow-y: auto;

        .search-section {
          margin-bottom: 16px;

          &:last-child {
            margin-bottom: 0;
          }

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .section-title {
              font-size: 14px;
              font-weight: 600;
              color: $text-primary;
              display: flex;
              align-items: center;
              gap: 6px;
            }
          }

          .search-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;

            .search-tag {
              padding: 6px 12px;
              background: #f5f5f5;
              border-radius: 4px;
              font-size: 13px;
              color: #666;
              cursor: pointer;
              transition: all 0.3s;
              display: flex;
              align-items: center;
              gap: 6px;

              &:hover {
                background: #e8f4ff;
                color: $primary-color;
              }

              .delete-icon {
                font-size: 12px;
                opacity: 0;
                transition: opacity 0.3s;

                &:hover {
                  color: #ff4d4f;
                }
              }

              &:hover .delete-icon {
                opacity: 1;
              }
            }

            &.hot-tags {
              .hot-tag {
                position: relative;
                padding-left: 28px;

                .tag-index {
                  position: absolute;
                  left: 8px;
                  top: 50%;
                  transform: translateY(-50%);
                  width: 18px;
                  height: 18px;
                  line-height: 18px;
                  text-align: center;
                  background: #999;
                  color: white;
                  border-radius: 50%;
                  font-size: 11px;
                  font-weight: 600;
                }

                &.top-3 .tag-index {
                  background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
                }

                &:hover {
                  background: #fff5f5;
                  color: #ff4d4f;
                }
              }
            }
          }
        }

        .search-tips {
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
          
          .tip-item {
            font-size: 12px;
            color: #999;
            line-height: 1.8;
          }
        }
      }
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

// 动画
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
