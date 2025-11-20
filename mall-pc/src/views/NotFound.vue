<script setup>
const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="not-found-page">
    <div class="content">
      <h1>404</h1>
      <p>抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.not-found-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;

  .content {
    text-align: center;

    h1 {
      font-size: 120px;
      font-weight: bold;
      color: #fa436a;
      margin-bottom: 20px;
    }

    p {
      font-size: 20px;
      color: #666;
      margin-bottom: 30px;
    }
  }
}
</style>
