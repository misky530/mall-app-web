<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Ship, Document, View } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 订单ID
const orderId = ref(route.params.id)

// 订单详情
const orderDetail = ref(null)

// 物流信息
const shippingInfo = ref({
  logisticsCompany: '',
  trackingNumber: ''
})

// 显示发货对话框
const showShipDialog = ref(false)

// 提交中
const submitting = ref(false)

// 获取订单详情
const fetchOrderDetail = () => {
  try {
    const savedOrder = localStorage.getItem(`order_${orderId.value}`)
    if (savedOrder) {
      orderDetail.value = JSON.parse(savedOrder)
    } else {
      ElMessage.error('订单不存在')
      router.back()
    }
  } catch (error) {
    console.error('获取订单详情失败：', error)
    ElMessage.error('获取订单详情失败')
  }
}

// 查看付款凭证
const viewPaymentVoucher = () => {
  if (orderDetail.value?.paymentVoucher) {
    window.open(orderDetail.value.paymentVoucher, '_blank')
  } else {
    ElMessage.warning('暂无付款凭证')
  }
}

// 显示发货对话框
const handleShowShipDialog = () => {
  if (orderDetail.value.status !== 1) {
    ElMessage.warning('当前订单状态不允许发货')
    return
  }
  showShipDialog.value = true
}

