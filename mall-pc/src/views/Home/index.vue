<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'
import ProductCard from '@/components/Product/ProductCard.vue'
import { useProductStore } from '@/stores/product'
import * as homeApi from '@/api/home'

const router = useRouter()
const productStore = useProductStore()

// 轮播图数据
const bannerList = ref([])

// 品牌列表
const brandList = ref([])

// 秒杀专区
const homeFlashPromotion = ref(null)

// B2B分类数据（京东风格）- 精简版
const categoryList = ref([
  {
    id: 1,
    name: '电脑办公',
    icon: '💻',
    children: [
      {
        id: 11,
        name: '电脑整机',
        items: ['台式机', '笔记本', '平板电脑', '服务器']
      },
      {
        id: 12,
        name: '电脑配件',
        items: ['CPU', '主板', '显卡', '内存', '硬盘', '电源']
      },
      {
        id: 13,
        name: '外设产品',
        items: ['鼠标', '键盘', '显示器', '耳机']
      }
    ]
  },
  {
    id: 2,
    name: '手机数码',
    icon: '📱',
    children: [
      {
        id: 21,
        name: '手机通讯',
        items: ['智能手机', '游戏手机', '老人机', '对讲机']
      },
      {
        id: 22,
        name: '手机配件',
        items: ['手机壳', '贴膜', '充电器', '数据线', '移动电源']
      },
      {
        id: 23,
        name: '摄影摄像',
        items: ['数码相机', '单反相机', '摄像机', '运动相机']
      }
    ]
  },
  {
    id: 3,
    name: '家用电器',
    icon: '🏠',
    children: [
      {
        id: 31,
        name: '大家电',
        items: ['平板电视', '空调', '冰箱', '洗衣机']
      },
      {
        id: 32,
        name: '生活电器',
        items: ['吸尘器', '扫地机', '净化器', '加湿器']
      },
      {
        id: 33,
        name: '厨房电器',
        items: ['电饭煲', '电磁炉', '微波炉', '烤箱']
      }
    ]
  },
  {
    id: 4,
    name: '家居家装',
    icon: '🛋️',
    children: [
      {
        id: 41,
        name: '家具',
        items: ['沙发', '床', '床垫', '衣柜']
      },
      {
        id: 42,
        name: '家纺',
        items: ['四件套', '被子', '枕头', '窗帘']
      },
      {
        id: 43,
        name: '灯具厨具',
        items: ['台灯', '吸顶灯', '锅具', '餐具']
      }
    ]
  },
  {
    id: 5,
    name: '食品酒类',
    icon: '🍎',
    children: [
      {
        id: 51,
        name: '休闲食品',
        items: ['坚果炒货', '糖果巧克力', '饼干蛋糕']
      },
      {
        id: 52,
        name: '茶叶咖啡',
        items: ['绿茶', '红茶', '乌龙茶', '咖啡豆']
      },
      {
        id: 53,
        name: '酒类',
        items: ['白酒', '葡萄酒', '啤酒', '洋酒']
      }
    ]
  },
  {
    id: 6,
    name: '运动户外',
    icon: '⚽',
    children: [
      {
        id: 61,
        name: '运动鞋服',
        items: ['跑步鞋', '篮球鞋', '运动服']
      },
      {
        id: 62,
        name: '健身器材',
        items: ['跑步机', '健身车', '哑铃', '瑜伽垫']
      },
      {
        id: 63,
        name: '户外装备',
        items: ['帐篷睡袋', '登山装备', '骑行装备']
      }
    ]
  }
]);

// 当前悬浮的分类
const currentHoverCategory = ref(null)

// 推荐商品
const recommendList = ref([])
// 新品列表
const newProductList = ref([])
// 热销商品
const hotProductList = ref([])

// 加载状态
const loading = ref(false)

// 秒杀倒计时
const flashCountdown = ref({ hours: 0, minutes: 0, seconds: 0 })

// 计算秒杀倒计时
const updateFlashCountdown = () => {
  if (!homeFlashPromotion.value || !homeFlashPromotion.value.endTime) return

  const endTime = new Date(homeFlashPromotion.value.endTime)
  const now = new Date()

  const today = new Date()
  today.setHours(endTime.getHours())
  today.setMinutes(endTime.getMinutes())
  today.setSeconds(endTime.getSeconds())

  const diff = today.getTime() - now.getTime()

  if (diff > 0) {
    flashCountdown.value.hours = Math.floor(diff / (1000 * 60 * 60))
    flashCountdown.value.minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    flashCountdown.value.seconds = Math.floor((diff % (1000 * 60)) / 1000)
  } else {
    flashCountdown.value = { hours: 0, minutes: 0, seconds: 0 }
  }
}

