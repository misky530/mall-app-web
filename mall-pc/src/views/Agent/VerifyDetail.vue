<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Close, ZoomIn } from '@element-plus/icons-vue'
import { enrichOrder } from '@/utils/productApi'

const route = useRoute()
const router = useRouter()

// 订单ID
const orderId = ref(route.params.id)

// 订单详情
const orderDetail = ref(null)

// 处理中
const processing = ref(false)

// 驳回原因
const rejectReason = ref('')

// 显示驳回对话框
const showRejectDialog = ref(false)

// 图片预览
const showImagePreview = ref(false)

// 获取订单详情
const fetchOrderDetail = async () => {
  try {
    const savedOrder = localStorage.getItem(`order_${orderId.value}`)
    if (savedOrder) {
      const order = JSON.parse(savedOrder)
      // 获取完整商品信息
      orderDetail.value = await enrichOrder(order)
    } else {
      ElMessage.error('订单不存在')
      router.back()
    }
  } catch (error) {
    console.error('获取订单详情失败：', error)
    ElMessage.error('获取订单详情失败')
  }
}

// 确认收款
const handleConfirm = async () => {
  try {
    await ElMessageBox.confirm(
      '确认已收到买家的款项吗？确认后将通知卖家发货。',
      '确认收款',
      {
        confirmButtonText: '确认收款',
        cancelButtonText: '取消',
        type: 'success'
      }
    )

    processing.value = true

    // 模拟处理过程
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 更新订单状态为"待发货" (Verified_Pending_Ship)
    const updatedOrder = {
      ...orderDetail.value,
      status: 1,
      statusName: '待发货',
      verifyTime: new Date().toLocaleString('zh-CN'),
      verifyStatus: 'approved'
    }

    localStorage.setItem(`order_${orderId.value}`, JSON.stringify(updatedOrder))

    ElMessage.success('收款确认成功，已通知卖家发货')

    // 返回列表页
    router.push('/agent/pending-verify')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('确认失败：', error)
      ElMessage.error('确认失败，请重试')
    }
  } finally {
    processing.value = false
  }
}

// 驳回付款
const handleReject = () => {
  showRejectDialog.value = true
  rejectReason.value = ''
}

// 确认驳回
const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }

  processing.value = true

  try {
    // 模拟处理过程
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 更新订单状态为"付款驳回" (Rejected)
    const updatedOrder = {
      ...orderDetail.value,
      status: -1,
      statusName: '付款驳回',
      rejectTime: new Date().toLocaleString('zh-CN'),
      rejectReason: rejectReason.value,
      verifyStatus: 'rejected'
    }

    localStorage.setItem(`order_${orderId.value}`, JSON.stringify(updatedOrder))

    ElMessage.success('已驳回付款凭证')

    showRejectDialog.value = false

    // 返回列表页
    router.push('/agent/pending-verify')
  } catch (error) {
    console.error('驳回失败：', error)
    ElMessage.error('驳回失败，请重试')
  } finally {
    processing.value = false
  }
}

