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
        if (res && res.code === 200 && res.data) {
          this.cartList = res.data || []
          // 默认全选
          this.selectedIds = this.cartList.map((item) => item.id)
        } else {
          // API 返回但无数据，使用 Mock 数据
          console.warn('购物车 API 返回数据为空，使用 Mock 数据')
          this.generateMockCart()
        }
      } catch (error) {
        console.error('获取购物车列表失败，使用 Mock 数据', error)
        this.generateMockCart()
      }
    },

    // 生成 Mock 购物车数据
    generateMockCart() {
      const mockItems = [
        {
          id: 1001,
          productId: 1,
          productName: '时尚男士T恤 夏季新款',
          productPic: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
          price: 129.00,
          quantity: 2,
          productSku: '颜色:白色 尺码:L'
        },
        {
          id: 1002,
          productId: 2,
          productName: '无线蓝牙耳机 降噪版',
          productPic: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=300&fit=crop',
          price: 299.00,
          quantity: 1,
          productSku: '颜色:黑色'
        },
        {
          id: 1003,
          productId: 3,
          productName: '智能手环 运动手表',
          productPic: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=300&h=300&fit=crop',
          price: 199.00,
          quantity: 1,
          productSku: '颜色:蓝色'
        }
      ]
      this.cartList = mockItems
      this.selectedIds = mockItems.map(item => item.id)
    },

    // 添加商品到购物车
    async addItem(productData) {
      try {
        const res = await cartApi.addToCart(productData)
        if (res && res.code === 200) {
          ElMessage.success('已加入购物车')
          // 重新获取列表以保证数据同步
          await this.fetchCart()
        } else {
          // API 失败，使用本地添加
          this.addItemLocally(productData)
        }
      } catch (error) {
        console.error('添加购物车失败，使用本地模式', error)
        // API 失败，使用本地添加
        this.addItemLocally(productData)
      }
    },

    // 本地添加商品（API 失败时使用）
    addItemLocally(productData) {
      const existItem = this.cartList.find(item => item.productId === productData.productId)
      if (existItem) {
        existItem.quantity += productData.quantity || 1
      } else {
        this.cartList.push({
          id: Date.now(),
          productId: productData.productId,
          productName: productData.productName || '商品',
          productPic: productData.productPic || '',
          price: productData.price || 0,
          quantity: productData.quantity || 1,
          productSku: productData.productSku || ''
        })
      }
      ElMessage.success('已加入购物车')
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
