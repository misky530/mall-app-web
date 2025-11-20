import { defineStore } from 'pinia'
import * as cartApi from '@/api/cart'
import { ElMessage } from 'element-plus'

export const useCartStore = defineStore('cart', {
  state: () => ({
    cartList: [],
    selectedIds: [] // 选中的购物车商品ID
  }),

  getters: {
    // 购物车商品数量
    cartCount: (state) => {
      return state.cartList.reduce((total, item) => total + (item.quantity || 0), 0)
    },

    // 选中的商品列表
    selectedItems: (state) => {
      return state.cartList.filter((item) => state.selectedIds.includes(item.id))
    },

    // 选中商品总价
    selectedTotal: (state) => {
      return state.cartList
        .filter((item) => state.selectedIds.includes(item.id))
        .reduce((total, item) => {
          return total + (item.price || 0) * (item.quantity || 0)
        }, 0)
    },

    // 是否全选
    isAllSelected: (state) => {
      return state.cartList.length > 0 && state.selectedIds.length === state.cartList.length
    }
  },

  actions: {
    // 从服务器获取购物车列表
    async fetchCart() {
      try {
        const res = await cartApi.getCartList()
        if (res.code === 200) {
          this.cartList = res.data || []
          // 默认全选
          this.selectedIds = this.cartList.map((item) => item.id)
        }
      } catch (error) {
        console.error('获取购物车列表失败', error)
      }
    },

    // 添加商品到购物车
    async addItem(productData) {
      try {
        const res = await cartApi.addToCart(productData)
        if (res.code === 200) {
          ElMessage.success('已加入购物车')
          // 重新获取列表以保证数据同步
          await this.fetchCart()
        }
      } catch (error) {
        console.error('添加购物车失败', error)
      }
    },

    // 更新商品数量
    async updateItemQuantity(id, quantity) {
      try {
        const res = await cartApi.updateCartItemQuantity({ cartId: id, quantity })
        if (res.code === 200) {
          const item = this.cartList.find((item) => item.id === id)
          if (item) {
            item.quantity = quantity
          }
        }
      } catch (error) {
        console.error('更新数量失败', error)
        // 失败时刷新列表以恢复
        await this.fetchCart()
      }
    },

    // 删除购物车商品
    async removeItem(id) {
      try {
        const res = await cartApi.removeCartItems({ cartIds: [id] })
        if (res.code === 200) {
          const index = this.cartList.findIndex((item) => item.id === id)
          if (index > -1) {
            this.cartList.splice(index, 1)
          }
          const selectedIndex = this.selectedIds.indexOf(id)
          if (selectedIndex > -1) {
            this.selectedIds.splice(selectedIndex, 1)
          }
          ElMessage.success('删除成功')
        }
      } catch (error) {
        console.error('删除失败', error)
      }
    },

    // 删除选中商品
    async removeSelectedItems() {
      if (this.selectedIds.length === 0) return
      try {
        const res = await cartApi.removeCartItems({ cartIds: this.selectedIds })
        if (res.code === 200) {
          await this.fetchCart()
          ElMessage.success('已删除选中商品')
        }
      } catch (error) {
        console.error('删除选中商品失败', error)
      }
    },

    // 切换选中状态
    toggleSelect(id) {
      const index = this.selectedIds.indexOf(id)
      if (index > -1) {
        this.selectedIds.splice(index, 1)
      } else {
        this.selectedIds.push(id)
      }
    },

    // 全选/取消全选
    async toggleSelectAll() {
      const checked = !this.isAllSelected
      try {
        const res = await cartApi.checkAllCartItems({ checked })
        if (res.code === 200) {
          if (checked) {
            this.selectedIds = this.cartList.map((item) => item.id)
          } else {
            this.selectedIds = []
          }
        }
      } catch (error) {
        console.error('全选/取消全选失败', error)
      }
    },

  }
})