// 预览付款凭证
const previewVoucher = () => {
  showImagePreview.value = true
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<template>
  <div class="verify-detail-page">
    <div class="container">
      <div v-if="orderDetail">
        <!-- 页面标题 -->
        <div class="page-header">
          <h2>确认收款</h2>
          <el-button @click="router.back()">返回列表</el-button>
        </div>

        <!-- 订单信息 -->
        <div class="order-info-section">
          <h3>订单信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>订单号：</label>
              <span>{{ orderDetail.orderSn }}</span>
            </div>
            <div class="info-item">
              <label>订单状态：</label>
              <el-tag type="warning">{{ orderDetail.statusName }}</el-tag>
            </div>
            <div class="info-item">
              <label>创建时间：</label>
              <span>{{ orderDetail.createTime }}</span>
            </div>
            <div class="info-item">
              <label>提交凭证时间：</label>
              <span>{{ orderDetail.submitVoucherTime }}</span>
            </div>
            <div class="info-item">
              <label>支付金额：</label>
              <span class="amount">¥{{ orderDetail.payAmount?.toFixed(2) }}</span>
            </div>
            <div class="info-item">
              <label>支付方式：</label>
              <span>{{ orderDetail.payTypeName }}</span>
            </div>
          </div>
        </div>

        <!-- 收货信息 -->
        <div class="receiver-info-section">
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
              <span>
                {{ orderDetail.receiverProvince }}
                {{ orderDetail.receiverCity }}
                {{ orderDetail.receiverRegion }}
                {{ orderDetail.receiverDetailAddress }}
              </span>
            </div>
          </div>
        </div>

        <!-- 商品信息 -->
        <div class="products-section">
          <h3>商品清单</h3>
          <div class="product-list">
            <div
              v-for="(item, index) in orderDetail.items"
              :key="index"
              class="product-item"
            >
              <img :src="item.productPic || item.pic" :alt="item.productName || item.name" />
              <div class="product-info">
                <div class="product-name">{{ item.productName || item.name }}</div>
                <div class="product-spec">规格：默认</div>
              </div>
              <div class="product-price">¥{{ item.price?.toFixed(2) }}</div>
              <div class="product-quantity">x{{ item.quantity }}</div>
              <div class="product-total">¥{{ (item.price * item.quantity)?.toFixed(2) }}</div>
            </div>
          </div>
        </div>

        <!-- 付款凭证 -->
        <div class="voucher-section">
          <h3>付款凭证</h3>
          <div class="voucher-preview" @click="previewVoucher">
            <img :src="orderDetail.paymentVoucher" alt="付款凭证" />
            <div class="preview-mask">
              <el-icon :size="40"><ZoomIn /></el-icon>
              <div>点击查看大图</div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-section">
          <el-button
            size="large"
            @click="router.back()"
          >
            取消
          </el-button>
          <el-button
            type="danger"
            size="large"
            :icon="Close"
            :loading="processing"
            @click="handleReject"
          >
            驳回
          </el-button>
          <el-button
            type="success"
            size="large"
            :icon="Check"
            :loading="processing"
            @click="handleConfirm"
          >
            确认收款
          </el-button>
        </div>
      </div>

      <!-- 驳回原因对话框 -->
      <el-dialog
        v-model="showRejectDialog"
        title="驳回付款凭证"
        width="500px"
      >
        <el-form label-position="top">
          <el-form-item label="驳回原因">
            <el-input
              v-model="rejectReason"
              type="textarea"
              :rows="4"
              placeholder="请填写驳回原因，将通知买家重新提交凭证"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showRejectDialog = false">取消</el-button>
          <el-button
            type="primary"
            :loading="processing"
            @click="confirmReject"
          >
            确认驳回
          </el-button>
        </template>
      </el-dialog>

      <!-- 图片预览对话框 -->
      <el-dialog
        v-model="showImagePreview"
        title="付款凭证"
        width="800px"
      >
        <div class="image-preview">
          <img :src="orderDetail?.paymentVoucher" alt="付款凭证" />
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.verify-detail-page {
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

  .order-info-section,
  .receiver-info-section,
  .products-section,
  .voucher-section {
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
            font-size: 18px;
          }
        }
      }
    }
  }

  .products-section {
    .product-list {
      .product-item {
        display: flex;
        align-items: center;
        padding: 16px;
        border: 1px solid $border-light;
        border-radius: $border-radius-base;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 4px;
          margin-right: 16px;
        }

        .product-info {
          flex: 1;

          .product-name {
            font-size: 14px;
            color: $text-primary;
            margin-bottom: 8px;
          }

          .product-spec {
            font-size: 12px;
            color: $text-secondary;
          }
        }

        .product-price,
        .product-quantity,
        .product-total {
          font-size: 14px;
          color: $text-primary;
          min-width: 100px;
          text-align: right;
        }

        .product-total {
          font-weight: 500;
          color: $primary-color;
        }
      }
    }
  }

  .voucher-section {
    .voucher-preview {
      width: 400px;
      height: 400px;
      border: 2px solid $border-light;
      border-radius: $border-radius-base;
      overflow: hidden;
      position: relative;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: $primary-color;

        .preview-mask {
          opacity: 1;
        }
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .preview-mask {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        opacity: 0;
        transition: opacity 0.3s;

        div {
          margin-top: 12px;
          font-size: 14px;
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
    gap: 20px;

    .el-button {
      min-width: 150px;
      height: 50px;
      font-size: 16px;
    }
  }

  .image-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    max-height: 600px;

    img {
      max-width: 100%;
      max-height: 600px;
      object-fit: contain;
    }
  }
}
</style>
