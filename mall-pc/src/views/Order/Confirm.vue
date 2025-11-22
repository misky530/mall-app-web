<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Location, Checked } from '@element-plus/icons-vue'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

// 收货地址列表
const addressList = ref([])
// 选中的地址
const selectedAddress = ref(null)
// 是否显示地址选择对话框
const showAddressDialog = ref(false)
// 备注
const remark = ref('')
// 提交中
const submitting = ref(false)

// 选中的购物车商品
const selectedItems = computed(() => {
  return cartStore.selectedItems || []
})

// 商品总价
const goodsTotal = computed(() => {
  return selectedItems.value.reduce((total, item) => {
    return total + item.price * item.quantity
  }, 0)
})

// 运费
const freight = computed(() => {
  // 满99免运费
  return goodsTotal.value >= 99 ? 0 : 10
})

// 订单总价
const orderTotal = computed(() => {
  return goodsTotal.value + freight.value
})

// 获取地址列表
const fetchAddressList = async () => {
  // Mock 地址数据
  addressList.value = [
    {
      id: 1,
      name: '张三',
      phone: '13800138000',
      province: '广东省',
      city: '深圳市',
      region: '南山区',
      detailAddress: '科技园南区XX路XX号',
      isDefault: true
    },
    {
      id: 2,
      name: '李四',
      phone: '13900139000',
      province: '北京市',
      city: '北京市',
      region: '朝阳区',
      detailAddress: 'XX大厦XX层',
      isDefault: false
    }
  ]
  // 设置默认地址
  selectedAddress.value = addressList.value.find(addr => addr.isDefault) || addressList.value[0]
}

// 选择地址
const handleSelectAddress = (address) => {
  selectedAddress.value = address
  showAddressDialog.value = false
}

// 新增地址
const handleAddAddress = () => {
  ElMessage.info('新增地址功能待开发')
  showAddressDialog.value = false
}

