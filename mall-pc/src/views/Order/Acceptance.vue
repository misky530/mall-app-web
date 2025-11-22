<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Plus, Delete, Warning, Checked } from '@element-plus/icons-vue'
import { ORDER_STATUS, getOrderStatusName } from '@/utils/orderStatus'

const route = useRoute()
const router = useRouter()

// 订单ID
const orderId = route.params.id

// 订单详情
const orderDetail = ref(null)
// 加载状态
const loading = ref(false)

// 验收结果：pass(通过), fail(不通过)
const inspectionResult = ref('')
// 验收失败原因
const failReason = ref('')
// 问题货物照片/视频
const problemImages = ref([])
// 提交中
const submitting = ref(false)

// 获取订单详情
const fetchOrderDetail = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    const savedOrder = localStorage.getItem(`order_${orderId}`)
    if (savedOrder) {
      orderDetail.value = JSON.parse(savedOrder)
    } else {
      // Mock数据
      orderDetail.value = {
        id: orderId,
        orderSn: `ORD${orderId}`,
        status: ORDER_STATUS.SHIPPED,
        statusName: getOrderStatusName(ORDER_STATUS.SHIPPED),
        createTime: '2024-01-20 14:30:25',
        payTime: '2024-01-20 14:32:10',
        deliveryTime: '2024-01-21 10:20:00',
        totalAmount: 627.00,
        freightAmount: 10.00,
        payAmount: 637.00,
        items: [
          {
            id: 1,
            productName: '示例商品',
            productPic: 'https://via.placeholder.com/80',
            price: 627.00,
            quantity: 1
          }
        ],
        deliveryCompany: '顺丰速运',
        deliverySn: 'SF1234567890'
      }
    }
  } catch (error) {
    console.error('获取订单详情失败：', error)
    ElMessage.error('获取订单详情失败')
  } finally {
    loading.value = false
  }
}

// 上传问题图片
const handleUploadImage = (file) => {
  const fileUrl = URL.createObjectURL(file.raw)
  problemImages.value.push({
    uid: Date.now(),
    name: file.name,
    url: fileUrl,
    raw: file.raw
  })
  return false
}

// 删除问题图片
const handleRemoveImage = (file) => {
  const index = problemImages.value.findIndex(item => item.uid === file.uid)
  if (index > -1) {
    problemImages.value.splice(index, 1)
  }
}

// 提交验收结果
const handleSubmitInspection = async () => {
  if (!inspectionResult.value) {
    ElMessage.warning('请选择验收结果')
    return
  }

  if (inspectionResult.value === 'fail') {
    if (!failReason.value.trim()) {
      ElMessage.warning('请填写验收失败原因')
      return
    }
    if (problemImages.value.length === 0) {
      ElMessage.warning('请上传问题货物照片或视频')
      return
    }
  }

  const confirmText = inspectionResult.value === 'pass'
    ? '确认验收通过？验收通过后，资金将解冻给卖家。'
    : '确认提交验收失败申请？提交后需要等待经办人处理。'

  ElMessageBox.confirm(confirmText, '确认提交', {
    confirmButtonText: '确认提交',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      submitting.value = true

      try {
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 更新订单状态
        if (orderDetail.value) {
          if (inspectionResult.value === 'pass') {
            orderDetail.value.status = ORDER_STATUS.COMPLETED
            orderDetail.value.statusName = getOrderStatusName(ORDER_STATUS.COMPLETED)
            orderDetail.value.inspectionTime = new Date().toLocaleString('zh-CN')
            orderDetail.value.inspectionResult = 'pass'
          } else {
            orderDetail.value.status = ORDER_STATUS.INSPECTION_FAIL
            orderDetail.value.statusName = getOrderStatusName(ORDER_STATUS.INSPECTION_FAIL)
            orderDetail.value.inspectionTime = new Date().toLocaleString('zh-CN')
            orderDetail.value.inspectionResult = 'fail'
            orderDetail.value.failReason = failReason.value
            orderDetail.value.problemImages = problemImages.value.map(img => img.url)
          }

          localStorage.setItem(`order_${orderId}`, JSON.stringify(orderDetail.value))
        }

        ElMessage.success(
          inspectionResult.value === 'pass'
            ? '验收通过，资金将解冻给卖家'
            : '验收失败申请已提交，请等待经办人处理'
        )

        router.push(`/order/detail/${orderId}`)
      } catch (error) {
        console.error('提交验收结果失败：', error)
        ElMessage.error('提交失败，请重试')
      } finally {
        submitting.value = false
      }
    })
    .catch(() => {
      // 取消
    })
}

