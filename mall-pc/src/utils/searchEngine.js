/**
 * 智能搜索引擎 - 基于 Fuse.js
 * 支持多关键字、模糊匹配、全文搜索
 */
import Fuse from 'fuse.js'

class SearchEngine {
  constructor() {
    this.fuse = null
    this.rawData = []
    
    // Fuse.js 配置
    this.options = {
      // 搜索字段及权重
      keys: [
        { name: 'name', weight: 2.0 },           // 商品名称权重最高
        { name: 'subTitle', weight: 1.5 },      // 副标题
        { name: 'brandName', weight: 1.3 },     // 品牌名
        { name: 'keywords', weight: 1.0 }       // 关键词
      ],
      
      // 搜索参数 - 优化数字匹配
      threshold: 0.3,              // 降低阈值，更严格匹配（0.0=完全匹配, 1.0=全部匹配）
      distance: 200,               // 增加匹配距离，允许更远的匹配
      minMatchCharLength: 1,       // 最小匹配字符长度（支持单字符如数字）
      
      // 返回配置
      includeScore: true,          // 包含相关度分数
      includeMatches: true,        // 包含匹配信息（用于高亮）
      
      // 搜索算法
      useExtendedSearch: true,     // 启用高级搜索语法
      ignoreLocation: false,       // 考虑匹配位置（改为false，提高准确性）
      findAllMatches: true,        // 查找所有匹配
      
      // 位置配置
      location: 0,                 // 期望匹配的位置
      isCaseSensitive: false,      // 不区分大小写
      shouldSort: true,            // 自动排序结果
      
      // 优化短关键词匹配（如数字）
      getFn: (obj, path) => {
        const value = this.getValueByPath(obj, path)
        // 确保数字能被正确搜索
        return value ? String(value) : ''
      }
    }
  }

