<script setup>
import { ref, onMounted, computed } from 'vue'
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

// 分类数据（将从 API 获取）
const categoryList = ref([])

// 分类图标映射
const categoryIcons = {
  '服装': '👔',
  '手机数码': '📱',
  '家用电器': '🏠',
  '家具家装': '🛋️',
  '汽车用品': '🚗',
  '电脑办公': '💻',
  '美妆': '💄',
  '食品': '🍎',
  '运动': '⚽',
  '图书': '📚',
  '母婴': '🍼'
}

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

  // 设置今天的结束时间
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

// Mock 商品数据生成
const generateMockProducts = (count, prefix) => {
  const products = []
  const baseTime = Date.now()

  for (let i = 1; i <= count; i++) {
    products.push({
      id: baseTime + i,
      name: `${prefix}商品 ${i}`,
      subTitle: '精选优质商品，品质保证',
      price: Math.floor(Math.random() * 500) + 50,
      originalPrice: Math.floor(Math.random() * 800) + 200,
      pic: `https://images.unsplash.com/photo-${1600000000000 + (baseTime % 1000) * 1000 + i * 10000}?w=300&h=300&fit=crop&auto=format`,
      sale: Math.floor(Math.random() * 5000),
      stock: Math.floor(Math.random() * 100) + 20,
      newStatus: prefix === '新品' ? 1 : 0,
      recommendStatus: prefix === '推荐' ? 1 : 0
    })
  }
  return products
}

// 获取首页数据
const fetchHomeData = async () => {
  loading.value = true
  try {
    // 使用 /home/content API 一次性获取所有首页数据
    const contentRes = await homeApi.fetchContent()
    if (contentRes && contentRes.data) {
      const data = contentRes.data

      // 轮播图
      if (data.advertiseList && data.advertiseList.length > 0) {
        bannerList.value = data.advertiseList
      }

      // 品牌列表
      if (data.brandList && data.brandList.length > 0) {
        brandList.value = data.brandList
      }

      // 秒杀专区
      if (data.homeFlashPromotion) {
        homeFlashPromotion.value = data.homeFlashPromotion
        // 开始倒计时
        updateFlashCountdown()
        setInterval(updateFlashCountdown, 1000)
      }

      // 新品列表
      if (data.newProductList && data.newProductList.length > 0) {
        newProductList.value = data.newProductList
      }

      // 热销商品
      if (data.hotProductList && data.hotProductList.length > 0) {
        hotProductList.value = data.hotProductList
      }
    }

    // 单独获取推荐商品（使用独立API支持分页）
    try {
      const recommendRes = await homeApi.fetchRecommendProductList({ pageNum: 1, pageSize: 8 })
      if (recommendRes && recommendRes.data) {
        recommendList.value = Array.isArray(recommendRes.data) ? recommendRes.data : []
      }
    } catch (error) {
      console.warn('推荐商品API失败', error)
    }

    // 获取分类
    try {
      const categoryRes = await homeApi.fetchProductCateList(0)
      if (categoryRes && categoryRes.data && categoryRes.data.length > 0) {
        // 添加图标到分类数据
        const categoriesWithIcon = categoryRes.data.map(cat => ({
          ...cat,
          icon: categoryIcons[cat.name] || '📦',
          count: cat.productCount || 0
        }))
        categoryList.value = categoriesWithIcon
        productStore.setCategoryList(categoryRes.data)
      }
    } catch (error) {
      console.warn('分类API失败', error)
    }
  } catch (error) {
    console.error('获取首页数据失败：', error)
  } finally {
    loading.value = false
  }
}

// 跳转到分类
const goToCategory = (category) => {
  router.push({
    path: '/product/list',
    query: { categoryId: category.id, categoryName: category.name }
  })
}

// 查看更多
const viewMore = (type) => {
  console.log('查看更多：', type)
}

// 跳转到品牌详情
const goToBrand = (brand) => {
  // 暂时跳转到商品列表，按品牌筛选
  // 后续可以添加品牌详情页
  console.log('跳转到品牌：', brand.name)
}

// 跳转到商品详情
const goToProduct = (product) => {
  router.push(`/product/detail/${product.id}`)
}

onMounted(() => {
  fetchHomeData()
})
</script>

