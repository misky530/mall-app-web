<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart, TrendCharts, InfoFilled } from '@element-plus/icons-vue'
import { getPurchaseRecommendations, addToCartFromRecommendation } from '@/utils/purchaseRecommendation'

const router = useRouter()
const recommendations = ref([])
const loading = ref(true)

// 加载推荐数据
const loadRecommendations = () => {
  loading.value = true
  try {
    recommendations.value = getPurchaseRecommendations()
    console.log('加载采购推荐:', recommendations.value.length, '个')
  } catch (error) {
    console.error('加载采购推荐失败:', error)
  } finally {
    loading.value = false
  }
}

// 紧急程度标签
const urgencyConfig = {
  high: { text: '紧急', type: 'danger', color: '#ff4d4f' },
  medium: { text: '建议采购', type: 'warning', color: '#faad14' },
  low: { text: '充足', type: 'success', color: '#52c41a' }
}

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}

// 一键加入购物车
const handleAddToCart = (recommendation) => {
  try {
    addToCartFromRecommendation(recommendation)
    ElMessage.success(`已添加 ${recommendation.suggestedQuantity} 个 ${recommendation.productName} 到购物车`)
  } catch (error) {
    console.error('添加到购物车失败:', error)
    ElMessage.error('添加失败,请重试')
  }
}

// 查看商品详情
const viewProduct = (productId) => {
  router.push(`/product/${productId}`)
}

onMounted(() => {
  loadRecommendations()
})
</script>

