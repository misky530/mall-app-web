import { defineStore } from 'pinia'

export const useProductStore = defineStore('product', {
  state: () => ({
    categoryList: [], // 商品分类列表
    searchHistory: JSON.parse(localStorage.getItem('searchHistory') || '[]') // 搜索历史
  }),

  getters: {
    // 获取最近搜索历史（最多10条）
    recentSearchHistory: (state) => {
      return state.searchHistory.slice(0, 10)
    }
  },

  actions: {
    // 设置分类列表
    setCategoryList(list) {
      this.categoryList = list
    },

    // 添加搜索历史
    addSearchHistory(keyword) {
      if (!keyword) return

      // 去重
      const index = this.searchHistory.indexOf(keyword)
      if (index > -1) {
        this.searchHistory.splice(index, 1)
      }

      // 添加到开头
      this.searchHistory.unshift(keyword)

      // 最多保存20条
      if (this.searchHistory.length > 20) {
        this.searchHistory = this.searchHistory.slice(0, 20)
      }

      // 保存到本地
      localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory))
    },

    // 清空搜索历史
    clearSearchHistory() {
      this.searchHistory = []
      localStorage.removeItem('searchHistory')
    }
  }
})
