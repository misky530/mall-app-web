<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Location, Box, Checked, Clock } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 订单ID
const orderId = route.params.id

// 订单详情
const orderDetail = ref(null)
// 加载状态
const loading = ref(false)

// 获取订单详情
const fetchOrderDetail = async () => {
  loading.value = true
  try {
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock 订单详情数据
    orderDetail.value = {
      id: orderId,
      orderSn: `ORD${orderId}`,
      status: 2, // 0:待付款 1:待发货 2:待收货 3:待评价 4:已完成
      statusName: '待收货',
      createTime: '2024-01-20 14:30:25',
      payTime: '2024-01-20 14:32:10',
      deliveryTime: '2024-01-21 10:20:00',
      receiveTime: null,
      totalAmount: 627.00,
      freightAmount: 10.00,
      payAmount: 637.00,
      payType: 1, // 1:支付宝 2:微信
      payTypeName: '支付宝',
      remark: '请尽快发货，谢谢',

      // 收货地址
      receiverName: '张三',
      receiverPhone: '13800138000',
      receiverProvince: '广东省',
      receiverCity: '深圳市',
      receiverRegion: '南山区',
      receiverDetailAddress: '科技园南区XX路XX号',

      // 物流信息
      deliveryCompany: '顺丰速运',
      deliverySn: 'SF1234567890',
      logisticsStatus: '运输中',

      // 商品列表
      items: [
        {
          id: 1,
          productId: 1,
          productName: '时尚男士T恤 夏季新款',
          productPic: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
          price: 129.00,
          quantity: 2,
          productSku: '颜色:白色 尺码:L'
        },
        {
          id: 2,
          productId: 2,
          productName: '无线蓝牙耳机 降噪版',
          productPic: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=300&fit=crop',
          price: 299.00,
          quantity: 1,
          productSku: '颜色:黑色'
        },
        {
          id: 3,
          productId: 3,
          productName: '智能手环 运动手表',
          productPic: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=300&h=300&fit=crop',
          price: 199.00,
          quantity: 1,
          productSku: '颜色:蓝色'
        }
      ],

      // 物流跟踪
      logisticsTrace: [
        {
          time: '2024-01-21 15:30:00',
          content: '【深圳市】快件已到达 深圳南山营业点'
        },
        {
          time: '2024-01-21 12:20:00',
          content: '【深圳市】快件已发车'
        },
        {
          time: '2024-01-21 10:20:00',
          content: '【深圳市】您的快件已打包完成'
        },
        {
          time: '2024-01-21 09:00:00',
          content: '【深圳市】卖家已发货'
        }
      ]
    }
  } catch (error) {
    console.error('获取订单详情失败：', error)
    ElMessage.error('获取订单详情失败')
  } finally {
    loading.value = false
  }
}

// 去支付
const handlePayOrder = () => {
  router.push(`/order/pay/${orderId}`)
}

// 取消订单
const handleCancelOrder = () => {
  ElMessage.info('取消订单功能待开发')
}

// 确认收货
const handleConfirmReceipt = () => {
  ElMessage.info('确认收货功能待开发')
}

// 申请售后
const handleAfterSale = () => {
  ElMessage.info('售后功能待开发')
}

// 删除订单
const handleDeleteOrder = () => {
  ElMessage.info('删除订单功能待开发')
}

