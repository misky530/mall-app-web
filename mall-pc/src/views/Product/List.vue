<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Grid, List as ListIcon } from '@element-plus/icons-vue'
import ProductCard from '@/components/Product/ProductCard.vue'
import * as productApi from '@/api/product'

const route = useRoute()

// 视图模式：grid 或 list
const viewMode = ref('grid')

// 筛选条件
const filters = ref({
  categoryId: null,
  keyword: '',
  minPrice: null,
  maxPrice: null,
  sortType: 'default' // default, price_asc, price_desc, sale
})

// 分页
const pagination = ref({
  pageNum: 1,
  pageSize: 12,
  total: 0
})

// 商品列表
const productList = ref([])
const loading = ref(false)

// 分类列表
const categoryList = ref([
  { id: null, name: '全部分类' },
  { id: 1, name: '服饰鞋包' },
  { id: 2, name: '数码电器' },
  { id: 3, name: '家居生活' },
  { id: 4, name: '美妆护肤' },
  { id: 5, name: '食品生鲜' },
  { id: 6, name: '运动户外' },
  { id: 7, name: '图书音像' },
  { id: 8, name: '母婴玩具' }
])

// 价格区间
const priceRanges = [
  { label: '全部价格', min: null, max: null },
  { label: '0-100', min: 0, max: 100 },
  { label: '100-300', min: 100, max: 300 },
  { label: '300-500', min: 300, max: 500 },
  { label: '500-1000', min: 500, max: 1000 },
  { label: '1000以上', min: 1000, max: null }
]

// 排序选项
const sortOptions = [
  { label: '默认排序', value: 'default' },
  { label: '价格从低到高', value: 'price_asc' },
  { label: '价格从高到低', value: 'price_desc' },
  { label: '销量优先', value: 'sale' }
]

// 当前选中的价格区间
const selectedPriceRange = computed(() => {
  return priceRanges.find(
    (range) => range.min === filters.value.minPrice && range.max === filters.value.maxPrice
  ) || priceRanges[0]
})

// Mock 商品数据（降级方案）
const generateMockProducts = () => {
  const mockProducts = []
  const categories = ['fashion', 'tech', 'food', 'furniture', 'beauty', 'sports', 'books', 'toys']

  for (let i = 1; i <= 12; i++) {
    const category = categories[i % categories.length]
    mockProducts.push({
      id: i,
      name: `精选商品 ${i}`,
      subTitle: '高品质商品，值得信赖',
      price: Math.floor(Math.random() * 1000) + 100,
      originalPrice: Math.floor(Math.random() * 1500) + 500,
      pic: `https://images.unsplash.com/photo-${1500000000000 + i * 100000}?w=300&h=300&fit=crop&auto=format`,
      sale: Math.floor(Math.random() * 10000),
      stock: Math.floor(Math.random() * 100) + 10,
      newStatus: Math.random() > 0.5 ? 1 : 0,
      recommendStatus: Math.random() > 0.5 ? 1 : 0
    })
  }
  return mockProducts
}

// 获取商品列表
const fetchProductList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize,
      keyword: filters.value.keyword,
      cateId: filters.value.categoryId,
      minPrice: filters.value.minPrice,
      maxPrice: filters.value.maxPrice,
      sort: filters.value.sortType
    }

    const res = await productApi.searchProductList(params)
    if (res && res.data) {
      productList.value = res.data.list || []
      pagination.value.total = res.data.total || 0
    } else {
      // API 返回但无数据，使用 Mock 数据
      console.warn('API 返回数据为空，使用 Mock 数据')
      productList.value = generateMockProducts()
      pagination.value.total = 48
    }
  } catch (error) {
    console.error('获取商品列表失败：', error)
    // API 调用失败，使用 Mock 数据作为降级方案
    ElMessage.warning('使用示例数据展示')
    productList.value = generateMockProducts()
    pagination.value.total = 48
  } finally {
    loading.value = false
  }
}

// 切换分类
const handleCategoryChange = (categoryId) => {
  filters.value.categoryId = categoryId
  pagination.value.pageNum = 1
  fetchProductList()
}

// 选择价格区间
const handlePriceRangeChange = (range) => {
  filters.value.minPrice = range.min
  filters.value.maxPrice = range.max
  pagination.value.pageNum = 1
  fetchProductList()
}

// 排序改变
const handleSortChange = () => {
  pagination.value.pageNum = 1
  fetchProductList()
}