// 格式化倒计时数字
const formatTime = (num) => {
  return num.toString().padStart(2, '0')
}

// 获取首页数据
const fetchHomeData = async () => {
  loading.value = true
  try {
    const contentRes = await homeApi.fetchContent()
    if (contentRes && contentRes.data) {
      const data = contentRes.data

      if (data.advertiseList && data.advertiseList.length > 0) {
        bannerList.value = data.advertiseList
      }

      if (data.brandList && data.brandList.length > 0) {
        brandList.value = data.brandList
      }

      if (data.homeFlashPromotion) {
        homeFlashPromotion.value = data.homeFlashPromotion
        updateFlashCountdown()
        setInterval(updateFlashCountdown, 1000)
      }

      if (data.newProductList && data.newProductList.length > 0) {
        newProductList.value = data.newProductList
      }

      if (data.hotProductList && data.hotProductList.length > 0) {
        hotProductList.value = data.hotProductList
      }
    }

    try {
      const recommendRes = await homeApi.fetchRecommendProductList({ pageNum: 1, pageSize: 8 })
      if (recommendRes && recommendRes.data) {
        recommendList.value = Array.isArray(recommendRes.data) ? recommendRes.data : []
      }
    } catch (error) {
      console.warn('推荐商品API失败', error)
    }
  } catch (error) {
    console.error('获取首页数据失败：', error)
  } finally {
    loading.value = false
  }
}

// 跳转到分类
const goToCategory = (category, subItem = null) => {
  console.log('跳转到分类：', category.name, subItem)
  router.push({
    path: '/product/list',
    query: {
      categoryId: category.id,
      categoryName: subItem || category.name
    }
  })
}

// 鼠标进入分类
const handleCategoryEnter = (category) => {
  currentHoverCategory.value = category
}

// 鼠标离开分类区域
const handleCategoryLeave = () => {
  currentHoverCategory.value = null
}

// 跳转到品牌详情
const goToBrand = (brand) => {
  console.log('跳转到品牌：', brand.name)
}

// 查看更多
const viewMore = (type) => {
  router.push({
    path: '/product/list',
    query: { type }
  })
}

onMounted(() => {
  fetchHomeData()
})
</script>

