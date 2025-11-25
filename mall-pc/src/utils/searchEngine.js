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
      
      // 搜索参数
      threshold: 0.4,              // 0.0=完全匹配, 1.0=全部匹配 (越小越严格)
      distance: 100,               // 匹配距离
      minMatchCharLength: 1,       // 最小匹配字符长度
      
      // 返回配置
      includeScore: true,          // 包含相关度分数
      includeMatches: true,        // 包含匹配信息（用于高亮）
      
      // 搜索算法
      useExtendedSearch: true,     // 启用高级搜索语法
      ignoreLocation: true,        // 忽略位置
      findAllMatches: true         // 查找所有匹配
    }
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
   * 多关键字搜索（AND逻辑）
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

    // 多关键字 AND 搜索
    console.log(`🔍 多关键字搜索: ${keywords.join(' + ')}`)
    
    let results = this.fuse.search(keywords[0])
    
    for (let i = 1; i < keywords.length; i++) {
      const nextResults = this.fuse.search(keywords[i])
      results = this.intersectResults(results, nextResults)
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

export default searchEngine
