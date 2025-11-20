import { defineStore } from 'pinia'

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
    }
  },

  actions: {
    // 设置购物车列表
    setCartList(list) {
      this.cartList = list
    },

    // 添加到购物车
    addToCart(product) {
      const existItem = this.cartList.find((item) => item.productId === product.productId)
      if (existItem) {
        existItem.quantity += product.quantity || 1
      } else {
        this.cartList.push(product)
      }
    },

    // 更新商品数量
    updateQuantity(id, quantity) {
      const item = this.cartList.find((item) => item.id === id)
      if (item) {
        item.quantity = quantity
      }
    },

    // 删除购物车商品
    removeFromCart(id) {
      const index = this.cartList.findIndex((item) => item.id === id)
      if (index > -1) {
        this.cartList.splice(index, 1)
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
    toggleSelectAll() {
      if (this.selectedIds.length === this.cartList.length) {
        this.selectedIds = []
      } else {
        this.selectedIds = this.cartList.map((item) => item.id)
      }
    },

    // 清空购物车
    clearCart() {
      this.cartList = []
      this.selectedIds = []
    }
  }
})