// 分页改变
const handlePageChange = (page) => {
  pagination.value.pageNum = page
  fetchProductList()
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 监听路由变化
watch(
  () => route.query,
  (newQuery) => {
    // 处理关键词搜索
    if (newQuery.keyword !== undefined) {
      filters.value.keyword = newQuery.keyword
    }
    // 处理分类ID（兼容 categoryId 和 cateId）
    if (newQuery.categoryId !== undefined) {
      filters.value.categoryId = Number(newQuery.categoryId) || null
    } else if (newQuery.cateId !== undefined) {
      filters.value.categoryId = Number(newQuery.cateId) || null
    }
    // 重置分页并获取数据
    pagination.value.pageNum = 1
    fetchProductList()
  },
  { immediate: true }
)

onMounted(() => {
  // 组件挂载时获取商品列表（watch 已经设置了 immediate: true，所以这里可以省略）
  // fetchProductList()
})
</script>

<template>
  <div class="product-list-page">
    <div class="container">
      <!-- 面包屑 -->
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>商品列表</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="page-content">
        <!-- 侧边栏筛选 -->
        <aside class="sidebar">
          <!-- 分类筛选 -->
          <div class="filter-section">
            <h3>商品分类</h3>
            <div class="category-list">
              <div
                v-for="category in categoryList"
                :key="category.id"
                :class="['category-item', { active: filters.categoryId === category.id }]"
                @click="handleCategoryChange(category.id)"
              >
                {{ category.name }}
              </div>
            </div>
          </div>

          <!-- 价格筛选 -->
          <div class="filter-section">
            <h3>价格区间</h3>
            <div class="price-list">
              <div
                v-for="(range, index) in priceRanges"
                :key="index"
                :class="['price-item', { active: selectedPriceRange === range }]"
                @click="handlePriceRangeChange(range)"
              >
                {{ range.label }}
              </div>
            </div>
          </div>
        </aside>

        <!-- 主内容区 -->
        <main class="main-content">
          <!-- 工具栏 -->
          <div class="toolbar">
            <div class="toolbar-left">
              <span class="result-count">共 {{ pagination.total }} 件商品</span>
            </div>
            <div class="toolbar-right">
              <!-- 排序 -->
              <el-select
                v-model="filters.sortType"
                placeholder="排序方式"
                size="default"
                @change="handleSortChange"
              >
                <el-option
                  v-for="option in sortOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>

              <!-- 视图切换 -->
              <div class="view-toggle">
                <el-button
                  :type="viewMode === 'grid' ? 'primary' : 'default'"
                  :icon="Grid"
                  @click="viewMode = 'grid'"
                />
                <el-button
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
              layout="prev, pager, next, jumper"
              @current-change="handlePageChange"
            />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.product-list-page {
  padding: 20px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 200px);

  .breadcrumb {
    margin-bottom: 20px;
  }

  .page-content {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 20px;

    // 侧边栏
    .sidebar {
      background: white;
      border-radius: $border-radius-base;
      padding: 20px;
      height: fit-content;
      position: sticky;
      top: 20px;

      .filter-section {
        margin-bottom: 30px;

        &:last-child {
          margin-bottom: 0;
        }

        h3 {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid $border-lighter;
        }

        .category-list,
        .price-list {
          .category-item,
          .price-item {
            padding: 10px 12px;
            margin-bottom: 8px;
            border-radius: $border-radius-small;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 14px;

            &:hover {
              background: #f5f5f5;
              color: $primary-color;
            }

            &.active {
              background: $primary-color;
              color: white;
            }
          }
        }
      }
    }

    // 主内容
    .main-content {
      .toolbar {
        background: white;
        padding: 16px 20px;
        border-radius: $border-radius-base;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .toolbar-left {
          .result-count {
            font-size: 14px;
            color: $text-secondary;
          }
        }

        .toolbar-right {
          display: flex;
          gap: 12px;
          align-items: center;

          .view-toggle {
            display: flex;
            gap: 4px;
          }
        }
      }

      .product-container {
        background: white;
        border-radius: $border-radius-base;
        padding: 20px;
        min-height: 400px;

        .product-list {
          &.grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }

          &.list {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
        }
      }

      .pagination-wrapper {
        margin-top: 30px;
        display: flex;
        justify-content: center;
      }
    }
  }
}

// 响应式
@media (max-width: 1200px) {
  .page-content {
    grid-template-columns: 200px 1fr !important;
  }

  .product-list.grid {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}

@media (max-width: 768px) {
  .page-content {
    grid-template-columns: 1fr !important;
  }

  .sidebar {
    display: none;
  }

  .product-list.grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
</style>
