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
    width="480px"
    @close="handleClose"
    :show-close="true"
    class="confirm-dialog-wrapper"
  >
    <template #header>
      <div class="dialog-header" :style="{ background: `linear-gradient(135deg, ${getBackgroundColor()} 0%, ${getBackgroundColor()} 100%)` }">
        <div class="header-icon" :style="{ boxShadow: `0 2px 8px ${getColor()}33` }">
          <el-icon :size="28" :color="getColor()">
            <component :is="getIcon()" />
          </el-icon>
        </div>
        <div class="header-text">
          <h3>{{ title }}</h3>
        </div>
      </div>
    </template>

    <div class="confirm-dialog">
      <div class="message-box" :style="{ background: getBackgroundColor(), borderColor: getBorderColor() }">
        <div class="message-icon">
          <el-icon :size="24" :color="getColor()">
            <component :is="getIcon()" />
          </el-icon>
        </div>
        <div class="message-text">
          {{ message }}
        </div>
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
    padding: 30px;
  }

  :deep(.el-dialog__footer) {
    padding: 20px 30px;
    border-top: 1px solid $border-lighter;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px 30px;
    border-bottom: 1px solid $border-lighter;

    .header-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-text {
      h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: $text-primary;
      }
    }
  }
}

.confirm-dialog {
  .message-box {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px 24px;
    border-radius: 8px;
    border: 1px solid;

    .message-icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 50%;
    }

    .message-text {
      flex: 1;
      font-size: 15px;
      line-height: 1.6;
      color: $text-primary;
      padding-top: 8px;
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
