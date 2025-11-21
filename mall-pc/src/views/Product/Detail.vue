<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart, Minus, Plus, Star, StarFilled } from '@element-plus/icons-vue'
import { useCartStore } from '@/stores/cart'
import * as productApi from '@/api/product'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

// 商品详情
const productDetail = ref(null)
const loading = ref(false)

// 当前选中的图片索引
const currentImageIndex = ref(0)

// 购买数量
const quantity = ref(1)

// 选中的规格
const selectedSpecs = ref({})

// Tab激活项
const activeTab = ref('detail')

// 商品图片列表
const productImages = computed(() => {
  if (!productDetail.value) return []
  const images = [productDetail.value.pic]
  if (productDetail.value.albumPics) {
    images.push(...productDetail.value.albumPics.split(','))
  }
  return images.filter(Boolean)
})

// 当前大图
const currentImage = computed(() => {
  return productImages.value[currentImageIndex.value] || productImages.value[0] || ''
})

// Mock 商品详情数据
const generateMockProductDetail = () => {
  const id = route.params.id
  const baseNum = 1600000000000 + parseInt(id) * 100000

  return {
    id: id,
    name: '精选优质商品',
    subTitle: '高品质商品，值得信赖，限时优惠中',
    price: 299,
    originalPrice: 599,
    promotionPrice: 259,
    pic: `https://images.unsplash.com/photo-${baseNum}?w=600&h=600&fit=crop&auto=format`,
    albumPics: [
      `https://images.unsplash.com/photo-${baseNum}?w=600&h=600&fit=crop&auto=format`,
      `https://images.unsplash.com/photo-${baseNum + 10000}?w=600&h=600&fit=crop&auto=format`,
      `https://images.unsplash.com/photo-${baseNum + 20000}?w=600&h=600&fit=crop&auto=format`,
      `https://images.unsplash.com/photo-${baseNum + 30000}?w=600&h=600&fit=crop&auto=format`
    ].join(','),
    sale: 8888,
    stock: 100,
    brandName: '精选品牌',
    productSn: 'SN' + Date.now(),
    weight: '500g',
    description: '这是一款精选优质商品，采用优质材料制作，工艺精良，品质卓越。适合日常使用，是您生活的好帮手。',
    detailHtml: `<div style="padding: 20px;"><h3>商品详情</h3><p>这是一款精选优质商品，采用优质材料制作，工艺精良，品质卓越。</p><img src="https://images.unsplash.com/photo-${baseNum + 50000}?w=800&h=400&fit=crop&auto=format" style="width: 100%; margin: 20px 0;" /></div>`
  }
}

// 获取商品详情
const fetchProductDetail = async () => {
  loading.value = true
  try {
    const res = await productApi.fetchProductDetail(route.params.id)
    if (res && res.data) {
      productDetail.value = res.data
    } else {
      // API 返回但无数据，使用 Mock 数据
      console.warn('API 返回数据为空，使用 Mock 数据')
      productDetail.value = generateMockProductDetail()
    }
  } catch (error) {
    console.error('获取商品详情失败：', error)
    ElMessage.warning('使用示例数据展示')
    // API 调用失败，使用 Mock 数据
    productDetail.value = generateMockProductDetail()
  } finally {
    loading.value = false
  }
}

// 切换图片
const handleImageChange = (index) => {
  currentImageIndex.value = index
}

// 数量减少
const handleDecrease = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

// 数量增加
const handleIncrease = () => {
  const stock = productDetail.value?.stock || 0
  if (quantity.value < stock) {
    quantity.value++
  } else {
    ElMessage.warning('库存不足')
  }
}

// 加入购物车
const handleAddToCart = async () => {
  if (!productDetail.value) return

  await cartStore.addItem({
    productId: productDetail.value.id,
    skuId: productDetail.value.skuId || productDetail.value.id,
    quantity: quantity.value,
    // 添加更多信息用于本地 Mock 模式
    productName: productDetail.value.name,
    productPic: productDetail.value.pic,
    price: productDetail.value.price,
    productSku: productDetail.value.subTitle || ''
  })
}

// 立即购买
const handleBuyNow = () => {
  handleAddToCart()
  router.push('/cart')
}

