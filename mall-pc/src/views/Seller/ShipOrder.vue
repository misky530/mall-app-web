<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ORDER_STATUS, getOrderStatusName } from '@/utils/orderStatus'

const route = useRoute()
const router = useRouter()

// 订单ID
const orderId = route.params.id

// 订单详情
const orderDetail = ref(null)
// 加载状态
const loading = ref(false)

// 发货表单
const shipForm = ref({
  deliveryCompany: '',
  deliverySn: '',
  remark: ''
})

// 物流公司选项
const deliveryCompanies = [
  '顺丰速运',
  '圆通速递',
  '申通快递',
  '中通快递',
  '韵达快递',
  'EMS',
  '其他'
]

// 提交中
const submitting = ref(false)

// 获取订单详情（Mock）
const fetchOrderDetail = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock数据
    orderDetail.value = {
      id: orderId,
      orderSn: `ORD${orderId}`,
      status: ORDER_STATUS.PROCESSING,
      statusName: getOrderStatusName(ORDER_STATUS.PROCESSING),
      totalAmount: 1000.00,
      payAmount: 1010.00,
      buyerName: 'XX公司',
      receiverName: '张三',
      receiverPhone: '13800138000',
      receiverAddress: '广东省深圳市南山区科技园XX路XX号',
      items: [
        {
          id: 1,
          productName: '示例商品',
          productPic: 'https://via.placeholder.com/80',
          price: 1000.00,
          quantity: 1
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

// 提交发货
const handleSubmitShip = async () => {
  if (!shipForm.value.deliveryCompany) {
    ElMessage.warning('请选择物流公司')
    return
  }
  if (!shipForm.value.deliverySn.trim()) {
    ElMessage.warning('请输入物流单号')
    return
  }

  ElMessageBox.confirm('确认发货？发货后订单将进入待验收状态。', '确认发货', {
    confirmButtonText: '确认发货',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      submitting.value = true

      try {
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 更新订单状态
        if (orderDetail.value) {
          orderDetail.value.status = ORDER_STATUS.SHIPPED
          orderDetail.value.statusName = getOrderStatusName(ORDER_STATUS.SHIPPED)
          orderDetail.value.deliveryCompany = shipForm.value.deliveryCompany
          orderDetail.value.deliverySn = shipForm.value.deliverySn
          orderDetail.value.deliveryTime = new Date().toLocaleString('zh-CN')
          orderDetail.value.deliveryRemark = shipForm.value.remark

          // 保存到localStorage（实际应该调用API）
          localStorage.setItem(`order_${orderId}`, JSON.stringify(orderDetail.value))
        }

        ElMessage.success('发货成功')
        router.push('/seller/order/list')
      } catch (error) {
        console.error('发货失败：', error)
        ElMessage.error('发货失败，请重试')
      } finally {
        submitting.value = false
      }
    })
    .catch(() => {
      // 取消
    })
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<template>
  <div class="ship-order-page">
    <div class="container">
      <!-- 面包屑 -->
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/seller/order/list' }">订单管理</el-breadcrumb-item>
        <el-breadcrumb-item>发货</el-breadcrumb-item>
      </el-breadcrumb>

      <div v-loading="loading" class="ship-content">
        <el-empty v-if="!orderDetail && !loading" description="订单不存在" />

        <div v-if="orderDetail" class="ship-sections">
          <!-- 订单信息 -->
          <div class="section order-info-section">
            <div class="section-title">订单信息</div>
            <div class="order-info">
              <div class="info-row">
                <span class="label">订单号：</span>
                <span class="value">{{ orderDetail.orderSn }}</span>
              </div>
              <div class="info-row">
                <span class="label">订单金额：</span>
                <span class="value amount">¥{{ orderDetail.payAmount?.toFixed(2) }}</span>
              </div>
              <div class="info-row">
                <span class="label">收货人：</span>
                <span class="value">{{ orderDetail.receiverName }} {{ orderDetail.receiverPhone }}</span>
              </div>
              <div class="info-row">
                <span class="label">收货地址：</span>
                <span class="value">{{ orderDetail.receiverAddress }}</span>
              </div>
            </div>
          </div>

          <!-- 商品信息 -->
          <div class="section goods-section">
            <div class="section-title">商品信息</div>
            <div class="goods-list">
              <div
                v-for="item in orderDetail.items"
                :key="item.id"
                class="goods-item"
              >
                <div class="product-image">
                  <img :src="item.productPic" :alt="item.productName" />
                </div>
                <div class="product-info">
                  <div class="product-name">{{ item.productName }}</div>
                  <div class="product-price">¥{{ item.price?.toFixed(2) }} x {{ item.quantity }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 发货信息 -->
          <div class="section ship-form-section">
            <div class="section-title">发货信息</div>
            <el-form :model="shipForm" label-width="120px">
              <el-form-item label="物流公司" required>
                <el-select
                  v-model="shipForm.deliveryCompany"
                  placeholder="请选择物流公司"
                  style="width: 100%;"
                >
                  <el-option
                    v-for="company in deliveryCompanies"
                    :key="company"
                    :label="company"
                    :value="company"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="物流单号" required>
                <el-input
                  v-model="shipForm.deliverySn"
                  placeholder="请输入物流单号"
                  maxlength="50"
                />
              </el-form-item>
              <el-form-item label="发货备注">
                <el-input
                  v-model="shipForm.remark"
                  type="textarea"
                  :rows="3"
                  placeholder="选填，如分批次发货说明等"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
            </el-form>
          </div>

          <!-- 提交按钮 -->
          <div class="section submit-section">
            <el-button
              type="primary"
              size="large"
              :loading="submitting"
              @click="handleSubmitShip"
            >
              {{ submitting ? '提交中...' : '确认发货' }}
            </el-button>
            <el-button @click="router.push('/seller/order/list')">
              取消
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.ship-order-page {
  padding: 20px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 200px);

  .breadcrumb {
    margin-bottom: 20px;
  }

  .ship-content {
    min-height: 400px;

    .ship-sections {
      .section {
        background: white;
        border-radius: $border-radius-base;
        padding: 20px;
        margin-bottom: 16px;

        .section-title {
          font-size: 16px;
          font-weight: 500;
          color: $text-primary;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid $border-lighter;
        }
      }

      .order-info-section {
        .order-info {
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

              &.amount {
                font-size: 18px;
                font-weight: bold;
                color: $primary-color;
              }
            }
          }
        }
      }

      .goods-section {
        .goods-list {
          .goods-item {
            display: flex;
            gap: 16px;
            padding: 16px;
            border: 1px solid $border-lighter;
            border-radius: $border-radius-small;
            margin-bottom: 12px;

            &:last-child {
              margin-bottom: 0;
            }

            .product-image {
              width: 100px;
              height: 100px;
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

            .product-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;

              .product-name {
                font-size: 15px;
                color: $text-primary;
                margin-bottom: 8px;
              }

              .product-price {
                font-size: 16px;
                font-weight: 500;
                color: $primary-color;
              }
            }
          }
        }
      }

      .submit-section {
        text-align: center;
        padding: 30px 20px;

        .el-button {
          margin: 0 8px;
        }
      }
    }
  }
}
</style>

