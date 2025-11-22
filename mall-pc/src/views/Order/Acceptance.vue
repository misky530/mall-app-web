<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const orderId = route.params.id
const order = ref(null)
const loading = ref(false)

// "验收失败" 对话框
const disputeDialogVisible = ref(false)
const disputeForm = ref({
  reason: '',
  proofs: []
})
const disputeFormRef = ref(null)
const submittingDispute = ref(false)

const disputeRules = {
  reason: [{ required: true, message: '请输入验收失败的原因', trigger: 'blur' }],
  proofs: [{ required: true, message: '请上传相关凭证图片', trigger: 'change' }]
}

// 获取订单信息
const fetchOrder = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 300)) // 模拟网络延迟
  const orderData = localStorage.getItem(`order_${orderId}`)
  if (orderData) {
    order.value = JSON.parse(orderData)
  } else {
    ElMessage.error('未找到订单信息')
    router.push('/order/list')
  }
  loading.value = false
}

// 验收通过
const handleAcceptancePass = () => {
  ElMessageBox.confirm('确认货物完好无损并验收通过吗？此操作不可逆。', '确认验收', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'success'
  }).then(async () => {
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const updatedOrder = {
      ...order.value,
      status: 6, // 待结算
      statusName: '验收通过/待结算'
    }
    localStorage.setItem(`order_${orderId}`, JSON.stringify(updatedOrder))
    order.value = updatedOrder
    
    ElMessage.success('验收成功！')
    router.push(`/order/detail/${orderId}`)
  }).catch(() => {
    ElMessage.info('已取消')
  })
}

// 打开验收失败对话框
const openDisputeDialog = () => {
  disputeDialogVisible.value = true
}

// 处理上传文件变化
const handleProofChange = (file, fileList) => {
  disputeForm.value.proofs = fileList
}

// 提交验收失败申请
const submitDispute = async () => {
  if (!disputeFormRef.value) return
  await disputeFormRef.value.validate(async (valid) => {
    if (valid) {
      submittingDispute.value = true
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const updatedOrder = {
        ...order.value,
        status: 5, // 维权中
        statusName: '验收不通过/维权中',
        disputeReason: disputeForm.value.reason
      }
      localStorage.setItem(`order_${orderId}`, JSON.stringify(updatedOrder))
      order.value = updatedOrder
      
      submittingDispute.value = false
      disputeDialogVisible.value = false
      ElMessage.success('您的售后申请已提交，请等待经办人处理。')
      router.push(`/order/detail/${orderId}`)
    }
  })
}

onMounted(() => {
  fetchOrder()
})
</script>

<template>
  <div class="acceptance-page">
    <div class="container" v-if="order" v-loading="loading">
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/order/list' }">我的订单</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: `/order/detail/${orderId}` }">订单详情</el-breadcrumb-item>
        <el-breadcrumb-item>商品验收</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="acceptance-content">
        <div class="section">
          <div class="section-title">验收订单：{{ order.orderSn }}</div>
          <div class="product-list">
            <div v-for="item in order.items" :key="item.id" class="product-item">
              <img :src="item.productPic" class="product-image" />
              <div class="product-info">
                <p>{{ item.productName }}</p>
                <p class="sku">{{ item.productSku }}</p>
              </div>
              <div class="product-quantity">x{{ item.quantity }}</div>
            </div>
          </div>
        </div>

        <div class="section actions-section">
          <div class="section-title">请确认您的货物</div>
          <p class="actions-desc">
            请仔细检查收到的货物是否完好、数量是否正确。您的确认将作为平台结算给卖家的依据。
          </p>
          <div class="action-buttons">
            <el-button type="success" size="large" @click="handleAcceptancePass">
              验收通过，货物完好
            </el-button>
            <el-button type="danger" size="large" @click="openDisputeDialog">
              验收失败，申请售后
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 验收失败对话框 -->
    <el-dialog v-model="disputeDialogVisible" title="申请售后 (验收失败)" width="500px">
      <el-form :model="disputeForm" :rules="disputeRules" ref="disputeFormRef" label-position="top">
        <el-form-item label="失败原因" prop="reason">
          <el-input
            v-model="disputeForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请详细描述您遇到的问题，例如：货物破损、数量不符等。"
          />
        </el-form-item>
        <el-form-item label="上传凭证 (图片)" prop="proofs">
          <el-upload
            drag
            action="#"
            :auto-upload="false"
            @change="handleProofChange"
            multiple
            list-type="picture"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="disputeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingDispute" @click="submitDispute">
          确认提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.acceptance-page {
  padding: 20px 0;
  background: #f5f5f5;
}
.breadcrumb {
  margin-bottom: 20px;
}
.section {
  background: white;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}
.section-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}
.product-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  &:last-child {
    border-bottom: none;
  }
}
.product-image {
  width: 60px;
  height: 60px;
  margin-right: 15px;
  border-radius: 4px;
}
.product-info {
  flex-grow: 1;
  .sku {
    font-size: 12px;
    color: #999;
  }
}
.actions-section {
  text-align: center;
}
.actions-desc {
  color: #666;
  margin-bottom: 30px;
}
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
}
</style>