<template>
  <div class="home-page" v-loading="loading">
    <!-- 顶部Banner区域 -->
    <section class="banner-section">
      <div class="container">
        <div class="banner-wrapper">
          <!-- 左侧分类导航 (京东风格) -->
          <div class="category-nav" @mouseleave="handleCategoryLeave">
            <div
              v-for="category in categoryList"
              :key="category.id"
              class="category-item"
              @mouseenter="handleCategoryEnter(category)"
              @click="goToCategory(category)"
            >
              <span class="category-icon">{{ category.icon }}</span>
              <span class="category-name">{{ category.name }}</span>
              <el-icon class="category-arrow"><ArrowRight /></el-icon>

              <!-- 子分类悬浮层 -->
              <transition name="slide-fade">
                <div
                  v-if="currentHoverCategory && currentHoverCategory.id === category.id"
                  class="category-submenu"
                  @click.stop
                >
                  <div
                    v-for="child in category.children"
                    :key="child.id"
                    class="submenu-group"
                  >
                    <div class="submenu-title">{{ child.name }}</div>
                    <div class="submenu-items">
                      <span
                        v-for="(item, index) in child.items"
                        :key="index"
                        class="submenu-item"
                        @click="goToCategory(category, item)"
                      >
                        {{ item }}
                      </span>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </div>

          <!-- 右侧轮播图 -->
          <div class="banner-carousel">
            <el-carousel height="320px" :interval="4000" arrow="hover">
              <el-carousel-item v-for="item in bannerList" :key="item.id">
                <div class="banner-item" :style="{ backgroundImage: `url(${item.pic})` }">
                </div>
              </el-carousel-item>
            </el-carousel>
          </div>
        </div>
      </div>
    </section>

    <!-- 品牌制造商直供 -->
    <section v-if="brandList.length > 0" class="brand-section-top">
      <div class="container">
        <div class="section-header">
          <div>
            <h2>品牌制造商直供</h2>
            <p>工厂直达企业，批量采购更优惠</p>
          </div>
        </div>
        <div class="brand-grid">
          <div
            v-for="brand in brandList.slice(0, 6)"
            :key="brand.id"
            class="brand-item"
            @click="goToBrand(brand)"
          >
            <div class="brand-logo">
              <img :src="brand.logo" :alt="brand.name" />
            </div>
            <div class="brand-name">{{ brand.name }}</div>
            <div class="brand-count">{{ brand.productCount }}+件商品</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 秒杀专区 -->
    <section v-if="homeFlashPromotion && homeFlashPromotion.productList && homeFlashPromotion.productList.length > 0" class="product-section flash-section">
      <div class="container">
        <div class="section-header">
          <div class="flash-header-left">
            <h2>⚡ 限时秒杀</h2>
            <p>批量采购，价格更优</p>
          </div>
          <div class="flash-countdown">
            <span class="countdown-label">本场结束剩余：</span>
            <span class="countdown-time">{{ formatTime(flashCountdown.hours) }}</span>
            <span class="countdown-separator">:</span>
            <span class="countdown-time">{{ formatTime(flashCountdown.minutes) }}</span>
            <span class="countdown-separator">:</span>
            <span class="countdown-time">{{ formatTime(flashCountdown.seconds) }}</span>
          </div>
        </div>
        <div class="product-grid">
          <ProductCard
            v-for="product in homeFlashPromotion.productList.slice(0, 8)"
            :key="product.id"
            :product="product"
          />
        </div>
      </div>
    </section>

    <!-- 推荐商品 -->
    <section class="product-section recommend-section">
      <div class="container">
        <div class="section-header">
          <div>
            <h2>精选推荐</h2>
            <p>企业采购精选，品质保证</p>
          </div>
          <el-button text @click="viewMore('recommend')">
            查看更多
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="product-grid">
          <ProductCard
            v-for="product in recommendList"
            :key="product.id"
            :product="product"
          />
        </div>
        <el-empty v-if="!loading && recommendList.length === 0" description="暂无推荐商品" />
      </div>
    </section>

    <!-- 新品上市 -->
    <section class="product-section new-section">
      <div class="container">
        <div class="section-header">
          <div>
            <h2>新品上市</h2>
            <p>最新商品，抢先采购</p>
          </div>
          <el-button text @click="viewMore('new')">
            查看更多
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="product-grid">
          <ProductCard
            v-for="product in newProductList"
            :key="product.id"
            :product="product"
          />
        </div>
        <el-empty v-if="!loading && newProductList.length === 0" description="暂无新品" />
      </div>
    </section>

    <!-- 热销商品 -->
    <section class="product-section hot-section">
      <div class="container">
        <div class="section-header">
          <div>
            <h2>热销榜单</h2>
            <p>企业热购，销量领先</p>
          </div>
          <el-button text @click="viewMore('hot')">
            查看更多
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="product-grid">
          <ProductCard
            v-for="product in hotProductList"
            :key="product.id"
            :product="product"
          />
        </div>
        <el-empty v-if="!loading && hotProductList.length === 0" description="暂无热销商品" />
      </div>
    </section>

    <!-- B2B服务保障 -->
    <section class="service-section">
      <div class="container">
        <div class="service-content">
          <div class="service-text">
            <h2>B2B企业采购平台</h2>
            <h3>专业 · 高效 · 可信赖</h3>
            <p>
              专注企业采购服务，提供一站式采购解决方案。从询价、下单、支付到物流配送，
              全程托管交易保障，让企业采购更安全、更便捷、更高效。
            </p>
            <div class="service-features">
              <div class="feature-item">
                <div class="feature-number">100%</div>
                <div class="feature-text">正品保证</div>
              </div>
              <div class="feature-item">
                <div class="feature-number">托管</div>
                <div class="feature-text">交易保障</div>
              </div>
              <div class="feature-item">
                <div class="feature-number">7×24h</div>
                <div class="feature-text">专属服务</div>
              </div>
            </div>
          </div>
          <div class="service-image">
            <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop" alt="B2B服务" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.home-page {
  background: #f5f5f5;
}

// Banner区域
.banner-section {
  background: white;
  padding: 0;

  .banner-wrapper {
    display: flex;
    gap: 0;
    position: relative;
    padding: 20px 0;
  }
}

