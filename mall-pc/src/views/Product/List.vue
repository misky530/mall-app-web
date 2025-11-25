<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Grid, List as ListIcon } from '@element-plus/icons-vue'
import ProductCard from '@/components/Product/ProductCard.vue'
import * as productApi from '@/api/product'
import * as homeApi from '@/api/home'

const route = useRoute()
const router = useRouter()

// 视图模式：grid 或 list
const viewMode = ref('grid')

// 筛选条件
const filters = ref({
  categoryId: null,
  keyword: '',
  brandId: null,
  minPrice: null,
  maxPrice: null,
  sortType: 'default', // default, price_asc, price_desc, sale
  attrs: {} // 属性筛选
})

// 分页
const pagination = ref({
  pageNum: 1,
  pageSize: 24,
  total: 0
})

// 商品列表
const productList = ref([])
const loading = ref(false)

// 热门品牌（京东风格）
const hotBrands = ref([
  { id: 1, name: '华为', logo: '' },
  { id: 2, name: '小米', logo: '' },
  { id: 3, name: 'Apple', logo: '' },
  { id: 4, name: '三星', logo: '' },
  { id: 5, name: 'OPPO', logo: '' },
  { id: 6, name: 'vivo', logo: '' },
  { id: 7, name: '荣耀', logo: '' },
  { id: 8, name: '真我', logo: '' }
])

// 热门分类（京东风格）
const hotCategories = ref([
  { id: 101, name: '5G手机' },
  { id: 102, name: '游戏手机' },
  { id: 103, name: '拍照手机' },
  { id: 104, name: '老人机' },
  { id: 105, name: '学生手机' },
  { id: 106, name: '商务手机' }
])

// 价格区间
const priceRanges = [
  { label: '0-500', min: 0, max: 500 },
  { label: '500-1000', min: 500, max: 1000 },
  { label: '1000-2000', min: 1000, max: 2000 },
  { label: '2000-3000', min: 2000, max: 3000 },
  { label: '3000-5000', min: 3000, max: 5000 },
  { label: '5000以上', min: 5000, max: null }
]);

// 商品属性筛选（京东风格）
const productAttrs = ref([
  {
    name: '运行内存',
    options: ['6GB', '8GB', '12GB', '16GB', '18GB']
  },
  {
    name: '机身存储',
    options: ['128GB', '256GB', '512GB', '1TB']
  },
  {
    name: '网络类型',
    options: ['5G', '4G', '全网通']
  },
  {
    name: '屏幕尺寸',
    options: ['6.0英寸以下', '6.0-6.5英寸', '6.5-7.0英寸', '7.0英寸以上']
  }
]);

// 排序选项（京东风格）
const sortOptions = [
  { label: '综合排序', value: 'default', active: true },
  { label: '销量', value: 'sale', active: false },
  { label: '新品', value: 'new', active: false },
  { label: '评论数', value: 'comment', active: false },
  { label: '价格', value: 'price', active: false, hasArrow: true }
];

// 价格排序方向
const priceSort = ref(''); // 'asc' 或 'desc'

// 服务标签（京东风格）
const serviceTags = ref([
  { label: '京东物流', active: false },
  { label: '货到付款', active: false },
  { label: '仅显示有货', active: false },
  { label: '京东配送', active: false },
  { label: '全球购', active: false }
]);

// 当前选中的价格区间
const selectedPriceRange = computed(() => {
  return priceRanges.find(
    (range) => range.min === filters.value.minPrice && range.max === filters.value.maxPrice
  )
});

// 页面标题
const pageTitle = computed(() => {
  const type = route.query.type
  if (type === 'new') {
    return '新品上市'
  } else if (type === 'hot') {
    return '热销商品'
  } else if (route.query.categoryName) {
    return route.query.categoryName
  } else if (route.query.keyword) {
    return route.query.keyword
  }
  return '商品列表'
});

