<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import ProductCard from '@/components/Product/ProductCard.vue'
import { useCartStore } from '@/stores/cart'
import { useProductStore } from '@/stores/product'
import * as homeApi from '@/api/home'

const cartStore = useCartStore()
const productStore = useProductStore()

// 轮播图数据
const bannerList = ref([
  {
    id: 1,
    pic: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop',
    title: '春季新品上市',
    subtitle: '限时优惠，低至5折'
  },
  {
    id: 2,
    pic: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
    title: '品质生活',
    subtitle: '精选好物，品质保证'
  },
  {
    id: 3,
    pic: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=400&fit=crop',
    title: '潮流时尚',
    subtitle: '紧跟潮流，彰显个性'
  }
])

// 分类数据
const categoryList = ref([
  { id: 1, name: '服饰', icon: '👔', count: 1280 },
  { id: 2, name: '数码', icon: '📱', count: 856 },
  { id: 3, name: '家居', icon: '🏠', count: 642 },
  { id: 4, name: '美妆', icon: '💄', count: 923 },
  { id: 5, name: '食品', icon: '🍎', count: 538 },
  { id: 6, name: '运动', icon: '⚽', count: 445 },
  { id: 7, name: '图书', icon: '📚', count: 782 },
  { id: 8, name: '母婴', icon: '🍼', count: 367 }
])

// 推荐商品
const recommendList = ref([])
// 新品列表
const newProductList = ref([])
// 热销商品
const hotProductList = ref([])

// 加载状态
const loading = ref(false)

// Mock 商品数据生成
const generateMockProducts = (count, prefix) => {
  const products = []
  for (let i = 1; i <= count; i++) {
    products.push({
      id: Date.now() + i,
      name: `${prefix}商品 ${i}`,
      subTitle: '精选优质商品，品质保证',
      price: Math.floor(Math.random() * 500) + 50,
      originalPrice: Math.floor(Math.random() * 800) + 200,
      pic: `https://via.placeholder.com/300x300?text=${prefix}+${i}`,
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
    // 获取推荐商品
    try {
      const recommendRes = await homeApi.fetchRecommendProductList({ pageNum: 1, pageSize: 8 })
      if (recommendRes && recommendRes.data) {
        recommendList.value = recommendRes.data.list || []
      }
    } catch (error) {
      console.warn('推荐商品API失败，使用Mock数据')
      recommendList.value = generateMockProducts(8, '推荐')
    }

    // 获取新品
    try {
      const newRes = await homeApi.fetchNewProductList({ pageNum: 1, pageSize: 8 })
      if (newRes && newRes.data) {
        newProductList.value = newRes.data.list || []
      }
    } catch (error) {
      console.warn('新品API失败，使用Mock数据')
      newProductList.value = generateMockProducts(8, '新品')
    }

    // 获取热销商品
    try {
      const hotRes = await homeApi.fetchHotProductList({ pageNum: 1, pageSize: 8 })
      if (hotRes && hotRes.data) {
        hotProductList.value = hotRes.data.list || []
      }
    } catch (error) {
      console.warn('热销商品API失败，使用Mock数据')
      hotProductList.value = generateMockProducts(8, '热销')
    }

    // 获取分类
    try {
      const categoryRes = await homeApi.fetchProductCateList(0)
      if (categoryRes && categoryRes.data && categoryRes.data.length > 0) {
        productStore.setCategoryList(categoryRes.data)
      }
    } catch (error) {
      console.warn('分类API失败')
    }
  } catch (error) {
    console.error('获取首页数据失败：', error)
  } finally {
    loading.value = false
  }
}

// 加入购物车
const handleAddToCart = (product) => {
  cartStore.addToCart({
    id: Date.now(),
    productId: product.id,
    name: product.name,
    pic: product.pic,
    price: product.price,
    quantity: 1
  })
  ElMessage.success('已加入购物车')
}

// 跳转到分类
const goToCategory = (category) => {
  console.log('跳转到分类：', category)
}

// 查看更多
const viewMore = (type) => {
  console.log('查看更多：', type)
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
              <div class="banner-content">
                <h2>{{ item.title }}</h2>
                <p>{{ item.subtitle }}</p>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>
    </section>

    <!-- 分类导航 -->
    <section class="category-section">
      <div class="container">
        <div class="section-header">
          <h2>商品分类</h2>
          <p>精选优质商品，满足您的多样需求</p>
        </div>
        <div class="category-grid">
          <div
            v-for="category in categoryList"
            :key="category.id"
            class="category-item"
            @click="goToCategory(category)"
          >
            <div class="category-icon">{{ category.icon }}</div>
            <div class="category-name">{{ category.name }}</div>
            <div class="category-count">{{ category.count }}+件商品</div>
          </div>
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
            @add-to-cart="handleAddToCart"
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
            @add-to-cart="handleAddToCart"
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
            @add-to-cart="handleAddToCart"
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
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
    }

    .banner-content {
      position: relative;
      z-index: 1;
      text-align: center;
      color: white;

      h2 {
        font-size: 48px;
        font-weight: bold;
        margin-bottom: 16px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      p {
        font-size: 24px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
    }
  }
}

// 分类区域
.category-section {
  padding: 60px 0;
  background: white;

  .category-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 20px;
    margin-top: 40px;

    .category-item {
      text-align: center;
      padding: 30px 20px;
      background: #f8f9fa;
      border-radius: $border-radius-base;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: $primary-color;
        color: white;
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba($primary-color, 0.3);
      }

      .category-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }

      .category-name {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 8px;
      }

      .category-count {
        font-size: 12px;
        opacity: 0.7;
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