// 左侧分类导航（京东风格）
.category-nav {
  width: 200px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px 0 0 8px;
  overflow: hidden;
  flex-shrink: 0;

  .category-item {
    position: relative;
    display: flex;
    align-items: center;
    padding: 12px 16px;
    color: white;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: rgba(255, 255, 255, 0.1);

      .category-arrow {
        transform: translateX(4px);
      }
    }

    .category-icon {
      font-size: 20px;
      margin-right: 10px;
    }

    .category-name {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }

    .category-arrow {
      font-size: 14px;
      transition: transform 0.3s;
    }
  }
}

// 子分类悬浮层
.category-submenu {
  position: absolute;
  left: 100%;
  top: 0;
  width: 730px;
  min-height: 470px;
  background: white;
  border: 1px solid #e0e0e0;
  border-left: none;
  border-radius: 0 8px 8px 0;
  padding: 20px 24px;
  z-index: 1000;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);

  .submenu-group {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .submenu-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f0;
    }

    .submenu-items {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;

      .submenu-item {
        font-size: 13px;
        color: #666;
        cursor: pointer;
        transition: color 0.3s;
        white-space: nowrap;

        &:hover {
          color: $primary-color;
        }
      }
    }
  }
}

// 动画效果
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

// 轮播图
.banner-carousel {
  flex: 1;

  .banner-item {
    height: 100%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border-radius: 0 8px 8px 0;
  }
}

// 品牌区域
.brand-section-top {
  padding: 60px 0;
  background: white;
  margin-top: 20px;

  .brand-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 20px;
    margin-top: 40px;

    .brand-item {
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: $border-radius-base;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: white;
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      }

      .brand-logo {
        width: 100%;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;

        img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
      }

      .brand-name {
        font-size: 16px;
        font-weight: 500;
        color: $text-primary;
        margin-bottom: 8px;
      }

      .brand-count {
        font-size: 12px;
        color: $text-secondary;
      }
    }
  }
}

// 秒杀区域
.flash-section {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe8e0 100%);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .flash-header-left {
      h2 {
        font-size: 32px;
        font-weight: bold;
        color: #ff4757 !important;
        margin-bottom: 8px;
      }

      p {
        font-size: 14px;
        color: #ff6b6b !important;
      }
    }

    .flash-countdown {
      display: flex;
      align-items: center;
      gap: 8px;

      .countdown-label {
        color: $text-primary;
        font-size: 14px;
      }

      .countdown-time {
        display: inline-block;
        min-width: 40px;
        height: 36px;
        line-height: 36px;
        text-align: center;
        background: #ff4757;
        color: white;
        border-radius: 4px;
        font-size: 18px;
        font-weight: bold;
      }

      .countdown-separator {
        color: $text-primary;
        font-size: 18px;
        font-weight: bold;
      }
    }
  }
}

// 商品区域通用样式
.product-section {
  padding: 60px 0;

  &:nth-child(even) {
    background: white;
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 16px;
    margin-top: 40px;
  }
}

// 区域头部
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-size: 32px;
    font-weight: bold;
    color: $text-primary;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: $text-secondary;
  }
}

// 服务保障区域
.service-section {
  padding: 80px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  .service-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;

    .service-text {
      h2 {
        font-size: 48px;
        font-weight: bold;
        margin-bottom: 12px;
      }

      h3 {
        font-size: 24px;
        margin-bottom: 24px;
        opacity: 0.9;
      }

      p {
        font-size: 16px;
        line-height: 1.8;
        opacity: 0.8;
        margin-bottom: 40px;
      }

      .service-features {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 30px;

        .feature-item {
          text-align: center;

          .feature-number {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 8px;
          }

          .feature-text {
            font-size: 14px;
            opacity: 0.8;
          }
        }
      }
    }

    .service-image {
      img {
        width: 100%;
        border-radius: $border-radius-large;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      }
    }
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .product-grid {
    grid-template-columns: repeat(5, 1fr) !important;
  }
}

@media (max-width: 1200px) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr) !important;
  }

  .brand-grid {
    grid-template-columns: repeat(4, 1fr) !important;
  }
}

@media (max-width: 992px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}

@media (max-width: 768px) {
  .banner-wrapper {
    flex-direction: column;
  }

  .category-nav {
    width: 100% !important;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  .service-content {
    grid-template-columns: 1fr !important;
  }
}
</style>