  /**
   * 获取对象属性值的辅助函数
   * @private
   */
  getValueByPath(obj, path) {
    const keys = path.split('.')
    let value = obj
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return undefined
      }
    }
    return value
  }

  /**
   * 初始化搜索索引
   * @param {Array} data - 商品数据数组
   */
  setData(data) {
    this.rawData = data
    this.fuse = new Fuse(data, this.options)
    console.log(`🔍 搜索引擎已初始化，索引了 ${data.length} 个商品`)
  }

  /**
   * 多关键字搜索（AND逻辑） - 优化版
   * @param {String} query - 搜索查询字符串
   * @returns {Array} 搜索结果
   */
  search(query) {
    if (!this.fuse || !query) return []

    // 清理并分割关键字
    const keywords = query
      .trim()
      .split(/\s+/)
      .filter(k => k.length > 0)

    if (keywords.length === 0) return []

    // 单关键字搜索
    if (keywords.length === 1) {
      return this.fuse.search(keywords[0])
    }

    // 多关键字智能搜索
    console.log(`🔍 多关键字搜索: ${keywords.join(' + ')}`)
    
    // 方案1: 先尝试整体搜索（所有关键字作为一个查询）
    const combinedQuery = keywords.join(' ')
    let results = this.fuse.search(combinedQuery)
    
    // 如果整体搜索结果较少，使用AND逻辑补充
    if (results.length < 10) {
      console.log(`📊 整体搜索结果较少 (${results.length}个)，使用AND逻辑补充...`)
      
      // 使用AND逻辑：逐个关键字搜索后取交集
      let andResults = this.fuse.search(keywords[0])
      
      for (let i = 1; i < keywords.length; i++) {
        const nextResults = this.fuse.search(keywords[i])
        andResults = this.intersectResults(andResults, nextResults)
      }
      
      // 合并结果并去重
      const resultMap = new Map()
      
      // 先添加整体搜索的结果（优先级更高）
      results.forEach(r => {
        resultMap.set(r.item.id, r)
      })
      
      // 再添加AND搜索的结果
      andResults.forEach(r => {
        if (!resultMap.has(r.item.id)) {
          resultMap.set(r.item.id, r)
        }
      })
      
      results = Array.from(resultMap.values())
    }

    console.log(`✅ 找到 ${results.length} 个匹配结果`)
    return results
  }

  /**
   * OR 逻辑搜索（任意关键字匹配）
   * @param {String} query - 搜索查询
   * @returns {Array} 搜索结果
   */
  searchOr(query) {
    if (!this.fuse || !query) return []

    const keywords = query.trim().split(/\s+/)
    if (keywords.length === 0) return []

    // 使用 Set 去重
    const resultMap = new Map()
    
    keywords.forEach(keyword => {
      const results = this.fuse.search(keyword)
      results.forEach(result => {
        if (!resultMap.has(result.item.id)) {
          resultMap.set(result.item.id, result)
        }
      })
    })

    return Array.from(resultMap.values())
  }

  /**
   * 高级搜索 - 支持搜索语法
   * 语法示例:
   *   - "华为 手机" - AND 搜索
   *   - "华为 | 小米" - OR 搜索
   *   - "!苹果" - NOT 搜索
   *   - "'iPhone 14'" - 精确匹配
   * 
   * @param {String} query - 搜索查询
   * @returns {Array} 搜索结果
   */
  advancedSearch(query) {
    if (!this.fuse || !query) return []

    // 检测 OR 操作符
    if (query.includes('|')) {
      const keywords = query.split('|').map(k => k.trim())
      return this.searchOr(keywords.join(' '))
    }

    // 默认 AND 搜索
    return this.search(query)
  }

  /**
   * 按字段搜索
   * @param {String} field - 字段名
   * @param {String} value - 搜索值
   * @returns {Array} 搜索结果
   */
  searchByField(field, value) {
    if (!this.fuse) return []
    
    const options = { ...this.options, keys: [field] }
    const fieldFuse = new Fuse(this.rawData, options)
    return fieldFuse.search(value)
  }

  /**
   * 价格范围筛选
   * @param {Array} results - 搜索结果
   * @param {Number} minPrice - 最低价格
   * @param {Number} maxPrice - 最高价格
   * @returns {Array} 筛选后的结果
   */
  filterByPrice(results, minPrice, maxPrice) {
    return results.filter(result => {
      const price = result.item.price || 0
      if (minPrice && price < minPrice) return false
      if (maxPrice && price > maxPrice) return false
      return true
    })
  }

  /**
   * 品牌筛选
   * @param {Array} results - 搜索结果
   * @param {String} brandId - 品牌ID
   * @returns {Array} 筛选后的结果
   */
  filterByBrand(results, brandId) {
    if (!brandId) return results
    return results.filter(result => result.item.brandId === brandId)
  }

  /**
   * 分类筛选
   * @param {Array} results - 搜索结果
   * @param {Number} categoryId - 分类ID
   * @returns {Array} 筛选后的结果
   */
  filterByCategory(results, categoryId) {
    if (!categoryId) return results
    return results.filter(result => result.item.productCategoryId === categoryId)
  }

  /**
   * 综合筛选
   * @param {Array} results - 搜索结果
   * @param {Object} filters - 筛选条件
   * @returns {Array} 筛选后的结果
   */
  applyFilters(results, filters = {}) {
    let filtered = results

    // 价格筛选
    if (filters.minPrice || filters.maxPrice) {
      filtered = this.filterByPrice(filtered, filters.minPrice, filters.maxPrice)
    }

    // 品牌筛选
    if (filters.brandId) {
      filtered = this.filterByBrand(filtered, filters.brandId)
    }

    // 分类筛选
    if (filters.categoryId) {
      filtered = this.filterByCategory(filtered, filters.categoryId)
    }

    return filtered
  }

  /**
   * 结果排序
   * @param {Array} results - 搜索结果
   * @param {String} sortType - 排序类型
   * @returns {Array} 排序后的结果
   */
  sortResults(results, sortType = 'relevance') {
    const sorted = [...results]

    switch (sortType) {
      case 'relevance':
        // 按相关度排序（默认已按相关度）
        return sorted.sort((a, b) => a.score - b.score)
      
      case 'price_asc':
        // 价格从低到高
        return sorted.sort((a, b) => (a.item.price || 0) - (b.item.price || 0))
      
      case 'price_desc':
        // 价格从高到低
        return sorted.sort((a, b) => (b.item.price || 0) - (a.item.price || 0))
      
      case 'sale':
        // 销量排序
        return sorted.sort((a, b) => (b.item.sale || 0) - (a.item.sale || 0))
      
      case 'new':
        // 新品排序
        return sorted.sort((a, b) => {
          const dateA = new Date(b.item.createTime || 0)
          const dateB = new Date(a.item.createTime || 0)
          return dateB - dateA
        })
      
      default:
        return sorted
    }
  }

  /**
   * 获取匹配的关键词（用于高亮）
   * @param {Object} result - Fuse.js 搜索结果对象
   * @returns {Array} 匹配的关键词数组
   */
  getMatchedKeywords(result) {
    if (!result.matches) return []
    
    const keywords = new Set()
    result.matches.forEach(match => {
      if (match.value) {
        keywords.add(match.value)
      }
    })
    
    return Array.from(keywords)
  }

  /**
   * 求两个结果集的交集（用于AND搜索）
   * @private
   */
  intersectResults(arr1, arr2) {
    const ids2 = new Set(arr2.map(r => r.item.id))
    return arr1.filter(r => ids2.has(r.item.id))
  }

  /**
   * 获取搜索建议（自动补全）
   * @param {String} query - 部分查询字符串
   * @param {Number} limit - 返回数量限制
   * @returns {Array} 建议列表
   */
  getSuggestions(query, limit = 5) {
    if (!query || !this.fuse) return []
    
    const results = this.fuse.search(query)
    
    // 提取唯一的商品名称作为建议
    const suggestions = new Set()
    results.forEach(result => {
      if (suggestions.size < limit) {
        suggestions.add(result.item.name)
      }
    })
    
    return Array.from(suggestions)
  }

  /**
   * 调试搜索 - 显示详细匹配信息
   * @param {String} query - 搜索查询
   * @returns {Object} 调试信息
   */
  debugSearch(query) {
    if (!this.fuse || !query) {
      return { error: '搜索引擎未初始化或查询为空' }
    }

    const keywords = query.trim().split(/\s+/)
    const debugInfo = {
      query,
      keywords,
      totalData: this.rawData.length,
      results: []
    }

    // 测试每个关键字
    keywords.forEach(keyword => {
      const results = this.fuse.search(keyword)
      debugInfo.results.push({
        keyword,
        count: results.length,
        samples: results.slice(0, 3).map(r => ({
          name: r.item.name,
          score: r.score,
          matches: r.matches?.map(m => ({
            key: m.key,
            value: m.value
          }))
        }))
      })
    })

    // 整体搜索
    const combinedResults = this.fuse.search(query)
    debugInfo.combined = {
      count: combinedResults.length,
      samples: combinedResults.slice(0, 3).map(r => ({
        name: r.item.name,
        score: r.score
      }))
    }

    // AND 搜索
    if (keywords.length > 1) {
      let andResults = this.fuse.search(keywords[0])
      for (let i = 1; i < keywords.length; i++) {
        const nextResults = this.fuse.search(keywords[i])
        andResults = this.intersectResults(andResults, nextResults)
      }
      debugInfo.and = {
        count: andResults.length,
        samples: andResults.slice(0, 3).map(r => ({
          name: r.item.name,
          score: r.score
        }))
      }
    }

    return debugInfo
  }

  /**
   * 清空索引
   */
  clear() {
    this.fuse = null
    this.rawData = []
    console.log('🔍 搜索引擎已清空')
  }
}

// 创建单例
const searchEngine = new SearchEngine()

// 暴露调试方法到全局（开发环境）
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.__searchDebug = (query) => {
    const result = searchEngine.debugSearch(query)
    console.table(result.results)
    console.log('整体搜索:', result.combined)
    if (result.and) {
      console.log('AND搜索:', result.and)
    }
    return result
  }
  console.log('💡 调试提示: 在控制台使用 __searchDebug("小米 65") 查看搜索详情')
}

export default searchEngine