// 主图加载错误处理
const handleMainImageError = (e) => {
  e.target.style.display = 'none'
  e.target.parentElement.innerHTML = `
    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f0f0f0; color: #999;">
      <div style="text-align: center;">
        <div style="font-size: 80px; margin-bottom: 16px;">📦</div>
        <div style="font-size: 16px;">暂无图片</div>
      </div>
    </div>
  `
}

// 缩略图加载错误处理
const handleThumbImageError = (e) => {
  e.target.style.display = 'none'
  e.target.parentElement.style.background = '#f0f0f0'
  e.target.parentElement.innerHTML = `
    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #999; font-size: 24px;">
      📦
    </div>
  `
}

onMounted(() => {
  fetchProductDetail()
})
</script>

<template>
  <div class="product-detail-page" v-loading="loading">
    <div class="container">
      <!-- 面包屑 -->
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/product/list' }">商品列表</el-breadcrumb-item>
        <el-breadcrumb-item>商品详情</el-breadcrumb-item>
      </el-breadcrumb>

      <!-- 无数据提示 -->
      <el-empty v-if="!productDetail && !loading" description="商品不存在或已下架" />

      <!-- 商品详情内容 -->
      <div v-if="productDetail && !loading" class="detail-content">
        <!-- 商品主要信息 -->
        <div class="product-main">
          <!-- 商品图片 -->
          <div class="product-gallery">
            <div class="main-image">
              <img
                :src="currentImage"
                :alt="productDetail.name"
                @error="handleMainImageError"
              />
            </div>
            <div class="image-list">
              <div
                v-for="(image, index) in productImages"
                :key="index"
                :class="['image-item', { active: currentImageIndex === index }]"
                @click="handleImageChange(index)"
              >
                <img :src="image" alt="" @error="handleThumbImageError" />
              </div>
            </div>
          </div>

          <!-- 商品信息 -->
          <div class="product-info">
            <h1 class="product-title">{{ productDetail.name }}</h1>
            <p class="product-subtitle">{{ productDetail.subTitle }}</p>

            <!-- 价格 -->
            <div class="price-section">
              <div class="price-row">
                <span class="label">价格：</span>
                <div class="price-content">
                  <span class="current-price">¥{{ productDetail.price }}</span>
                  <span v-if="productDetail.originalPrice" class="original-price">
                    ¥{{ productDetail.originalPrice }}
                  </span>
                </div>
              </div>
              <div class="info-row">
                <span class="info-item">销量：{{ productDetail.sale || 0 }}</span>
                <span class="info-item">库存：{{ productDetail.stock || 0 }}</span>
              </div>
            </div>

            <!-- 优惠信息 -->
            <div v-if="productDetail.promotionPrice" class="promotion-section">
              <el-tag type="danger" effect="dark">限时促销</el-tag>
              <span class="promotion-price">¥{{ productDetail.promotionPrice }}</span>
            </div>

            <!-- 规格选择（示例） -->
            <div class="spec-section">
              <div class="spec-row">
                <span class="label">颜色：</span>
                <div class="spec-options">
                  <el-tag>默认</el-tag>
                </div>
              </div>
            </div>

            <!-- 数量选择 -->
            <div class="quantity-section">
              <span class="label">数量：</span>
              <div class="quantity-control">
                <el-button :icon="Minus" @click="handleDecrease" />
                <el-input-number
                  v-model="quantity"
                  :min="1"
                  :max="productDetail.stock"
                  controls-position="right"
                />
                <el-button :icon="Plus" @click="handleIncrease" />
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <el-button
                type="primary"
                size="large"
                :icon="ShoppingCart"
                @click="handleAddToCart"
              >
                加入购物车
              </el-button>
              <el-button
                type="danger"
                size="large"
                @click="handleBuyNow"
              >
                立即购买
              </el-button>
            </div>

            <!-- 服务保障 -->
            <div class="service-section">
              <div class="service-item">
                <el-icon><StarFilled /></el-icon>
                <span>正品保证</span>
              </div>
              <div class="service-item">
                <el-icon><StarFilled /></el-icon>
                <span>7天退换</span>
              </div>
              <div class="service-item">
                <el-icon><StarFilled /></el-icon>
                <span>快速配送</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 商品详细信息 -->
        <div class="product-details">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="商品详情" name="detail">
              <div class="detail-content-box">
                <div v-if="productDetail.detailHtml" v-html="productDetail.detailHtml"></div>
                <div v-else class="detail-placeholder">
                  <h3>商品描述</h3>
                  <p>{{ productDetail.description || '暂无详细描述' }}</p>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="规格参数" name="params">
              <div class="params-content">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="商品名称">
                    {{ productDetail.name }}
                  </el-descriptions-item>
                  <el-descriptions-item label="品牌">
                    {{ productDetail.brandName || '暂无' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="商品编号">
                    {{ productDetail.productSn || '暂无' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="商品重量">
                    {{ productDetail.weight || '暂无' }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-tab-pane>

            <el-tab-pane label="用户评价" name="reviews">
              <div class="reviews-content">
                <el-empty description="暂无评价" />
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.product-detail-page {
  padding: 20px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 200px);

  .breadcrumb {
    margin-bottom: 20px;
  }

  .detail-content {
    // 商品主要信息
    .product-main {
      background: white;
      border-radius: $border-radius-base;
      padding: 30px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: 450px 1fr;
      gap: 40px;

      // 商品图片
      .product-gallery {
        .main-image {
          width: 100%;
          height: 450px;
          border: 1px solid $border-light;
          border-radius: $border-radius-base;
          overflow: hidden;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;

          img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
        }

        .image-list {
          display: flex;
          gap: 12px;

          .image-item {
            width: 80px;
            height: 80px;
            border: 2px solid transparent;
            border-radius: $border-radius-small;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.3s;

            &:hover {
              border-color: $primary-color;
            }

            &.active {
              border-color: $primary-color;
            }

            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          }
        }
      }

      // 商品信息
      .product-info {
        .product-title {
          font-size: 24px;
          font-weight: 500;
          color: $text-primary;
          margin-bottom: 12px;
        }

        .product-subtitle {
          font-size: 14px;
          color: $text-secondary;
          margin-bottom: 24px;
        }

        .price-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: $border-radius-base;
          margin-bottom: 24px;

          .price-row {
            display: flex;
            align-items: baseline;
            margin-bottom: 12px;

            .label {
              font-size: 14px;
              color: $text-secondary;
              margin-right: 12px;
            }

            .price-content {
              display: flex;
              align-items: baseline;
              gap: 12px;

              .current-price {
                font-size: 32px;
                font-weight: bold;
                color: $primary-color;
              }

              .original-price {
                font-size: 16px;
                color: $text-secondary;
                text-decoration: line-through;
              }
            }
          }

          .info-row {
            display: flex;
            gap: 24px;
            font-size: 14px;
            color: $text-secondary;
          }
        }

        .promotion-section {
          margin-bottom: 24px;
          padding: 12px;
          background: #fff3f3;
          border-radius: $border-radius-base;
          display: flex;
          align-items: center;
          gap: 12px;

          .promotion-price {
            font-size: 20px;
            font-weight: bold;
            color: $danger-color;
          }
        }

        .spec-section,
        .quantity-section {
          margin-bottom: 24px;
          display: flex;
          align-items: center;

          .label {
            width: 80px;
            font-size: 14px;
            color: $text-secondary;
          }

          .spec-options {
            display: flex;
            gap: 12px;
          }

          .quantity-control {
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }

        .action-buttons {
          margin-bottom: 24px;
          display: flex;
          gap: 16px;

          .el-button {
            flex: 1;
          }
        }

        .service-section {
          display: flex;
          gap: 24px;
          padding-top: 24px;
          border-top: 1px solid $border-lighter;

          .service-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: $text-secondary;

            .el-icon {
              color: $primary-color;
            }
          }
        }
      }
    }

    // 商品详细信息
    .product-details {
      background: white;
      border-radius: $border-radius-base;
      padding: 30px;

      .detail-content-box,
      .params-content,
      .reviews-content {
        padding: 20px 0;
        min-height: 300px;

        .detail-placeholder {
          h3 {
            font-size: 18px;
            margin-bottom: 16px;
          }

          p {
            font-size: 14px;
            color: $text-secondary;
            line-height: 1.8;
          }
        }
      }
    }
  }
}

// 响应式
@media (max-width: 1200px) {
  .product-main {
    grid-template-columns: 400px 1fr !important;
    gap: 30px !important;
  }

  .main-image {
    height: 400px !important;
  }
}

@media (max-width: 768px) {
  .product-main {
    grid-template-columns: 1fr !important;
  }
}
</style>
