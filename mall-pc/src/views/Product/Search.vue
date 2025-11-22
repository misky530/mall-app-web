<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '@/components/Product/ProductCard.vue'
import * as productApi from '@/api/product'
import { ElMessage } from 'element-plus'

const route = useRoute()

// 搜索关键词
const keyword = ref('')

// 排序类型
const sortType = ref('default')

// 分页
const pagination = ref({
  pageNum: 1,
  pageSize: 12,
  total: 0
})

// 商品列表
const productList = ref([])
const loading = ref(false)

// 排序选项
const sortOptions = [
  { label: '默认排序', value: 'default' },
  { label: '价格从低到高', value: 'price_asc' },
  { label: '价格从高到低', value: 'price_desc' },
  { label: '销量优先', value: 'sale' }
]

// Mock 商品数据（降级方案）
const generateMockProducts = () => {
  const mockProducts = []
  for (let i = 1; i <= 12; i++) {
    mockProducts.push({
      id: i,
      name: `${keyword.value} 相关商品 ${i}`,
      subTitle: '高品质商品，值得信赖',
      price: Math.floor(Math.random() * 1000) + 100,
      originalPrice: Math.floor(Math.random() * 1500) + 500,
      pic: `https://images.unsplash.com/photo-${1500000000000 + i * 100000}?w=300&h=300&fit=crop&auto=format`,
      sale: Math.floor(Math.random() * 10000),
      stock: Math.floor(Math.random() * 100) + 10
    })
  }
  return mockProducts
}

// 排序类型映射
const getSortValue = (type) => {
  const sortMap = {
    'default': 0,
    'sale': 1,
    'price_asc': 2,
    'price_desc': 3
  }
  return sortMap[type] || 0
}

// 获取搜索结果
const fetchSearchResults = async () => {
  if (!keyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  loading.value = true
  try {
    const params = {
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize,
      keyword: keyword.value,
      sort: getSortValue(sortType.value)
    }

    const res = await productApi.searchProductList(params)
    if (res && res.data) {
      productList.value = res.data.list || []
      pagination.value.total = res.data.total || 0
    } else {
      console.warn('API 返回数据为空，使用 Mock 数据')
      productList.value = generateMockProducts()
      pagination.value.total = 48
    }
  } catch (error) {
    console.error('搜索失败：', error)
    ElMessage.warning('使用示例数据展示')
    productList.value = generateMockProducts()
    pagination.value.total = 48
  } finally {
    loading.value = false
  }
}

// 排序改变
const handleSortChange = () => {
  pagination.value.pageNum = 1
  fetchSearchResults()
}

// 分页改变
const handlePageChange = (page) => {
  pagination.value.pageNum = page
  fetchSearchResults()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 监听路由变化
watch(
  () => route.query.keyword,
  (newKeyword) => {
    if (newKeyword) {
      keyword.value = newKeyword
      pagination.value.pageNum = 1
      fetchSearchResults()
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="product-search-page">
    <div class="container">
      <!-- 搜索关键词显示 -->
      <div class="search-header">
        <h2>搜索结果</h2>
        <p v-if="keyword">关键词：<span class="keyword">{{ keyword }}</span></p>
        <p v-if="!loading && productList.length > 0">找到 {{ pagination.total }} 件相关商品</p>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="result-count" v-if="!loading">共 {{ pagination.total }} 件商品</span>
        </div>
        <div class="toolbar-right">
          <span class="sort-label">排序：</span>
          <el-select v-model="sortType" @change="handleSortChange" style="width: 150px">
            <el-option
              v-for="option in sortOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
      </div>

      <!-- 商品列表 -->
      <div v-loading="loading" class="products-section">
        <div v-if="productList.length > 0" class="product-grid">
          <ProductCard
            v-for="product in productList"
            :key="product.id"
            :product="product"
          />
        </div>
        <el-empty v-else-if="!loading" description="没有找到相关商品" />
      </div>

      <!-- 分页 -->
      <div v-if="pagination.total > pagination.pageSize" class="pagination-wrapper">
        <el-pagination
          background
          layout="prev, pager, next, jumper"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          :current-page="pagination.pageNum"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.product-search-page {
  min-height: calc(100vh - 200px);
  padding: 40px 0;
  background: #f5f5f5;

  .search-header {
    background: white;
    padding: 30px;
    margin-bottom: 20px;
    border-radius: $border-radius-base;

    h2 {
      font-size: 28px;
      font-weight: bold;
      color: $text-primary;
      margin-bottom: 12px;
    }

    p {
      font-size: 14px;
      color: $text-secondary;
      margin: 8px 0;

      .keyword {
        color: $primary-color;
        font-weight: 500;
        font-size: 16px;
      }
    }
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
    padding: 20px 30px;
    margin-bottom: 20px;
    border-radius: $border-radius-base;

    .toolbar-left {
      .result-count {
        font-size: 14px;
        color: $text-secondary;
      }
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .sort-label {
        font-size: 14px;
        color: $text-secondary;
      }
    }
  }

  .products-section {
    min-height: 400px;

    .product-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    padding: 40px 0;
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .products-section .product-grid {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}

@media (max-width: 768px) {
  .products-section .product-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
</style>