// 确认发货
const handleConfirmShip = async () => {
  if (!shippingInfo.value.logisticsCompany || !shippingInfo.value.trackingNumber) {
    ElMessage.warning('请填写完整的物流信息')
    return
  }

  submitting.value = true

  try {
    // 模拟提交过程
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 更新订单状态为"已发货" (Shipped)
    const updatedOrder = {
      ...orderDetail.value,
      status: 2,
      statusName: '已发货',
      shipTime: new Date().toLocaleString('zh-CN'),
      logisticsCompany: shippingInfo.value.logisticsCompany,
      trackingNumber: shippingInfo.value.trackingNumber
    }

    localStorage.setItem(`order_${orderId.value}`, JSON.stringify(updatedOrder))

    ElMessage.success('发货成功，等待买家验收')

    showShipDialog.value = false
    orderDetail.value = updatedOrder
  } catch (error) {
    console.error('发货失败：', error)
    ElMessage.error('发货失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<template>
  <div class="seller-order-detail-page">
    <div class="container">
      <div v-if="orderDetail">
        <!-- 页面标题 -->
        <div class="page-header">
          <h2>订单详情</h2>
          <el-button @click="router.back()">返回列表</el-button>
        </div>

        <!-- 订单状态流程 -->
        <div class="order-status-section">
          <el-steps :active="orderDetail.status === 1 ? 1 : orderDetail.status === 2 ? 2 : orderDetail.status === 3 ? 3 : 4" align-center>
            <el-step title="经办人确认收款" :description="orderDetail.verifyTime || '等待确认'" />
            <el-step title="卖家发货" :description="orderDetail.shipTime || '等待发货'" />
            <el-step title="买家验收" :description="orderDetail.acceptanceTime || '等待验收'" />
            <el-step title="经办人结算" :description="orderDetail.settlementTime || '等待结算'" />
          </el-steps>
        </div>

        <!-- 订单基本信息 -->
        <div class="order-info-section">
          <h3>订单信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>订单号：</label>
              <span>{{ orderDetail.orderSn }}</span>
            </div>
            <div class="info-item">
              <label>订单状态：</label>
              <el-tag
                :type="orderDetail.status === 1 ? 'warning' : orderDetail.status === 2 ? 'primary' : orderDetail.status === 3 ? 'success' : 'info'"
              >
                {{ orderDetail.statusName }}
              </el-tag>
            </div>
            <div class="info-item">
              <label>订单金额：</label>
              <span class="amount">¥{{ orderDetail.payAmount?.toFixed(2) }}</span>
            </div>
            <div class="info-item">
              <label>创建时间：</label>
              <span>{{ orderDetail.createTime }}</span>
            </div>
            <div class="info-item">
              <label>支付方式：</label>
              <span>{{ orderDetail.payTypeName }}</span>
            </div>
            <div class="info-item">
              <label>付款凭证：</label>
              <el-button
                v-if="orderDetail.paymentVoucher"
                link
                type="primary"
                :icon="View"
                @click="viewPaymentVoucher"
              >
                查看凭证
              </el-button>
              <span v-else class="text-placeholder">暂无</span>
            </div>
          </div>
        </div>

        <!-- 收货信息 -->
        <div class="receiver-section">
          <h3>收货信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>收货人：</label>
              <span>{{ orderDetail.receiverName }}</span>
            </div>
            <div class="info-item">
              <label>联系电话：</label>
              <span>{{ orderDetail.receiverPhone }}</span>
            </div>
            <div class="info-item full-width">
              <label>收货地址：</label>
              <span>{{ orderDetail.receiverProvince }} {{ orderDetail.receiverCity }} {{ orderDetail.receiverRegion }} {{ orderDetail.receiverDetailAddress }}</span>
            </div>
          </div>
        </div>

        <!-- 物流信息 -->
        <div v-if="orderDetail.status >= 2" class="shipping-section">
          <h3>
            <el-icon style="margin-right: 8px;"><Ship /></el-icon>
            物流信息
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <label>物流公司：</label>
              <span>{{ orderDetail.logisticsCompany }}</span>
            </div>
            <div class="info-item">
              <label>物流单号：</label>
              <span class="tracking-number">{{ orderDetail.trackingNumber }}</span>
              <el-button
                link
                type="primary"
                size="small"
                @click="() => {
                  navigator.clipboard.writeText(orderDetail.trackingNumber)
                  ElMessage.success('单号已复制')
                }"
              >
                复制
              </el-button>
            </div>
            <div class="info-item">
              <label>发货时间：</label>
              <span>{{ orderDetail.shipTime }}</span>
            </div>
          </div>
        </div>

        <!-- 商品列表 -->
        <div class="product-section">
          <h3>商品清单</h3>
          <div class="product-list">
            <div
              v-for="(item, index) in orderDetail.items"
              :key="index"
              class="product-item"
            >
              <img :src="item.productPic || item.pic" :alt="item.productName || item.name" class="product-image" />
              <div class="product-info">
                <div class="product-name">{{ item.productName || item.name }}</div>
                <div class="product-specs">
                  <span class="spec">规格：{{ item.productAttr || item.spec || '标准' }}</span>
                </div>
              </div>
              <div class="product-price">¥{{ item.productPrice?.toFixed(2) || item.price?.toFixed(2) }}</div>
              <div class="product-quantity">x{{ item.productQuantity || item.quantity }}</div>
              <div class="product-total">¥{{ ((item.productPrice || item.price) * (item.productQuantity || item.quantity)).toFixed(2) }}</div>
            </div>
          </div>

          <div class="order-summary">
            <div class="summary-item">
              <span class="label">商品总额：</span>
              <span class="value">¥{{ orderDetail.totalAmount?.toFixed(2) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">运费：</span>
              <span class="value">¥{{ orderDetail.freightAmount?.toFixed(2) }}</span>
            </div>
            <div class="summary-item total">
              <span class="label">订单总额：</span>
              <span class="value">¥{{ orderDetail.payAmount?.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div v-if="orderDetail.status === 1" class="action-section">
          <el-button
            type="success"
            size="large"
            :icon="Ship"
            @click="handleShowShipDialog"
          >
            确认发货
          </el-button>
        </div>

        <!-- 发货对话框 -->
        <el-dialog
          v-model="showShipDialog"
          title="填写物流信息"
          width="500px"
        >
          <el-form :model="shippingInfo" label-width="100px">
            <el-form-item label="物流公司" required>
              <el-select
                v-model="shippingInfo.logisticsCompany"
                placeholder="请选择物流公司"
                style="width: 100%;"
              >
                <el-option label="顺丰速运" value="顺丰速运" />
                <el-option label="中通快递" value="中通快递" />
                <el-option label="圆通速递" value="圆通速递" />
                <el-option label="申通快递" value="申通快递" />
                <el-option label="韵达快递" value="韵达快递" />
                <el-option label="德邦物流" value="德邦物流" />
                <el-option label="京东物流" value="京东物流" />
                <el-option label="EMS" value="EMS" />
              </el-select>
            </el-form-item>
            <el-form-item label="物流单号" required>
              <el-input
                v-model="shippingInfo.trackingNumber"
                placeholder="请输入物流单号"
                clearable
              />
            </el-form-item>
          </el-form>

          <template #footer>
            <span class="dialog-footer">
              <el-button @click="showShipDialog = false">取消</el-button>
              <el-button
                type="primary"
                :loading="submitting"
                @click="handleConfirmShip"
              >
                {{ submitting ? '提交中...' : '确认发货' }}
              </el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.seller-order-detail-page {
  min-height: calc(100vh - 200px);
  background: #f5f5f5;
  padding: 40px 0;

  .page-header {
    background: white;
    padding: 20px 30px;
    margin-bottom: 20px;
    border-radius: $border-radius-base;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      font-size: 24px;
      font-weight: bold;
      color: $text-primary;
      margin: 0;
    }
  }

  .order-status-section {
    background: white;
    padding: 40px 30px;
    margin-bottom: 20px;
    border-radius: $border-radius-base;
  }

  .order-info-section,
  .receiver-section,
  .shipping-section,
  .product-section {
    background: white;
    padding: 30px;
    margin-bottom: 20px;
    border-radius: $border-radius-base;

    h3 {
      font-size: 18px;
      font-weight: 500;
      color: $text-primary;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid $border-light;
      display: flex;
      align-items: center;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;

      .info-item {
        display: flex;
        align-items: center;

        &.full-width {
          grid-column: 1 / -1;
        }

        label {
          min-width: 120px;
          font-size: 14px;
          color: $text-secondary;
        }

        span {
          font-size: 14px;
          color: $text-primary;

          &.amount {
            color: $primary-color;
            font-weight: 500;
            font-size: 20px;
          }

          &.tracking-number {
            font-family: 'Courier New', monospace;
            color: $primary-color;
            font-weight: 500;
          }

          &.text-placeholder {
            color: $text-placeholder;
          }
        }
      }
    }
  }

  .product-section {
    .product-list {
      margin-bottom: 20px;

      .product-item {
        display: flex;
        align-items: center;
        padding: 16px 0;
        border-bottom: 1px solid $border-light;

        &:last-child {
          border-bottom: none;
        }

        .product-image {
          width: 80px;
          height: 80px;
          border-radius: 4px;
          object-fit: cover;
          margin-right: 16px;
          border: 1px solid $border-light;
        }

        .product-info {
          flex: 1;
          min-width: 0;

          .product-name {
            font-size: 14px;
            color: $text-primary;
            margin-bottom: 8px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .product-specs {
            font-size: 12px;
            color: $text-secondary;

            .spec {
              margin-right: 12px;
            }
          }
        }

        .product-price {
          width: 100px;
          text-align: right;
          font-size: 14px;
          color: $text-primary;
          margin-right: 30px;
        }

        .product-quantity {
          width: 60px;
          text-align: center;
          font-size: 14px;
          color: $text-secondary;
          margin-right: 30px;
        }

        .product-total {
          width: 100px;
          text-align: right;
          font-size: 16px;
          color: $primary-color;
          font-weight: 500;
        }
      }
    }

    .order-summary {
      border-top: 2px solid $border-light;
      padding-top: 20px;

      .summary-item {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-bottom: 12px;

        .label {
          font-size: 14px;
          color: $text-secondary;
          margin-right: 20px;
        }

        .value {
          font-size: 14px;
          color: $text-primary;
          min-width: 100px;
          text-align: right;
        }

        &.total {
          margin-top: 8px;
          padding-top: 12px;
          border-top: 1px dashed $border-light;

          .label {
            font-size: 16px;
            font-weight: 500;
            color: $text-primary;
          }

          .value {
            font-size: 20px;
            font-weight: bold;
            color: $primary-color;
          }
        }
      }
    }
  }

  .action-section {
    background: white;
    padding: 30px;
    border-radius: $border-radius-base;
    display: flex;
    justify-content: center;

    .el-button {
      min-width: 200px;
      height: 50px;
      font-size: 16px;
    }
  }
}
</style>
