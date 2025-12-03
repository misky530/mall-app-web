<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ShoppingCart } from '@element-plus/icons-vue'
import { useCartStore } from '@/stores/cart'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const cartStore = useCartStore()

// 跳转到商品详情
const goToDetail = () => {
  router.push(`/product/detail/${props.product.id}`)
}

// 格式化价格
const formattedPrice = computed(() => {
  return props.product.price ? `¥${props.product.price.toFixed(2)}` : '¥0.00'
})

// 格式化原价
const formattedOriginalPrice = computed(() => {
  return props.product.originalPrice ? `¥${props.product.originalPrice.toFixed(2)}` : ''
})

// 图片加载错误处理
const handleImageError = (e) => {
  // 使用灰色占位背景
  e.target.style.display = 'none'
  e.target.parentElement.style.background = '#f0f0f0'
  e.target.parentElement.innerHTML = `
    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #999; font-size: 14px;">
      <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 8px;">📦</div>
        <div>暂无图片</div>
      </div>
    </div>
  `
}

// 加入购物车
const handleAddToCart = () => {
  cartStore.addItem({
    productId: props.product.id,
    skuId: props.product.skuId || props.product.id,
    quantity: 1,
    // 添加完整的商品信息
    productName: props.product.name,
    name: props.product.name,
    productPic: props.product.pic,
    pic: props.product.pic,
    price: props.product.price,
    productSku: props.product.subTitle || ''
  })
}
</script>

<template>
  <div class="product-card" @click="goToDetail">
    <!-- 商品图片 -->
    <div class="product-image">
      <img
        :src="product.pic || '/placeholder-product.png'"
        :alt="product.name"
        @error="handleImageError"
      />
      <div class="product-tag" v-if="product.newStatus === 1">
        <el-tag type="danger" size="small">新品</el-tag>
      </div>
      <div class="product-tag" v-if="product.recommendStatus === 1">
        <el-tag type="warning" size="small">推荐</el-tag>
      </div>
    </div>

    <!-- 商品信息 -->
    <div class="product-info">
      <h3 class="product-name ellipsis-2">{{ product.name }}</h3>
      <p class="product-subtitle ellipsis" v-if="product.subTitle">{{ product.subTitle }}</p>

      <!-- 价格 -->
      <div class="product-price">
        <span class="current-price">{{ formattedPrice }}</span>
        <span class="original-price" v-if="formattedOriginalPrice">{{ formattedOriginalPrice }}</span>
      </div>

      <!-- 销量和评价 -->
      <div class="product-meta">
        <span>销量：{{ product.sale || 0 }}</span>
        <span v-if="product.stock !== undefined">库存：{{ product.stock }}</span>
      </div>
    </div>

    <!-- 加入购物车按钮 -->
    <div class="product-action">
      <el-button
        type="primary"
        :icon="ShoppingCart"
        size="small"
        @click.stop="handleAddToCart"
      >
        加入购物车
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.product-card {
  background: white;
  border-radius: $border-radius-base;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid $border-lighter;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-4px);

    .product-action {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .product-image {
    position: relative;
    width: 100%;
    padding-top: 100%; /* 1:1 比例 */
    overflow: hidden;
    background: #f5f5f5;

    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }

    &:hover img {
      transform: scale(1.05);
    }

    .product-tag {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 1;
    }
  }

  .product-info {
    padding: 10px 12px;

    .product-name {
      font-size: 13px;
      font-weight: 400;
      color: $text-primary;
      margin-bottom: 6px;
      min-height: 36px;
      line-height: 1.4;
    }

    .product-subtitle {
      font-size: 12px;
      color: $text-secondary;
      margin-bottom: 8px;
    }

    .product-price {
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin-bottom: 6px;

      .current-price {
        font-size: 18px;
        font-weight: bold;
        color: $primary-color;
      }

      .original-price {
        font-size: 12px;
        color: $text-secondary;
        text-decoration: line-through;
      }
    }

    .product-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: $text-secondary;
    }
  }

  .product-action {
    padding: 0 12px 12px;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s;

    .el-button {
      width: 100%;
      font-size: 12px;
      padding: 6px 12px;
    }
  }
}
</style>
