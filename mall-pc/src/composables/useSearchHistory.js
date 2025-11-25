/**
 * 搜索历史管理
 * 使用 LocalStorage 存储用户搜索历史
 */
import { ref, readonly } from 'vue'

const STORAGE_KEY = 'mall_search_history'
const HOT_SEARCH_KEY = 'mall_hot_search'
const MAX_HISTORY = 10
const MAX_HOT = 8

class SearchHistoryManager {
  constructor() {
    this.history = ref([])
    this.hotSearches = ref([])
    this.loadHistory()
    this.loadHotSearches()
  }

  /**
   * 加载搜索历史
   */
  loadHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      this.history.value = stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('加载搜索历史失败:', error)
      this.history.value = []
    }
  }

  /**
   * 添加搜索记录
   * @param {String} keyword - 搜索关键词
   */
  addHistory(keyword) {
    if (!keyword || !keyword.trim()) return

    const trimmed = keyword.trim()

    // 去重：移除已存在的相同关键词
    this.history.value = this.history.value.filter(k => k !== trimmed)

    // 添加到开头
    this.history.value.unshift(trimmed)

    // 限制数量
    if (this.history.value.length > MAX_HISTORY) {
      this.history.value = this.history.value.slice(0, MAX_HISTORY)
    }

    // 保存到 localStorage
    this.saveHistory()

    // 更新热门搜索统计
    this.updateHotSearch(trimmed)

    console.log('✅ 搜索历史已更新:', trimmed)
  }

  /**
   * 删除单条历史记录
   * @param {String} keyword - 要删除的关键词
   */
  removeHistory(keyword) {
    this.history.value = this.history.value.filter(k => k !== keyword)
    this.saveHistory()
  }

  /**
   * 清除所有历史
   */
  clearHistory() {
    this.history.value = []
    localStorage.removeItem(STORAGE_KEY)
    console.log('🗑️ 搜索历史已清除')
  }

  /**
   * 保存历史到 localStorage
   * @private
   */
  saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history.value))
    } catch (error) {
      console.error('保存搜索历史失败:', error)
    }
  }

  /**
   * 加载热门搜索
   */
  loadHotSearches() {
    try {
      const stored = localStorage.getItem(HOT_SEARCH_KEY)
      const data = stored ? JSON.parse(stored) : {}
      
      // 转换为数组并按次数排序
      this.hotSearches.value = Object.entries(data)
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, MAX_HOT)
        .map(item => item.keyword)
    } catch (error) {
      console.error('加载热门搜索失败:', error)
      this.hotSearches.value = this.getDefaultHotSearches()
    }

    // 如果没有热门搜索，使用默认值
    if (this.hotSearches.value.length === 0) {
      this.hotSearches.value = this.getDefaultHotSearches()
    }
  }

  /**
   * 更新热门搜索统计
   * @param {String} keyword - 搜索关键词
   * @private
   */
  updateHotSearch(keyword) {
    try {
      const stored = localStorage.getItem(HOT_SEARCH_KEY)
      const data = stored ? JSON.parse(stored) : {}
      
      // 增加计数
      data[keyword] = (data[keyword] || 0) + 1
      
      // 保存
      localStorage.setItem(HOT_SEARCH_KEY, JSON.stringify(data))
      
      // 重新加载热门搜索
      this.loadHotSearches()
    } catch (error) {
      console.error('更新热门搜索失败:', error)
    }
  }

  /**
   * 获取默认热门搜索（演示用）
   * @private
   */
  getDefaultHotSearches() {
    return [
      '手机',
      '笔记本电脑',
      '华为手机',
      '小米平板',
      'iPhone',
      '蓝牙耳机',
      '机械键盘',
      '显示器'
    ]
  }

  /**
   * 清除热门搜索统计
   */
  clearHotSearches() {
    localStorage.removeItem(HOT_SEARCH_KEY)
    this.hotSearches.value = this.getDefaultHotSearches()
    console.log('🗑️ 热门搜索已重置')
  }

  /**
   * 获取搜索历史（只读）
   */
  getHistory() {
    return readonly(this.history)
  }

  /**
   * 获取热门搜索（只读）
   */
  getHotSearches() {
    return readonly(this.hotSearches)
  }
}

// 创建单例
const searchHistoryManager = new SearchHistoryManager()

/**
 * Vue Composable - 搜索历史
 */
export function useSearchHistory() {
  return {
    history: searchHistoryManager.getHistory(),
    hotSearches: searchHistoryManager.getHotSearches(),
    addHistory: (keyword) => searchHistoryManager.addHistory(keyword),
    removeHistory: (keyword) => searchHistoryManager.removeHistory(keyword),
    clearHistory: () => searchHistoryManager.clearHistory(),
    clearHotSearches: () => searchHistoryManager.clearHotSearches()
  }
}

export default searchHistoryManager