// 图片加载错误处理
const handleImageError = (e) => {
  e.target.src = 'https://via.placeholder.com/100?text=暂无图片'
  e.target.onerror = null
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<template>
  <div class="acceptance-page">
    <div class="container">
      <!-- 面包屑 -->
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/order/list' }">我的订单</el-breadcrumb-item>
        <el-breadcrumb-item>商品验收</el-breadcrumb-item>
      </el-breadcrumb>

      <div v-loading="loading" class="acceptance-content">
        <el-empty v-if="!orderDetail && !loading" description="订单不存在" />

        <div v-if="orderDetail" class="acceptance-sections">
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
              <div class="info-row" v-if="orderDetail.deliveryCompany">
                <span class="label">物流公司：</span>
                <span class="value">{{ orderDetail.deliveryCompany }}</span>
              </div>
              <div class="info-row" v-if="orderDetail.deliverySn">
                <span class="label">物流单号：</span>
                <span class="value">{{ orderDetail.deliverySn }}</span>
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
                  <img
                    :src="item.productPic || item.pic || 'https://via.placeholder.com/100'"
                    :alt="item.productName"
                    @error="handleImageError"
                  />
                </div>
                <div class="product-info">
                  <div class="product-name">{{ item.productName }}</div>
                  <div class="product-price">¥{{ item.price?.toFixed(2) }} x {{ item.quantity }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 验收操作 -->
          <div class="section inspection-section">
            <div class="section-title">验收操作</div>

            <div class="inspection-options">
              <div class="options-grid">
                <div
                  class="option-card"
                  :class="{ active: inspectionResult === 'pass' }"
                  @click="inspectionResult = 'pass'"
                >
                  <div class="option-icon success">
                    <el-icon :size="48"><Checked /></el-icon>
                  </div>
                  <div class="option-content">
                    <div class="option-title">验收通过</div>
                    <div class="option-desc">货物完好，符合订单要求</div>
                  </div>
                  <div class="option-radio">
                    <el-radio v-model="inspectionResult" label="pass" />
                  </div>
                </div>
                <div
                  class="option-card"
                  :class="{ active: inspectionResult === 'fail' }"
                  @click="inspectionResult = 'fail'"
                >
                  <div class="option-icon warning">
                    <el-icon :size="48"><Warning /></el-icon>
                  </div>
                  <div class="option-content">
                    <div class="option-title">验收失败</div>
                    <div class="option-desc">货物存在问题，需要退货或售后</div>
                  </div>
                  <div class="option-radio">
                    <el-radio v-model="inspectionResult" label="fail" />
                  </div>
                </div>
              </div>
            </div>

            <!-- 验收失败详情 -->
            <div v-if="inspectionResult === 'fail'" class="fail-details">
              <el-alert
                type="warning"
                :closable="false"
                show-icon
                style="margin-bottom: 20px;"
              >
                <template #title>
                  <div>
                    <p>验收失败后，需要填写失败原因并上传问题货物照片/视频作为证据。</p>
                    <p>经办人将根据您提供的信息进行仲裁处理。</p>
                  </div>
                </template>
              </el-alert>

              <el-form label-width="120px">
                <el-form-item label="失败原因" required>
                  <el-input
                    v-model="failReason"
                    type="textarea"
                    :rows="4"
                    placeholder="请详细描述货物存在的问题，如：货物损坏、数量不符、质量问题等"
                    maxlength="500"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item label="问题照片/视频" required>
                  <el-upload
                    :file-list="problemImages"
                    :on-preview="() => {}"
                    :on-remove="handleRemoveImage"
                    :before-upload="handleUploadImage"
                    :limit="10"
                    accept="image/*,video/*"
                    list-type="picture-card"
                  >
                    <el-icon class="upload-icon"><Plus /></el-icon>
                  </el-upload>
                  <div class="upload-tips">
                    <p>支持上传图片（JPG、PNG）或视频文件，最多10个文件</p>
                    <p>请上传清晰的问题货物照片或视频，作为验收失败的证据</p>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="section submit-section">
            <el-button
              type="primary"
              size="large"
              :loading="submitting"
              :disabled="!inspectionResult"
              @click="handleSubmitInspection"
            >
              {{ submitting ? '提交中...' : '提交验收结果' }}
            </el-button>
            <el-button @click="router.push(`/order/detail/${orderId}`)">
              返回订单详情
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.acceptance-page {
  padding: 20px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 200px);

  .breadcrumb {
    margin-bottom: 20px;
  }

  .acceptance-content {
    min-height: 400px;

    .acceptance-sections {
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

      .inspection-section {
        .inspection-options {
          margin-bottom: 24px;

          .options-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            width: 100%;

            @media (max-width: 768px) {
              grid-template-columns: 1fr;
            }

            .option-card {
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 32px 24px;
              border: 2px solid $border-light;
              border-radius: $border-radius-large;
              background: white;
              cursor: pointer;
              transition: all 0.3s;
              text-align: center;

              &:hover {
                border-color: $primary-color;
                background: rgba($primary-color, 0.02);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba($primary-color, 0.1);
              }

              &.active {
                border-color: $primary-color;
                background: rgba($primary-color, 0.05);
                box-shadow: 0 4px 16px rgba($primary-color, 0.15);
              }

              .option-icon {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 16px;

                &.success {
                  background: rgba($success-color, 0.1);
                  color: $success-color;
                }

                &.warning {
                  background: rgba($warning-color, 0.1);
                  color: $warning-color;
                }
              }

              .option-content {
                flex: 1;
                margin-bottom: 12px;

                .option-title {
                  font-size: 18px;
                  font-weight: 600;
                  color: $text-primary;
                  margin-bottom: 8px;
                }

                .option-desc {
                  font-size: 14px;
                  color: $text-secondary;
                  line-height: 1.5;
                }
              }

              .option-radio {
                position: absolute;
                top: 12px;
                right: 12px;
              }
            }
          }
        }

        .fail-details {
          .upload-icon {
            font-size: 28px;
            color: $text-secondary;
          }

          .upload-tips {
            margin-top: 12px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: $border-radius-small;
            font-size: 13px;
            color: $text-secondary;
            line-height: 1.8;

            p {
              margin: 4px 0;
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

// 响应式
@media (max-width: 768px) {
  .inspection-options .el-radio-group {
    .el-radio {
      padding: 16px !important;
    }
  }

  .submit-section {
    .el-button {
      width: 100%;
      margin: 8px 0 !important;
    }
  }
}
</style>

