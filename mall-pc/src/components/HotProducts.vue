<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { TrendCharts, ShoppingCart } from '@element-plus/icons-vue'
import { getHotProducts, getHotProductsByCategory, recordProductView } from '@/utils/hotProductsRecommendation'

const props = defineProps({
  // 分类ID,不传则显示全部热门
  categoryId: {
    type: [Number, String],
    default: null
  },
  // 显示数量
  limit: {
    type: Number,
    default: 10
  },
  // 显示模式: grid(网格), list(列表), carousel(轮播)
  mode: {
    type: String,
    default: 'grid',
    validator: (value) => ['grid', 'list', 'carousel'].includes(value)
  }
})

const router = useRouter()
const hotProducts = ref([])
const loading = ref(true)

// 加载热门商品
const loadHotProducts = () => {
  loading.value = true
  try {
    if (props.categoryId) {
      hotProducts.value = getHotProductsByCategory(props.categoryId, props.limit)
    } else {
      hotProducts.value = getHotProducts(props.limit)
    }
    console.log('加载热门商品:', hotProducts.value.length, '个')
  } catch (error) {
    console.error('加载热门商品失败:', error)
  } finally {
    loading.value = false
  }
}

// 查看商品详情
const viewProduct = (product) => {
  recordProductView(product.id)
  router.push(`/product/${product.id}`)
}

// 添加到购物车
const addToCart = (product) => {
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')

    const existingIndex = cart.findIndex(item => item.productId === product.id)

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1
    } else {
      cart.push({
        productId: product.id,
        productName: product.name,
        productPic: product.pic,
        price: product.price,
        quantity: 1,
        addTime: new Date().toISOString()
      })
    }

    localStorage.setItem('cart', JSON.stringify(cart))
    ElMessage.success(`已添加 ${product.name} 到购物车`)
  } catch (error) {
    console.error('添加到购物车失败:', error)
    ElMessage.error('添加失败,请重试')
  }
}

// 格式化热度分数
const formatHotScore = (score) => {
  return score ? score.toFixed(1) : '0.0'
}

onMounted(() => {
  loadHotProducts()
})
</script>