// 查看物流
const handleViewLogistics = () => {
  // 滚动到物流信息区域
  const logisticsSection = document.querySelector('.logistics-section')
  if (logisticsSection) {
    logisticsSection.scrollIntoView({ behavior: 'smooth' })
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
          <div style="font-size: 32px; margin-bottom: 4px;">📦</div>
          <div>暂无图片</div>
        </div>
      </div>
    `
  }
}

// 获取订单状态步骤
const getOrderSteps = () => {
  if (!orderDetail.value) return []

  const steps = [
    { title: '提交订单', time: orderDetail.value.createTime, active: true },
    { title: '支付订单', time: orderDetail.value.payTime, active: orderDetail.value.status >= 1 },
    { title: '商品发货', time: orderDetail.value.deliveryTime, active: orderDetail.value.status >= 2 },
    { title: '确认收货', time: orderDetail.value.receiveTime, active: orderDetail.value.status >= 3 }
  ]

  return steps
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<template>
  <div class="order-detail-page">
    <div class="container">
      <!-- 面包屑 -->
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/order/list' }">我的订单</el-breadcrumb-item>
        <el-breadcrumb-item>订单详情</el-breadcrumb-item>
      </el-breadcrumb>

      <div v-loading="loading" class="order-detail-content">
        <el-empty v-if="!orderDetail && !loading" description="订单不存在" />

        <div v-if="orderDetail" class="detail-sections">
          <!-- 订单状态 -->
          <div class="section status-section">
            <div class="status-header">
              <div class="status-info">
                <el-icon :size="24"><Checked /></el-icon>
                <span class="status-text">{{ orderDetail.statusName }}</span>
              </div>
              <div class="order-sn">订单号：{{ orderDetail.orderSn }}</div>
            </div>

            <!-- 订单进度 -->
            <div class="order-steps">
              <el-steps :active="orderDetail.status" align-center>
                <el-step
                  v-for="(step, index) in getOrderSteps()"
                  :key="index"
                  :title="step.title"
                  :description="step.time || ''"
                />
              </el-steps>
            </div>
          </div>

          <!-- 收货信息 -->
          <div class="section address-section">
            <div class="section-title">
              <el-icon><Location /></el-icon>
              <span>收货信息</span>
            </div>
            <div class="address-content">
              <div class="address-row">
                <span class="label">收货人：</span>
                <span class="value">{{ orderDetail.receiverName }} {{ orderDetail.receiverPhone }}</span>
              </div>
              <div class="address-row">
                <span class="label">收货地址：</span>
                <span class="value">
                  {{ orderDetail.receiverProvince }} {{ orderDetail.receiverCity }}
                  {{ orderDetail.receiverRegion }} {{ orderDetail.receiverDetailAddress }}
                </span>
              </div>
            </div>
          </div>

          <!-- 商品信息 -->
          <div class="section goods-section">
            <div class="section-title">
              <el-icon><Box /></el-icon>
              <span>商品信息</span>
            </div>
            <div class="goods-list">
              <div class="goods-header">
                <div class="col-product">商品</div>
                <div class="col-price">单价</div>
                <div class="col-quantity">数量</div>
                <div class="col-subtotal">小计</div>
              </div>
              <div class="goods-items">
                <div
                  v-for="item in orderDetail.items"
                  :key="item.id"
                  class="goods-item"
                >
                  <div class="col-product">
                    <div class="product-info">
                      <div class="product-image">
                        <img
                          :src="item.productPic"
                          :alt="item.productName"
                          @error="handleImageError"
                        />
                      </div>
                      <div class="product-detail">
                        <div class="product-name">{{ item.productName }}</div>
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

          <!-- 物流信息 -->
          <div v-if="orderDetail.deliverySn" class="section logistics-section">
            <div class="section-title">
              <el-icon><Clock /></el-icon>
              <span>物流信息</span>
            </div>
            <div class="logistics-info">
              <div class="logistics-header">
                <span class="company">{{ orderDetail.deliveryCompany }}</span>
                <span class="tracking-no">运单号：{{ orderDetail.deliverySn }}</span>
                <span class="status">{{ orderDetail.logisticsStatus }}</span>
              </div>
              <div class="logistics-trace">
                <el-timeline>
                  <el-timeline-item
                    v-for="(trace, index) in orderDetail.logisticsTrace"
                    :key="index"
                    :timestamp="trace.time"
                    :type="index === 0 ? 'primary' : ''"
                  >
                    {{ trace.content }}
                  </el-timeline-item>
                </el-timeline>
              </div>
            </div>
          </div>

          <!-- 订单信息 -->
          <div class="section order-info-section">
            <div class="section-title">
              <span>订单信息</span>
            </div>
            <div class="order-info-content">
              <div class="info-row">
                <span class="label">订单编号：</span>
                <span class="value">{{ orderDetail.orderSn }}</span>
              </div>
              <div class="info-row">
                <span class="label">创建时间：</span>
                <span class="value">{{ orderDetail.createTime }}</span>
              </div>
              <div class="info-row" v-if="orderDetail.payTime">
                <span class="label">支付时间：</span>
                <span class="value">{{ orderDetail.payTime }}</span>
              </div>
              <div class="info-row" v-if="orderDetail.payType">
                <span class="label">支付方式：</span>
                <span class="value">{{ orderDetail.payTypeName }}</span>
              </div>
              <div class="info-row" v-if="orderDetail.remark">
                <span class="label">订单备注：</span>
                <span class="value">{{ orderDetail.remark }}</span>
              </div>
            </div>
          </div>

          <!-- 费用信息 -->
          <div class="section payment-section">
            <div class="payment-info">
              <div class="info-row">
                <span class="label">商品总价：</span>
                <span class="value">¥{{ orderDetail.totalAmount.toFixed(2) }}</span>
              </div>
              <div class="info-row">
                <span class="label">运费：</span>
                <span class="value">¥{{ orderDetail.freightAmount.toFixed(2) }}</span>
              </div>
              <div class="info-row total-row">
                <span class="label">实付款：</span>
                <span class="total-price">¥{{ orderDetail.payAmount.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="section actions-section">
            <el-button v-if="orderDetail.status === 0" type="primary" @click="handlePayOrder">
              去支付
            </el-button>
            <el-button v-if="orderDetail.status === 0" @click="handleCancelOrder">
              取消订单
            </el-button>
            <el-button v-if="orderDetail.status === 2" type="primary" @click="handleConfirmReceipt">
              确认收货
            </el-button>
            <el-button v-if="orderDetail.status === 2" @click="handleViewLogistics">
              查看物流
            </el-button>
            <el-button v-if="orderDetail.status >= 3" @click="handleAfterSale">
              申请售后
            </el-button>
            <el-button @click="router.push('/order/list')">
              返回订单列表
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.order-detail-page {
  padding: 20px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 200px);

  .breadcrumb {
    margin-bottom: 20px;
  }

  .order-detail-content {
    min-height: 400px;

    .detail-sections {
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

      // 订单状态
      .status-section {
        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;

          .status-info {
            display: flex;
            align-items: center;
            gap: 12px;

            .status-text {
              font-size: 20px;
              font-weight: 500;
              color: $primary-color;
            }
          }

          .order-sn {
            font-size: 14px;
            color: $text-secondary;
          }
        }

        .order-steps {
          padding: 20px 40px;
        }
      }

      // 收货信息
      .address-section {
        .address-content {
          .address-row {
            display: flex;
            margin-bottom: 12px;
            font-size: 14px;

            &:last-child {
              margin-bottom: 0;
            }

            .label {
              color: $text-secondary;
              min-width: 80px;
            }

            .value {
              color: $text-primary;
              flex: 1;
            }
          }
        }
      }

      // 商品信息
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

      // 物流信息
      .logistics-section {
        .logistics-info {
          .logistics-header {
            display: flex;
            gap: 24px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: $border-radius-small;
            margin-bottom: 16px;
            font-size: 14px;

            .company {
              font-weight: 500;
              color: $text-primary;
            }

            .tracking-no {
              color: $text-secondary;
            }

            .status {
              color: $primary-color;
            }
          }

          .logistics-trace {
            padding: 12px;
          }
        }
      }

      // 订单信息
      .order-info-section {
        .order-info-content {
          .info-row {
            display: flex;
            margin-bottom: 12px;
            font-size: 14px;

            &:last-child {
              margin-bottom: 0;
            }

            .label {
              color: $text-secondary;
              min-width: 100px;
            }

            .value {
              color: $text-primary;
              flex: 1;
            }
          }
        }
      }

      // 费用信息
      .payment-section {
        .payment-info {
          padding: 16px;
          background: #f8f9fa;
          border-radius: $border-radius-small;

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
      }

      // 操作按钮
      .actions-section {
        display: flex;
        justify-content: center;
        gap: 12px;
      }
    }
  }
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

  .logistics-header {
    flex-direction: column !important;
    gap: 8px !important;
  }

  .actions-section {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}
</style>
