<script setup>
import { defineProps, defineEmits } from 'vue'
import { Check, WarningFilled, QuestionFilled, InfoFilled } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '确认操作'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'warning', // success, warning, info, danger
    validator: (value) => ['success', 'warning', 'info', 'danger'].includes(value)
  },
  confirmText: {
    type: String,
    default: '确认'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

// 根据类型获取图标
const getIcon = () => {
  switch (props.type) {
    case 'success':
      return Check
    case 'warning':
      return WarningFilled
    case 'danger':
      return WarningFilled
    case 'info':
      return InfoFilled
    default:
      return QuestionFilled
  }
}

// 根据类型获取颜色
const getColor = () => {
  switch (props.type) {
    case 'success':
      return '#52c41a'
    case 'warning':
      return '#faad14'
    case 'danger':
      return '#ff4d4f'
    case 'info':
      return '#1890ff'
    default:
      return '#faad14'
  }
}

// 根据类型获取背景色
const getBackgroundColor = () => {
  switch (props.type) {
    case 'success':
      return '#f0f9ff'
    case 'warning':
      return '#fffbe6'
    case 'danger':
      return '#fff1f0'
    case 'info':
      return '#e6f7ff'
    default:
      return '#fffbe6'
  }
}

// 根据类型获取边框色
const getBorderColor = () => {
  switch (props.type) {
    case 'success':
      return '#b7eb8f'
    case 'warning':
      return '#ffe58f'
    case 'danger':
      return '#ffccc7'
    case 'info':
      return '#91d5ff'
    default:
      return '#ffe58f'
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
  emit('cancel')
}

const handleConfirm = () => {
  emit('confirm')
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    width="460px"
    @close="handleClose"
    :show-close="true"
    class="confirm-dialog-wrapper"
  >
    <div class="confirm-dialog">
      <div class="icon-section">
        <div class="main-icon" :style="{ background: getColor() }">
          <el-icon :size="48" color="#fff">
            <component :is="getIcon()" />
          </el-icon>
        </div>
      </div>

      <div class="content-section">
        <h3 class="dialog-title">{{ title }}</h3>
        <p class="dialog-message">{{ message }}</p>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button size="large" @click="handleClose" :disabled="loading">
          {{ cancelText }}
        </el-button>
        <el-button
          :type="type === 'danger' ? 'danger' : type === 'success' ? 'success' : type === 'info' ? 'primary' : 'warning'"
          size="large"
          :loading="loading"
          @click="handleConfirm"
        >
          <el-icon v-if="!loading">
            <component :is="getIcon()" />
          </el-icon>
          {{ loading ? '处理中...' : confirmText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.confirm-dialog-wrapper {
  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
  }

  :deep(.el-dialog__body) {
    padding: 40px 30px 30px;
  }

  :deep(.el-dialog__footer) {
    padding: 0 30px 30px;
  }
}

.confirm-dialog {
  text-align: center;

  .icon-section {
    margin-bottom: 24px;

    .main-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
  }

  .content-section {
    .dialog-title {
      font-size: 20px;
      font-weight: 600;
      color: $text-primary;
      margin: 0 0 16px 0;
    }

    .dialog-message {
      font-size: 15px;
      line-height: 1.6;
      color: $text-secondary;
      margin: 0;
      padding: 0 20px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .el-button {
    min-width: 100px;
    height: 40px;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
}
</style>