<template>
  <div class="hot-products" :class="`mode-${mode}`">
    <div class="section-header">
      <h3>
        <span class="fire-emoji">🔥</span>
        {{ categoryId ? '分类热销' : '热门商品' }}
      </h3>
      <p class="subtitle">基于多维度数据的AI推荐</p>
    </div>

    <div v-loading="loading" class="products-container">
      <div v-if="hotProducts.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>暂无热门商品</p>
      </div>

      <!-- 网格模式 -->
      <div v-if="mode === 'grid'" class="products-grid">
        <div
          v-for="product in hotProducts"
          :key="product.id"
          class="product-card"
          @click="viewProduct(product)"
        >
          <!-- 热度标签 -->
          <div class="hot-badge">
            <el-icon><TrendCharts /></el-icon>
            <span>{{ formatHotScore(product.hotScore) }}</span>
          </div>

          <!-- 商品标签 -->
          <div v-if="product.tags && product.tags.length > 0" class="product-tags">
            <el-tag
              v-for="(tag, index) in product.tags.slice(0, 2)"
              :key="index"
              :type="tag.type"
              size="small"
            >
              {{ tag.text }}
            </el-tag>
          </div>

          <!-- 商品图片 -->
          <div class="product-image-wrapper">
            <img :src="product.pic" :alt="product.name" class="product-image" />
          </div>

          <!-- 商品信息 -->
          <div class="product-info">
            <h4 class="product-name" :title="product.name">{{ product.name }}</h4>

            <div class="product-stats">
              <span class="stat-item">
                <span class="stat-label">销量:</span>
                <span class="stat-value">{{ product.stats?.sales || 0 }}</span>
              </span>
              <span class="stat-item">
                <span class="stat-label">评分:</span>
                <span class="stat-value rating">{{ product.stats?.rating?.toFixed(1) || '4.0' }}</span>
              </span>
            </div>

            <div class="product-price">
              <span class="current-price">¥{{ product.price }}</span>
              <span v-if="product.originalPrice && product.originalPrice > product.price" class="original-price">
                ¥{{ product.originalPrice }}
              </span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="product-actions">
            <el-button
              type="primary"
              size="small"
              :icon="ShoppingCart"
              @click.stop="addToCart(product)"
            >
              加入购物车
            </el-button>
          </div>
        </div>
      </div>

      <!-- 列表模式 -->
      <div v-else-if="mode === 'list'" class="products-list">
        <div
          v-for="(product, index) in hotProducts"
          :key="product.id"
          class="product-list-item"
          @click="viewProduct(product)"
        >
          <!-- 排名 -->
          <div class="rank-badge" :class="{ top3: index < 3 }">
            {{ index + 1 }}
          </div>

          <!-- 商品图片 -->
          <img :src="product.pic" :alt="product.name" class="product-image" />

          <!-- 商品信息 -->
          <div class="product-info">
            <h4 class="product-name">{{ product.name }}</h4>
            <div class="product-tags">
              <el-tag
                v-for="(tag, idx) in product.tags"
                :key="idx"
                :type="tag.type"
                size="small"
              >
                {{ tag.text }}
              </el-tag>
            </div>
          </div>

          <!-- 热度分数 -->
          <div class="hot-score">
            <div class="score-value">{{ formatHotScore(product.hotScore) }}</div>
            <div class="score-label">热度</div>
          </div>

          <!-- 价格 -->
          <div class="product-price">
            <span class="current-price">¥{{ product.price }}</span>
          </div>

          <!-- 操作 -->
          <el-button
            type="primary"
            size="small"
            :icon="ShoppingCart"
            @click.stop="addToCart(product)"
          >
            加购
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.hot-products {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .section-header {
    margin-bottom: 20px;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
      margin: 0 0 4px 0;
      display: flex;
      align-items: center;
      gap: 8px;

      .fire-emoji {
        font-size: 20px;
        line-height: 1;
      }
    }

    .subtitle {
      font-size: 12px;
      color: $text-placeholder;
      margin: 0;
    }
  }

  .products-container {
    min-height: 200px;

    .empty-state {
      text-align: center;
      padding: 60px 20px;

      .empty-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      p {
        font-size: 16px;
        color: $text-secondary;
        margin: 0;
      }
    }
  }

  // 网格模式
  &.mode-grid {
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;

      .product-card {
        position: relative;
        border: 1px solid #f0f0f0;
        border-radius: 10px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.3s;
        background: white;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border-color: $primary-color;
        }

        .hot-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          z-index: 1;

          .el-icon {
            font-size: 14px;
          }
        }

        .product-tags {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: flex-end;
          z-index: 1;
        }

        .product-image-wrapper {
          width: 100%;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          border-radius: 8px;
          overflow: hidden;
          background: #fafafa;

          .product-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .product-info {
          .product-name {
            font-size: 14px;
            font-weight: 600;
            color: $text-primary;
            margin: 0 0 8px 0;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            min-height: 40px;
          }

          .product-stats {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;

            .stat-item {
              .stat-label {
                color: $text-placeholder;
              }

              .stat-value {
                color: $text-secondary;
                font-weight: 500;

                &.rating {
                  color: #faad14;
                }
              }
            }
          }

          .product-price {
            display: flex;
            align-items: baseline;
            gap: 8px;
            margin-bottom: 12px;

            .current-price {
              font-size: 20px;
              font-weight: 700;
              color: #ff4d4f;
            }

            .original-price {
              font-size: 14px;
              color: $text-placeholder;
              text-decoration: line-through;
            }
          }
        }

        .product-actions {
          .el-button {
            width: 100%;
          }
        }
      }
    }
  }

  // 列表模式
  &.mode-list {
    .products-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .product-list-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        border: 1px solid #f0f0f0;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: #fafafa;
          border-color: $primary-color;
        }

        .rank-badge {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f0f0;
          color: $text-secondary;
          font-size: 16px;
          font-weight: 700;
          border-radius: 50%;
          flex-shrink: 0;

          &.top3 {
            background: linear-gradient(135deg, #faad14 0%, #ffd666 100%);
            color: white;
          }
        }

        .product-image {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #f0f0f0;
          flex-shrink: 0;
        }

        .product-info {
          flex: 1;
          min-width: 0;

          .product-name {
            font-size: 15px;
            font-weight: 600;
            color: $text-primary;
            margin: 0 0 8px 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .product-tags {
            display: flex;
            gap: 6px;
          }
        }

        .hot-score {
          text-align: center;
          padding: 0 16px;
          flex-shrink: 0;

          .score-value {
            font-size: 24px;
            font-weight: 700;
            color: #ff4d4f;
            line-height: 1;
            margin-bottom: 4px;
          }

          .score-label {
            font-size: 12px;
            color: $text-placeholder;
          }
        }

        .product-price {
          padding: 0 16px;
          flex-shrink: 0;

          .current-price {
            font-size: 18px;
            font-weight: 700;
            color: #ff4d4f;
          }
        }

        .el-button {
          flex-shrink: 0;
        }
      }
    }
  }
}
</style>