// Mock 商品数据（降级方案）
const generateMockProducts = () => {
  const mockProducts = [];
  const brands = ['华为', '小米', 'Apple', '三星', 'OPPO', 'vivo'];
  const memories = ['6GB', '8GB', '12GB', '16GB'];
  const storages = ['128GB', '256GB', '512GB', '1TB'];

  for (let i = 1; i <= 24; i++) {
    const brand = brands[i % brands.length];
    const memory = memories[i % memories.length];
    const storage = storages[i % storages.length];

    mockProducts.push({
      id: Date.now() + i,
      name: `${brand} 旗舰手机 ${memory}+${storage}`,
      subTitle: '5G全网通 双卡双待 超长续航',
      price: Math.floor(Math.random() * 4000) + 1000,
      originalPrice: Math.floor(Math.random() * 5000) + 2000,
      pic: `https://images.unsplash.com/photo-${1500000000000 + i * 100000}?w=300&h=300&fit=crop&auto=format`,
      sale: Math.floor(Math.random() * 10000) + 100,
      stock: Math.floor(Math.random() * 100) + 10,
      commentCount: Math.floor(Math.random() * 5000) + 100,
      newStatus: Math.random() > 0.7 ? 1 : 0,
      recommendStatus: Math.random() > 0.5 ? 1 : 0,
      brandName: brand
    });
  }
  return mockProducts;
};

// 排序类型映射
const getSortValue = (sortType) => {
  const sortMap = {
    'default': 0,
    'sale': 1,
    'price_asc': 2,
    'price_desc': 3,
    'new': 4,
    'comment': 5
  };
  return sortMap[sortType] || 0;
};

// 获取商品列表
const fetchProductList = async () => {
  loading.value = true;
  try {
    const listType = route.query.type;

    if (listType === 'new') {
      const params = {
        pageNum: pagination.value.pageNum,
        pageSize: pagination.value.pageSize
      }
      const res = await homeApi.fetchNewProductList(params)
      if (res && res.data) {
        productList.value = Array.isArray(res.data) ? res.data : []
        pagination.value.total = productList.value.length
      } else {
        productList.value = generateMockProducts()
        pagination.value.total = 96
      }
    } else if (listType === 'hot') {
      const params = {
        pageNum: pagination.value.pageNum,
        pageSize: pagination.value.pageSize
      }
      const res = await homeApi.fetchHotProductList(params)
      if (res && res.data) {
        productList.value = Array.isArray(res.data) ? res.data : []
        pagination.value.total = productList.value.length
      } else {
        productList.value = generateMockProducts()
        pagination.value.total = 96
      }
    } else {
      const params = {
        pageNum: pagination.value.pageNum,
        pageSize: pagination.value.pageSize,
        keyword: filters.value.keyword || '',
        sort: getSortValue(filters.value.sortType)
      }

      if (filters.value.categoryId) {
        params.cateId = filters.value.categoryId
      }
      if (filters.value.brandId) {
        params.brandId = filters.value.brandId
      }
      if (filters.value.minPrice) {
        params.minPrice = filters.value.minPrice
      }
      if (filters.value.maxPrice) {
        params.maxPrice = filters.value.maxPrice
      }

      const res = await productApi.searchProductList(params)
      if (res && res.data) {
        productList.value = res.data.list || []
        pagination.value.total = res.data.total || 0
      } else {
        productList.value = generateMockProducts()
        pagination.value.total = 96
      }
    }
  } catch (error) {
    console.error('获取商品列表失败：', error)
    productList.value = generateMockProducts()
    pagination.value.total = 96
  } finally {
    loading.value = false
  }
}

// 选择品牌
const handleBrandSelect = (brandId) => {
  if (filters.value.brandId === brandId) {
    filters.value.brandId = null
  } else {
    filters.value.brandId = brandId
  }
  pagination.value.pageNum = 1
  fetchProductList()
}

// 选择价格区间
const handlePriceRangeSelect = (range) => {
  if (selectedPriceRange.value === range) {
    filters.value.minPrice = null
    filters.value.maxPrice = null
  } else {
    filters.value.minPrice = range.min
    filters.value.maxPrice = range.max
  }
  pagination.value.pageNum = 1
  fetchProductList()
}

// 选择属性
const handleAttrSelect = (attrName, option) => {
  if (!filters.value.attrs[attrName]) {
    filters.value.attrs[attrName] = option
  } else if (filters.value.attrs[attrName] === option) {
    delete filters.value.attrs[attrName]
  } else {
    filters.value.attrs[attrName] = option
  }
  pagination.value.pageNum = 1
  fetchProductList()
}