// 提交订单
const handleSubmitOrder = async () => {
  if (!selectedAddress.value) {
    ElMessage.warning('请选择收货地址')
    return
  }

  if (selectedItems.value.length === 0) {
    ElMessage.warning('购物车中没有选中的商品')
    return
  }

  // 直接提交订单，不需要二次确认（因为是B2B线下汇款流程）
  submitting.value = true
  try {
    // 模拟提交订单
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 创建订单成功
    const orderId = Date.now()
    ElMessage.success('订单创建成功，请上传付款凭证')

    // 清空购物车选中项
    // 这里应该调用 API 清空已下单商品

    // 跳转到支付页面（B2B线下汇款 - 上传付款凭证）
    router.push(`/order/pay/${orderId}`)
  } catch (error) {
    console.error('提交订单失败：', error)
    ElMessage.error('提交订单失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 图片加载错误处理
const handleImageError = (e) => {
  e.target.style.display = 'none'
  if (e.target.parentElement) {
    e.target.parentElement.style.background = '#f0f0f0'
    e.target.parentElement.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #999; font-size: 12px;">
        <div style="text-align: center;">
          <div style="font-size: 24px; margin-bottom: 4px;">📦</div>
          <div>暂无图片</div>
        </div>
      </div>
    `
  }
}

onMounted(() => {
  // 检查是否有选中商品
  if (cartStore.selectedIds.length === 0) {
    ElMessage.warning('请先选择要结算的商品')
    router.push('/cart')
    return
  }
  fetchAddressList()
})
</script>

<template>
  <div class="order-confirm-page">
    <div class="container">
      <!-- 面包屑 -->
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/cart' }">购物车</el-breadcrumb-item>
        <el-breadcrumb-item>确认订单</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="order-content">
        <!-- 收货地址 -->
        <div class="section address-section">
          <div class="section-title">
            <el-icon><Location /></el-icon>
            <span>收货地址</span>
          </div>

          <div v-if="selectedAddress" class="selected-address">
            <div class="address-info">
              <div class="address-header">
                <span class="receiver-name">{{ selectedAddress.name }}</span>
                <span class="receiver-phone">{{ selectedAddress.phone }}</span>
                <el-tag v-if="selectedAddress.isDefault" type="danger" size="small">默认</el-tag>
              </div>
              <div class="address-detail">
                {{ selectedAddress.province }} {{ selectedAddress.city }} {{ selectedAddress.region }} {{ selectedAddress.detailAddress }}
              </div>
            </div>
            <el-button link type="primary" @click="showAddressDialog = true">
              更换地址
            </el-button>
          </div>

          <div v-else class="no-address">
            <el-empty description="暂无收货地址">
              <el-button type="primary" @click="showAddressDialog = true">
                添加地址
              </el-button>
            </el-empty>
          </div>
        </div>

        <!-- 商品列表 -->
        <div class="section goods-section">
          <div class="section-title">
            <el-icon><Checked /></el-icon>
            <span>商品清单</span>
          </div>

          <div class="goods-list">
            <div class="goods-header">
              <div class="col-product">商品信息</div>
              <div class="col-price">单价</div>
              <div class="col-quantity">数量</div>
              <div class="col-subtotal">小计</div>
            </div>

            <div class="goods-items">
              <div
                v-for="item in selectedItems"
                :key="item.id"
                class="goods-item"
              >
                <div class="col-product">
                  <div class="product-info">
                    <div class="product-image">
                      <img
                        :src="item.productPic || item.pic"
                        :alt="item.productName || item.name"
                        @error="handleImageError"
                      />
                    </div>
                    <div class="product-detail">
                      <div class="product-name">{{ item.productName || item.name }}</div>
                      <div class="product-sku" v-if="item.productSku">{{ item.productSku }}</div>
                    </div>
                  </div>
                </div>
                <div class="col-price">¥{{ item.price.toFixed(2) }}</div>
                <div class="col-quantity">{{ item.quantity }}</div>
                <div class="col-subtotal">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 备注 -->
        <div class="section remark-section">
          <div class="section-title">
            <span>订单备注</span>
          </div>
          <el-input
            v-model="remark"
            type="textarea"
            :rows="3"
            placeholder="选填，可以告诉我们您对商品的特殊要求"
            maxlength="200"
            show-word-limit
          />
        </div>

        <!-- 结算信息 -->
        <div class="section settlement-section">
          <div class="settlement-info">
            <div class="info-row">
              <span class="label">商品总价：</span>
              <span class="value">¥{{ goodsTotal.toFixed(2) }}</span>
            </div>
            <div class="info-row">
              <span class="label">运费：</span>
              <span class="value">
                <template v-if="freight === 0">
                  <span class="free-freight">免运费</span>
                </template>
                <template v-else>
                  ¥{{ freight.toFixed(2) }}
                </template>
              </span>
            </div>
            <div class="info-row total-row">
              <span class="label">应付总额：</span>
              <span class="total-price">¥{{ orderTotal.toFixed(2) }}</span>
            </div>
          </div>

          <div class="settlement-action">
            <el-button
              type="primary"
              size="large"
              :loading="submitting"
              @click="handleSubmitOrder"
            >
              提交订单
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 地址选择对话框 -->
    <el-dialog
      v-model="showAddressDialog"
      title="选择收货地址"
      width="600px"
    >
      <div class="address-list">
        <div
          v-for="address in addressList"
          :key="address.id"
          class="address-item"
          :class="{ active: selectedAddress?.id === address.id }"
          @click="handleSelectAddress(address)"
        >
          <div class="address-content">
            <div class="address-header">
              <span class="receiver-name">{{ address.name }}</span>
              <span class="receiver-phone">{{ address.phone }}</span>
              <el-tag v-if="address.isDefault" type="danger" size="small">默认</el-tag>
            </div>
            <div class="address-detail">
              {{ address.province }} {{ address.city }} {{ address.region }} {{ address.detailAddress }}
            </div>
          </div>
          <el-icon v-if="selectedAddress?.id === address.id" class="check-icon" color="#409eff">
            <Checked />
          </el-icon>
        </div>
      </div>

      <div class="dialog-footer">
        <el-button type="primary" @click="handleAddAddress">
          新增地址
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.order-confirm-page {
  padding: 20px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 200px);

  .breadcrumb {
    margin-bottom: 20px;
  }

  .order-content {
    .section {
      background: white;
      border-radius: $border-radius-base;
      padding: 20px;
      margin-bottom: 16px;

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 500;
        color: $text-primary;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid $border-lighter;
      }
    }

    // 收货地址
    .address-section {
      .selected-address {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: #f8f9fa;
        border-radius: $border-radius-small;
        border: 1px solid $border-lighter;

        .address-info {
          flex: 1;

          .address-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;

            .receiver-name {
              font-size: 16px;
              font-weight: 500;
              color: $text-primary;
            }

            .receiver-phone {
              font-size: 14px;
              color: $text-secondary;
            }
          }

          .address-detail {
            font-size: 14px;
            color: $text-secondary;
            line-height: 1.6;
          }
        }
      }
    }

    // 商品列表
    .goods-section {
      .goods-list {
        .goods-header {
          display: grid;
          grid-template-columns: 1fr 120px 120px 120px;
          padding: 12px 16px;
          background: #f8f9fa;
          border-radius: $border-radius-small;
          font-size: 14px;
          font-weight: 500;
          color: $text-secondary;

          .col-price,
          .col-quantity,
          .col-subtotal {
            text-align: center;
          }
        }

        .goods-items {
          .goods-item {
            display: grid;
            grid-template-columns: 1fr 120px 120px 120px;
            padding: 16px;
            border-bottom: 1px solid $border-lighter;

            &:last-child {
              border-bottom: none;
            }

            .col-product {
              .product-info {
                display: flex;
                gap: 12px;

                .product-image {
                  width: 80px;
                  height: 80px;
                  border-radius: $border-radius-small;
                  overflow: hidden;
                  border: 1px solid $border-lighter;
                  flex-shrink: 0;

                  img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                  }
                }

                .product-detail {
                  flex: 1;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;

                  .product-name {
                    font-size: 14px;
                    color: $text-primary;
                    line-height: 1.5;
                    margin-bottom: 4px;
                  }

                  .product-sku {
                    font-size: 12px;
                    color: $text-placeholder;
                  }
                }
              }
            }

            .col-price,
            .col-quantity,
            .col-subtotal {
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              color: $text-primary;
            }

            .col-subtotal {
              font-weight: 500;
              color: $primary-color;
            }
          }
        }
      }
    }

    // 结算信息
    .settlement-section {
      .settlement-info {
        padding: 16px;
        background: #f8f9fa;
        border-radius: $border-radius-small;
        margin-bottom: 20px;

        .info-row {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 8px 0;
          font-size: 14px;

          .label {
            color: $text-secondary;
            margin-right: 12px;
          }

          .value {
            color: $text-primary;
            min-width: 100px;
            text-align: right;
          }

          .free-freight {
            color: $success-color;
          }

          &.total-row {
            margin-top: 8px;
            padding-top: 16px;
            border-top: 1px solid $border-lighter;
            font-size: 16px;

            .label {
              font-weight: 500;
            }

            .total-price {
              font-size: 24px;
              font-weight: bold;
              color: $primary-color;
            }
          }
        }
      }

      .settlement-action {
        display: flex;
        justify-content: flex-end;
      }
    }
  }
}

// 地址对话框
.address-list {
  max-height: 400px;
  overflow-y: auto;

  .address-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid $border-lighter;
    border-radius: $border-radius-small;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: $primary-color;
      background: #f0f7ff;
    }

    &.active {
      border-color: $primary-color;
      background: #f0f7ff;
    }

    .address-content {
      flex: 1;

      .address-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;

        .receiver-name {
          font-size: 14px;
          font-weight: 500;
          color: $text-primary;
        }

        .receiver-phone {
          font-size: 13px;
          color: $text-secondary;
        }
      }

      .address-detail {
        font-size: 13px;
        color: $text-secondary;
        line-height: 1.6;
      }
    }

    .check-icon {
      font-size: 24px;
    }
  }
}

.dialog-footer {
  margin-top: 16px;
  text-align: center;
}

// 响应式
@media (max-width: 768px) {
  .goods-header,
  .goods-item {
    grid-template-columns: 1fr !important;

    .col-price,
    .col-quantity,
    .col-subtotal {
      text-align: left !important;
      padding: 4px 0;
    }
  }
}
</style>