<template>
  <div class="purchase-recommendation">
    <div class="section-header">
      <div class="header-left">
        <h3>
          <el-icon><TrendCharts /></el-icon>
          智能采购推荐
        </h3>
        <p class="subtitle">基于历史采购周期的AI分析</p>
      </div>
      <div class="header-right">
        <el-tooltip content="根据您的历史采购记录,智能分析采购周期,推荐最佳复购时机" placement="left">
          <el-icon class="info-icon"><InfoFilled /></el-icon>
        </el-tooltip>
      </div>
    </div>

    <div v-loading="loading" class="recommendation-list">
      <div v-if="recommendations.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">📦</div>
        <p>暂无采购推荐</p>
        <span class="empty-hint">完成几笔订单后,系统将为您智能推荐复购商品</span>
      </div>

      <div
        v-for="item in recommendations"
        :key="item.productId"
        class="recommendation-card"
        :class="`urgency-${item.urgency}`"
      >
        <!-- 紧急标签 -->
        <div class="urgency-badge" :style="{ background: urgencyConfig[item.urgency].color }">
          {{ urgencyConfig[item.urgency].text }}
        </div>

        <div class="card-content">
          <!-- 商品信息 -->
          <div class="product-info" @click="viewProduct(item.productId)">
            <img :src="item.productPic" :alt="item.productName" class="product-image" />
            <div class="product-details">
              <h4 class="product-name">{{ item.productName }}</h4>
              <div class="product-meta">
                <span class="meta-item">
                  <span class="label">采购周期:</span>
                  <span class="value">{{ item.avgCycle }}天</span>
                </span>
                <span class="meta-item">
                  <span class="label">上次采购:</span>
                  <span class="value">{{ item.daysSince }}天前</span>
                </span>
              </div>
            </div>
          </div>

          <!-- 推荐信息 -->
          <div class="recommendation-info">
            <div class="info-row">
              <div class="info-item">
                <span class="info-label">建议数量</span>
                <span class="info-value primary">{{ item.suggestedQuantity }}个</span>
              </div>
              <div class="info-item">
                <span class="info-label">参考单价</span>
                <span class="info-value">¥{{ item.price }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">历史采购</span>
                <span class="info-value">{{ item.purchaseCount }}次</span>
              </div>
            </div>

            <!-- 价格变动提示 -->
            <div v-if="Math.abs(item.priceChange) > 5" class="price-change-tip">
              <span v-if="item.priceChange > 0" class="price-up">
                ⬆ 价格上涨 {{ item.priceChange }}%
              </span>
              <span v-else class="price-down">
                ⬇ 价格下降 {{ Math.abs(item.priceChange) }}%,建议采购
              </span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="card-actions">
            <el-button
              type="primary"
              :icon="ShoppingCart"
              @click="handleAddToCart(item)"
            >
              一键复购
            </el-button>
            <el-button @click="viewProduct(item.productId)">
              查看详情
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.purchase-recommendation {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;

    .header-left {
      h3 {
        font-size: 18px;
        font-weight: 600;
        color: $text-primary;
        margin: 0 0 4px 0;
        display: flex;
        align-items: center;
        gap: 8px;

        .el-icon {
          font-size: 20px;
          color: $color-primary;
        }
      }

      .subtitle {
        font-size: 12px;
        color: $text-placeholder;
        margin: 0;
      }
    }

    .header-right {
      .info-icon {
        font-size: 18px;
        color: $text-placeholder;
        cursor: pointer;
        transition: color 0.3s;

        &:hover {
          color: $color-primary;
        }
      }
    }
  }

  .recommendation-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 16px;
    min-height: 200px;

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;

      .empty-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      p {
        font-size: 16px;
        color: $text-secondary;
        margin: 0 0 8px 0;
      }

      .empty-hint {
        font-size: 13px;
        color: $text-placeholder;
      }
    }

    .recommendation-card {
      position: relative;
      border: 2px solid #e8e8e8;
      border-radius: 10px;
      padding: 16px;
      transition: all 0.3s;
      overflow: hidden;

      &.urgency-high {
        border-color: #ff4d4f;
        background: linear-gradient(135deg, #fff1f0 0%, #ffffff 100%);
      }

      &.urgency-medium {
        border-color: #faad14;
        background: linear-gradient(135deg, #fffbf0 0%, #ffffff 100%);
      }

      &.urgency-low {
        border-color: #52c41a;
        background: linear-gradient(135deg, #f6ffed 0%, #ffffff 100%);
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }

      .urgency-badge {
        position: absolute;
        top: 0;
        right: 0;
        padding: 4px 12px;
        color: white;
        font-size: 12px;
        font-weight: 600;
        border-bottom-left-radius: 8px;
      }

      .card-content {
        .product-info {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
          cursor: pointer;

          .product-image {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 8px;
            border: 1px solid #f0f0f0;
          }

          .product-details {
            flex: 1;

            .product-name {
              font-size: 15px;
              font-weight: 600;
              color: $text-primary;
              margin: 0 0 8px 0;
              line-height: 1.4;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              transition: color 0.3s;

              &:hover {
                color: $color-primary;
              }
            }

            .product-meta {
              display: flex;
              flex-direction: column;
              gap: 4px;

              .meta-item {
                font-size: 13px;

                .label {
                  color: $text-placeholder;
                  margin-right: 4px;
                }

                .value {
                  color: $text-secondary;
                  font-weight: 500;
                }
              }
            }
          }
        }

        .recommendation-info {
          margin-bottom: 16px;

          .info-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 12px;

            .info-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 8px;
              background: rgba(0, 0, 0, 0.02);
              border-radius: 6px;

              .info-label {
                font-size: 12px;
                color: $text-placeholder;
                margin-bottom: 4px;
              }

              .info-value {
                font-size: 16px;
                font-weight: 700;
                color: $text-primary;

                &.primary {
                  color: $color-primary;
                  font-size: 18px;
                }
              }
            }
          }

          .price-change-tip {
            text-align: center;
            font-size: 13px;
            font-weight: 500;

            .price-up {
              color: #ff4d4f;
            }

            .price-down {
              color: #52c41a;
            }
          }
        }

        .card-actions {
          display: flex;
          gap: 8px;

          .el-button {
            flex: 1;
          }
        }
      }
    }
  }
}
</style>