// 排序改变（京东风格）
const handleSortClick = (sortOption) => {
  if (sortOption.value === 'price') {
    // 价格排序特殊处理
    if (priceSort.value === '') {
      priceSort.value = 'asc'
      filters.value.sortType = 'price_asc'
    } else if (priceSort.value === 'asc') {
      priceSort.value = 'desc'
      filters.value.sortType = 'price_desc'
    } else {
      priceSort.value = 'asc'
      filters.value.sortType = 'price_asc'
    }
  } else {
    filters.value.sortType = sortOption.value
    priceSort.value = ''
  }

  // 更新激活状态
  sortOptions.forEach(opt => {
    if (opt.value === 'price') {
      opt.active = sortOption.value === 'price' && priceSort.value !== ''
    } else {
      opt.active = opt.value === sortOption.value
    }
  })

  pagination.value.pageNum = 1
  fetchProductList()
}

// 切换服务标签
const toggleServiceTag = (tag) => {
  tag.active = !tag.active
}

// 清除所有筛选
const clearAllFilters = () => {
  filters.value = {
    categoryId: null,
    keyword: route.query.keyword || '',
    brandId: null,
    minPrice: null,
    maxPrice: null,
    sortType: 'default',
    attrs: {}
  }
  priceSort.value = ''
  serviceTags.value.forEach(tag => tag.active = false)
  sortOptions.forEach(opt => {
    opt.active = opt.value === 'default'
  })
  pagination.value.pageNum = 1
  fetchProductList()
}

// 分页改变
const handlePageChange = (page) => {
  pagination.value.pageNum = page
  fetchProductList()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 监听路由变化
watch(
  () => route.query,
  (newQuery) => {
    if (newQuery.keyword !== undefined) {
      filters.value.keyword = newQuery.keyword
    }
    if (newQuery.categoryId !== undefined) {
      filters.value.categoryId = Number(newQuery.categoryId) || null
    } else if (newQuery.cateId !== undefined) {
      filters.value.categoryId = Number(newQuery.cateId) || null
    }
    pagination.value.pageNum = 1
    fetchProductList()
  },
  { immediate: true }
)

// 计算已选筛选条件数量
const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.brandId) count++
  if (filters.value.minPrice || filters.value.maxPrice) count++
  count += Object.keys(filters.value.attrs).length
  count += serviceTags.value.filter(tag => tag.active).length
  return count
})
</script>