<template>
  <div class="home-page" v-loading="loading">
    <!-- 轮播图 -->
    <section class="banner-section">
      <div class="container">
        <el-carousel height="400px" :interval="4000" arrow="always">
          <el-carousel-item v-for="item in bannerList" :key="item.id">
            <div class="banner-item" :style="{ backgroundImage: `url(${item.pic})` }">
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>
    </section>

    <!-- 品牌制造商直供 -->
    <section v-if="brandList.length > 0" class="brand-section-top">
      <div class="container">
        <div class="section-header">
          <div>
            <h2>品牌制造商直供</h2>
            <p>工厂直达消费者，剔除品牌溢价</p>
          </div>
        </div>
        <div class="brand-grid">
          <div
            v-for="brand in brandList"
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

    <!-- 商品分类 -->
    <section v-if="categoryList.length > 0" class="category-section">
      <div class="container">
        <div class="category-list">
          <div
            v-for="category in categoryList.slice(0, 8)"
            :key="category.id"
            class="category-item"
            @click="goToCategory(category)"
          >
            <div class="category-icon">{{ category.icon }}</div>
            <div class="category-name">{{ category.name }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 秒杀专区 -->
    <section v-if="homeFlashPromotion && homeFlashPromotion.productList && homeFlashPromotion.productList.length > 0" class="product-section flash-section">
      <div class="container">
        <div class="section-header">
          <div class="flash-header-left">
            <h2>⚡ 秒杀专区</h2>
            <p>限时抢购，手慢无</p>
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
            <p>为您精心挑选的优质商品</p>
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
            <p>最新鲜的商品，抢先体验</p>
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
            <p>人气爆款，销量领先</p>
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

    <!-- 品牌故事 -->
    <section class="brand-section">
      <div class="container">
        <div class="brand-content">
          <div class="brand-text">
            <h2>Mall商城</h2>
            <h3>品质生活，从这里开始</h3>
            <p>
              我们致力于为您提供优质的商品和服务，让购物变得更加简单、便捷、愉悦。
              精选全球好物，严格品控，只为给您最好的购物体验。
            </p>
            <div class="brand-features">
              <div class="feature-item">
                <div class="feature-number">100%</div>
                <div class="feature-text">正品保证</div>
              </div>
              <div class="feature-item">
                <div class="feature-number">24h</div>
                <div class="feature-text">快速发货</div>
              </div>
              <div class="feature-item">
                <div class="feature-number">7天</div>
                <div class="feature-text">无理由退换</div>
              </div>
            </div>
          </div>
          <div class="brand-image">
            <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop" alt="品牌形象" />
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

// 轮播图区域
.banner-section {
  background: white;
  padding: 20px 0;

  .banner-item {
    height: 100%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }
}

// 品牌区域（顶部）
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
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .flash-header-left {
      h2 {
        color: white !important;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      p {
        color: rgba(255, 255, 255, 0.95) !important;
      }
    }

    .flash-countdown {
      display: flex;
      align-items: center;
      gap: 8px;

      .countdown-label {
        color: rgba(255, 255, 255, 0.95);
        font-size: 14px;
      }

      .countdown-time {
        display: inline-block;
        min-width: 40px;
        height: 36px;
        line-height: 36px;
        text-align: center;
        background: rgba(0, 0, 0, 0.3);
        color: white;
        border-radius: 4px;
        font-size: 18px;
        font-weight: bold;
      }

      .countdown-separator {
        color: white;
        font-size: 18px;
        font-weight: bold;
      }
    }

    // 覆盖通用样式，确保秒杀区域的文字是白色
    h2, p {
      color: white;
    }
  }
}

// 分类区域
.category-section {
  padding: 30px 0;
  background: white;

  .category-list {
    display: flex;
    justify-content: space-around;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;

    .category-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-4px);

        .category-icon {
          transform: scale(1.1);
        }

        .category-name {
          color: $primary-color;
        }
      }

      .category-icon {
        font-size: 56px;
        margin-bottom: 12px;
        transition: transform 0.3s;
      }

      .category-name {
        font-size: 14px;
        color: $text-primary;
        transition: color 0.3s;
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
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
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

// 品牌区域
.brand-section {
  padding: 80px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  .brand-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;

    .brand-text {
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

      .brand-features {
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

    .brand-image {
      img {
        width: 100%;
        border-radius: $border-radius-large;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .category-grid {
    grid-template-columns: repeat(4, 1fr) !important;
  }

  .product-grid {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}

@media (max-width: 768px) {
  .category-grid {
    grid-template-columns: repeat(4, 1fr) !important;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  .brand-content {
    grid-template-columns: 1fr !important;
  }
}
</style>
