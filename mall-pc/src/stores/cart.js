import { defineStore } from 'pinia'
import * as cartApi from '@/api/cart'
import { ElMessage } from 'element-plus'

const CART_STORAGE_KEY = 'mall_cart_list'
const CART_SELECTED_KEY = 'mall_cart_selected'

export const useCartStore = defineStore('cart', {
  state: () => ({
    cartList: [],
    selectedIds: [], // 选中的购物车商品ID
    useLocalStorage: true // 使用本地存储模式（因为在线API需要认证）
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
    // 从本地存储加载购物车
    loadFromLocalStorage() {
      try {
        const cartData = localStorage.getItem(CART_STORAGE_KEY)
        const selectedData = localStorage.getItem(CART_SELECTED_KEY)

        if (cartData) {
          this.cartList = JSON.parse(cartData)
        } else {
          this.cartList = []
        }

        if (selectedData) {
          this.selectedIds = JSON.parse(selectedData)
        } else {
          // 默认全选
          this.selectedIds = this.cartList.map(item => item.id)
        }
      } catch (error) {
        console.error('从本地存储加载购物车失败', error)
        this.cartList = []
        this.selectedIds = []
      }
    },

    // 保存到本地存储
    saveToLocalStorage() {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.cartList))
        localStorage.setItem(CART_SELECTED_KEY, JSON.stringify(this.selectedIds))
      } catch (error) {
        console.error('保存购物车到本地存储失败', error)
      }
    },

    // 获取购物车列表
    async fetchCart() {
      // 在线API需要认证，使用本地存储模式
      if (this.useLocalStorage) {
        this.loadFromLocalStorage()
        return
      }

      // 以下为API模式（保留以便后续支持认证）
      try {
        const res = await cartApi.getCartList()
        if (res && res.code === 200 && res.data) {
          this.cartList = res.data || []
          // 默认全选
          this.selectedIds = this.cartList.map((item) => item.id)
          this.saveToLocalStorage()
        }
      } catch (error) {
        console.error('获取购物车列表失败，使用本地存储', error)
        this.useLocalStorage = true
        this.loadFromLocalStorage()
      }
    },

    // 添加商品到购物车
    async addItem(productData) {
      // 使用本地存储模式
      if (this.useLocalStorage) {
        this.addItemLocally(productData)
        return
      }

      // API模式（保留）
      try {
        const res = await cartApi.addToCart(productData)
        if (res && res.code === 200) {
          ElMessage.success('已加入购物车')
          await this.fetchCart()
        }
      } catch (error) {
        console.error('添加购物车失败，使用本地模式', error)
        this.useLocalStorage = true
        this.addItemLocally(productData)
      }
    },

    // 本地添加商品
    addItemLocally(productData) {
      const existItem = this.cartList.find(item =>
        item.productId === productData.productId &&
        item.productSku === productData.productSku
      )

      if (existItem) {
        existItem.quantity += productData.quantity || 1
      } else {
        this.cartList.push({
          id: Date.now() + Math.random(), // 确保唯一ID
          productId: productData.productId,
          productName: productData.productName || '商品',
          productPic: productData.productPic || '',
          price: productData.price || 0,
          quantity: productData.quantity || 1,
          productSku: productData.productSku || ''
        })
        // 新添加的商品默认选中
        this.selectedIds.push(this.cartList[this.cartList.length - 1].id)
      }

      this.saveToLocalStorage()
      ElMessage.success('已加入购物车')
    },

    // 更新商品数量
    async updateItemQuantity(id, quantity) {
      // 使用本地存储模式
      if (this.useLocalStorage) {
        const item = this.cartList.find((item) => item.id === id)
        if (item) {
          item.quantity = quantity
          this.saveToLocalStorage()
        }
        return
      }

      // API模式（保留）
      try {
        const res = await cartApi.updateCartItemQuantity({ cartId: id, quantity })
        if (res.code === 200) {
          const item = this.cartList.find((item) => item.id === id)
          if (item) {
            item.quantity = quantity
            this.saveToLocalStorage()
          }
        }
      } catch (error) {
        console.error('更新数量失败', error)
        this.useLocalStorage = true
        const item = this.cartList.find((item) => item.id === id)
        if (item) {
          item.quantity = quantity
          this.saveToLocalStorage()
        }
      }
    },

    // 删除购物车商品
    async removeItem(id) {
      // 使用本地存储模式
      if (this.useLocalStorage) {
        const index = this.cartList.findIndex((item) => item.id === id)
        if (index > -1) {
          this.cartList.splice(index, 1)
        }
        const selectedIndex = this.selectedIds.indexOf(id)
        if (selectedIndex > -1) {
          this.selectedIds.splice(selectedIndex, 1)
        }
        this.saveToLocalStorage()
        ElMessage.success('删除成功')
        return
      }

      // API模式（保留）
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
          this.saveToLocalStorage()
          ElMessage.success('删除成功')
        }
      } catch (error) {
        console.error('删除失败', error)
      }
    },

    // 批量删除购物车商品（用于清空购物车）
    async removeCartItems(params) {
      // 使用本地存储模式
      if (this.useLocalStorage) {
        const idsToRemove = params.cartIds || []
        this.cartList = this.cartList.filter(item => !idsToRemove.includes(item.id))
        this.selectedIds = this.selectedIds.filter(id => !idsToRemove.includes(id))
        this.saveToLocalStorage()
        return Promise.resolve({ code: 200 })
      }

      // API模式（保留）
      try {
        const res = await cartApi.removeCartItems(params)
        if (res.code === 200) {
          this.saveToLocalStorage()
        }
        return res
      } catch (error) {
        console.error('批量删除失败', error)
        return Promise.reject(error)
      }
    },

    // 删除选中商品
    async removeSelectedItems() {
      if (this.selectedIds.length === 0) {
        ElMessage.warning('请选择要删除的商品')
        return
      }

      // 使用本地存储模式
      if (this.useLocalStorage) {
        this.cartList = this.cartList.filter(item => !this.selectedIds.includes(item.id))
        this.selectedIds = []
        this.saveToLocalStorage()
        ElMessage.success('已删除选中商品')
        return
      }

      // API模式（保留）
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
      this.saveToLocalStorage()
    },

    // 全选/取消全选
    toggleSelectAll() {
      if (this.isAllSelected) {
        this.selectedIds = []
      } else {
        this.selectedIds = this.cartList.map((item) => item.id)
      }
      this.saveToLocalStorage()
    },

    // 清空购物车
    clearCart() {
      this.cartList = []
      this.selectedIds = []
      this.saveToLocalStorage()
    }
  }
})
