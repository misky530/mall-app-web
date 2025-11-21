<template>
  <div class="cart-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>我的购物车</span>
          <el-button class="button" text @click="clearCart">清空购物车</el-button>
        </div>
      </template>
      <div v-if="cartStore.cartList.length === 0" class="empty-cart">
        <el-empty description="购物车空空如也，快去购物吧！" />
        <el-button type="primary" @click="$router.push({ path: '/' })">去购物</el-button>
      </div>
      <div v-else>
        <el-table :data="cartStore.cartList" style="width: 100%" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column label="商品" width="400">
            <template #default="scope">
              <div class="product-info">
                <div class="product-pic-wrapper" @click="goToProductDetail(scope.row.productId)">
                  <el-image
                    :src="scope.row.productPic || scope.row.pic"
                    fit="cover"
                    class="product-pic"
                    @error="handleImageError"
                  >
                    <template #error>
                      <div class="image-error">
                        <div style="font-size: 32px; margin-bottom: 4px;">📦</div>
                        <div style="font-size: 12px;">暂无图片</div>
                      </div>
                    </template>
                  </el-image>
                </div>
                <div class="product-detail">
                  <div class="product-name" @click="goToProductDetail(scope.row.productId)">
                    {{ scope.row.productName || scope.row.name }}
                  </div>
                  <div class="product-sku" v-if="scope.row.productSku">{{ scope.row.productSku }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template #default="scope">
              ￥{{ scope.row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="数量" width="180">
            <template #default="scope">
              <el-input-number
                v-model="scope.row.quantity"
                :min="1"
                @change="handleQuantityChange(scope.row.id, scope.row.quantity)"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template #default="scope">
              ￥{{ (scope.row.price * scope.row.quantity).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="scope">
              <el-button link type="primary" size="small" @click="handleRemoveItem(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="cart-footer">
          <div class="select-all">
            <el-checkbox v-model="cartStore.isAllSelected" @change="cartStore.toggleSelectAll">全选</el-checkbox>
            <el-button link type="primary" @click="cartStore.removeSelectedItems">删除选中商品</el-button>
          </div>
          <div class="total-info">
            <span class="total-price">总计：￥{{ cartStore.selectedTotal.toFixed(2) }}</span>
            <el-button type="danger" :disabled="cartStore.selectedIds.length === 0" @click="goToCheckout">去结算</el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const cartStore = useCartStore()
const router = useRouter()

onMounted(() => {
  cartStore.fetchCart()
})

const handleSelectionChange = (selection) => {
  cartStore.selectedIds = selection.map(item => item.id)
}

const handleQuantityChange = (id, quantity) => {
  cartStore.updateItemQuantity(id, quantity)
}

const handleRemoveItem = (id) => {
  ElMessageBox.confirm('确定要删除该商品吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    cartStore.removeItem(id)
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const clearCart = () => {
  ElMessageBox.confirm('确定要清空购物车吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    // 由于没有直接的 clearCart API，这里通过删除所有选中商品来实现
    // 实际项目中可能需要后端提供清空购物车接口
    if (cartStore.cartList.length > 0) {
      const allCartIds = cartStore.cartList.map(item => item.id)
      cartStore.removeCartItems({ cartIds: allCartIds }).then(() => {
        ElMessage.success('购物车已清空')
        cartStore.fetchCart() // 重新获取购物车列表
      })
    } else {
      ElMessage.info('购物车已经是空的了')
    }
  }).catch(() => {
    ElMessage.info('已取消清空')
  })
}

const goToCheckout = () => {
  if (cartStore.selectedIds.length === 0) {
    ElMessage.warning('请选择要结算的商品')
    return
  }
  router.push({ path: '/order/confirm' })
}

// 图片加载错误处理
const handleImageError = (e) => {
  console.log('图片加载失败')
}

// 跳转到商品详情
const goToProductDetail = (productId) => {
  router.push(`/product/detail/${productId}`)
}
</script>

<style lang="scss" scoped>
.cart-container {
  padding: 20px;
  max-width: 1200px;
  margin: 20px auto;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .empty-cart {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px;
  }

  .product-info {
    display: flex;
    align-items: center;

    .product-pic-wrapper {
      margin-right: 15px;
      cursor: pointer;

      .product-pic {
        width: 80px;
        height: 80px;
        border-radius: 4px;
        border: 1px solid #eee;
        transition: transform 0.3s;

        &:hover {
          transform: scale(1.05);
        }
      }

      .image-error {
        width: 80px;
        height: 80px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        color: #999;
        border-radius: 4px;
      }
    }

    .product-detail {
      display: flex;
      flex-direction: column;
      justify-content: center;

      .product-name {
        font-size: 16px;
        color: #333;
        margin-bottom: 5px;
        cursor: pointer;
        transition: color 0.3s;

        &:hover {
          color: #409eff;
        }
      }

      .product-sku {
        font-size: 13px;
        color: #999;
      }
    }
  }

  .cart-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding: 15px 0;
    border-top: 1px solid #eee;

    .select-all {
      display: flex;
      align-items: center;

      .el-checkbox {
        margin-right: 20px;
      }
    }

    .total-info {
      display: flex;
      align-items: center;

      .total-price {
        font-size: 18px;
        color: #f56c6c;
        font-weight: bold;
        margin-right: 20px;
      }
    }
  }
}
</style>