<template>
  <div class="product-list-page">
    <div class="container">
      <!-- 面包屑 -->
      <el-breadcrumb separator=">" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>{{ pageTitle }}</el-breadcrumb-item>
      </el-breadcrumb>

      <!-- 搜索关键词展示 -->
      <div v-if="route.query.keyword" class="search-info">
        <h1 class="search-title">{{ route.query.keyword }}</h1>
      </div>

      <!-- 热门推荐区域（京东风格） -->
      <div class="hot-section">
        <!-- 新品上市 -->
        <div class="hot-block">
          <div class="hot-header">
            <span class="hot-icon">🔥</span>
            <span class="hot-title">新品上市</span>
          </div>
          <div class="hot-items">
            <span
              v-for="cat in hotCategories.slice(0, 3)"
              :key="cat.id"
              class="hot-item"
              @click="router.push({ path: '/product/list', query: { type: 'new', categoryId: cat.id } })"
            >
              {{ cat.name }}
            </span>
          </div>
        </div>

        <!-- 热门品牌 -->
        <div class="hot-block">
          <div class="hot-header">
            <span class="hot-icon">⭐</span>
            <span class="hot-title">热门品牌</span>
          </div>
          <div class="hot-items">
            <span
              v-for="brand in hotBrands.slice(0, 6)"
              :key="brand.id"
              class="hot-item"
              :class="{ active: filters.brandId === brand.id }"
              @click="handleBrandSelect(brand.id)"
            >
              {{ brand.name }}
            </span>
          </div>
        </div>

        <!-- 热门分类 -->
        <div class="hot-block">
          <div class="hot-header">
            <span class="hot-icon">📂</span>
            <span class="hot-title">热门分类</span>
          </div>
          <div class="hot-items">
            <span
              v-for="cat in hotCategories"
              :key="cat.id"
              class="hot-item"
              @click="router.push({ path: '/product/list', query: { categoryId: cat.id, categoryName: cat.name } })"
            >
              {{ cat.name }}
            </span>
          </div>
        </div>
      </div>

      <!-- 筛选栏（京东风格） -->
      <div class="filter-bar">
        <!-- 价格筛选 -->
        <div class="filter-row">
          <div class="filter-label">价格</div>
          <div class="filter-content">
            <span
              v-for="(range, index) in priceRanges"
              :key="index"
              class="filter-tag"
              :class="{ active: selectedPriceRange === range }"
              @click="handlePriceRangeSelect(range)"
            >
              {{ range.label }}
            </span>
          </div>
        </div>

        <!-- 属性筛选 -->
        <div v-for="attr in productAttrs" :key="attr.name" class="filter-row">
          <div class="filter-label">{{ attr.name }}</div>
          <div class="filter-content">
            <span
              v-for="option in attr.options"
              :key="option"
              class="filter-tag"
              :class="{ active: filters.attrs[attr.name] === option }"
              @click="handleAttrSelect(attr.name, option)"
            >
              {{ option }}
            </span>
          </div>
        </div>

        <!-- 服务标签 -->
        <div class="filter-row">
          <div class="filter-label">服务</div>
          <div class="filter-content">
            <span
              v-for="tag in serviceTags"
              :key="tag.label"
              class="filter-tag"
              :class="{ active: tag.active }"
              @click="toggleServiceTag(tag)"
            >
              {{ tag.label }}
            </span>
          </div>
        </div>

        <!-- 清除筛选 -->
        <div v-if="activeFiltersCount > 0" class="filter-actions">
          <el-button size="small" @click="clearAllFilters">
            清除筛选 ({{ activeFiltersCount }})
          </el-button>
        </div>
      </div>

      <!-- 排序和工具栏（京东风格） -->
      <div class="toolbar">
        <div class="sort-bar">
          <span
            v-for="sortOption in sortOptions"
            :key="sortOption.value"
            class="sort-item"
            :class="{ active: sortOption.active }"
            @click="handleSortClick(sortOption)"
          >
            {{ sortOption.label }}
            <template v-if="sortOption.hasArrow">
              <i v-if="priceSort === 'asc'" class="arrow-up">↑</i>
              <i v-else-if="priceSort === 'desc'" class="arrow-down">↓</i>
              <i v-else class="arrow-both">⇅</i>
            </template>
          </span>
        </div>

        <div class="toolbar-right">
          <span class="result-count">
            <span class="total-num">{{ pagination.total }}</span> 件商品
          </span>

          <div class="page-info">
            <span class="current-page">{{ pagination.pageNum }}</span>
            <span class="page-divider">/</span>
            <span class="total-pages">{{ Math.ceil(pagination.total / pagination.pageSize) }}</span>
          </div>

          <div class="view-toggle">
            <el-button
              size="small"
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              :icon="Grid"
              @click="viewMode = 'grid'"
            />
            <el-button
              size="small"
              :type="viewMode === 'list' ? 'primary' : 'default'"
              :icon="ListIcon"
              @click="viewMode = 'list'"
            />
          </div>
        </div>
      </div>

      <!-- 商品列表 -->
      <div v-loading="loading" class="product-container">
        <div v-if="productList.length > 0" :class="['product-list', viewMode]">
          <ProductCard
            v-for="product in productList"
            :key="product.id"
            :product="product"
          />
        </div>
        <el-empty v-else description="暂无商品" />
      </div>

      <!-- 分页 -->
      <div v-if="pagination.total > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[12, 24, 48, 96]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="fetchProductList"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.product-list-page {
  background: #f5f5f5;
  min-height: calc(100vh - 200px);

  .breadcrumb {
    padding: 16px 0;
    background: white;
    margin-bottom: 0;
  }

  // 搜索信息
  .search-info {
    background: white;
    padding: 20px 0;
    border-top: 1px solid #f0f0f0;

    .search-title {
      font-size: 24px;
      font-weight: 600;
      color: $text-primary;
      margin: 0;
    }
  }

  // 热门推荐区域（京东风格）
  .hot-section {
    background: white;
    padding: 16px 0;
    margin-bottom: 10px;
    display: flex;
    gap: 0;

    .hot-block {
      flex: 1;
      padding: 0 20px;
      border-right: 1px solid #f0f0f0;

      &:last-child {
        border-right: none;
      }

      .hot-header {
        display: flex;
        align-items: center;
        margin-bottom: 10px;

        .hot-icon {
          font-size: 16px;
          margin-right: 6px;
        }

        .hot-title {
          font-size: 14px;
          font-weight: 600;
          color: $text-primary;
        }
      }

      .hot-items {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .hot-item {
          padding: 4px 12px;
          font-size: 13px;
          color: #666;
          background: #f5f5f5;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            color: $primary-color;
            background: #e8f4ff;
          }

          &.active {
            color: white;
            background: $primary-color;
          }
        }
      }
    }
  }

  // 筛选栏（京东风格）
  .filter-bar {
    background: white;
    padding: 0 20px 16px;

    .filter-row {
      display: flex;
      border-bottom: 1px solid #f0f0f0;
      padding: 16px 0;

      &:last-child {
        border-bottom: none;
      }

      .filter-label {
        width: 100px;
        font-size: 14px;
        font-weight: 500;
        color: $text-primary;
        flex-shrink: 0;
        padding-right: 20px;
      }

      .filter-content {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        gap: 8px 12px;
        align-items: center;

        .filter-tag {
          padding: 5px 16px;
          font-size: 13px;
          color: #666;
          border: 1px solid #e0e0e0;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.3s;
          background: white;

          &:hover {
            color: $primary-color;
            border-color: $primary-color;
          }

          &.active {
            color: $primary-color;
            border-color: $primary-color;
            background: #e8f4ff;
            font-weight: 500;
          }
        }
      }
    }

    .filter-actions {
      padding: 12px 0 0;
      text-align: right;
    }
  }

  // 排序工具栏（京东风格）
  .toolbar {
    background: #f5f5f5;
    padding: 10px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .sort-bar {
      display: flex;
      gap: 0;

      .sort-item {
        padding: 8px 20px;
        font-size: 14px;
        color: #666;
        background: white;
        border: 1px solid #e0e0e0;
        border-right: none;
        cursor: pointer;
        transition: all 0.3s;
        position: relative;

        &:first-child {
          border-radius: 2px 0 0 2px;
        }

        &:last-child {
          border-right: 1px solid #e0e0e0;
          border-radius: 0 2px 2px 0;
        }

        &:hover {
          color: $primary-color;
          z-index: 1;
        }

        &.active {
          color: white;
          background: $primary-color;
          border-color: $primary-color;
          z-index: 2;
        }

        .arrow-up,
        .arrow-down,
        .arrow-both {
          margin-left: 4px;
          font-style: normal;
        }

        .arrow-up {
          color: $primary-color;
        }

        .arrow-down {
          color: $primary-color;
        }

        .arrow-both {
          color: #999;
        }
      }
    }

    .toolbar-right {
      display: flex;
      gap: 16px;
      align-items: center;

      .result-count {
        font-size: 13px;
        color: #666;

        .total-num {
          color: $primary-color;
          font-weight: 600;
          font-size: 16px;
        }
      }

      .page-info {
        font-size: 13px;
        color: #666;

        .current-page {
          color: $primary-color;
          font-weight: 600;
        }

        .page-divider {
          margin: 0 4px;
        }
      }

      .view-toggle {
        display: flex;
        gap: 4px;
      }
    }
  }

  // 商品容器
  .product-container {
    background: white;
    padding: 20px;
    min-height: 600px;

    .product-list {
      &.grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 14px 10px;
      }

      &.list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
    }
  }

  // 分页
  .pagination-wrapper {
    background: white;
    padding: 30px 0;
    margin-top: 10px;
    display: flex;
    justify-content: center;
  }
}

// 响应式
@media (max-width: 1400px) {
  .product-list.grid {
    grid-template-columns: repeat(4, 1fr) !important;
  }
}

@media (max-width: 1200px) {
  .product-list.grid {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}

@media (max-width: 768px) {
  .hot-section {
    flex-direction: column !important;

    .hot-block {
      border-right: none !important;
      border-bottom: 1px solid #f0f0f0;
      padding: 12px 0 !important;

      &:last-child {
        border-bottom: none;
      }
    }
  }

  .filter-row {
    flex-direction: column !important;

    .filter-label {
      width: 100% !important;
      margin-bottom: 8px;
    }
  }

  .toolbar {
    flex-direction: column !important;
    gap: 12px;
    align-items: stretch !important;

    .sort-bar {
      overflow-x: auto;
    }

    .toolbar-right {
      justify-content: space-between;
    }
  }

  .product-list.grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
</style>
