<script setup>
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="container">
        <div class="footer-main">
          <div class="footer-section">
            <h4>关于我们</h4>
            <ul>
              <li><a href="#">公司简介</a></li>
              <li><a href="#">联系我们</a></li>
              <li><a href="#">加入我们</a></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4>新手指南</h4>
            <ul>
              <li><a href="#">注册会员</a></li>
              <li><a href="#">购物流程</a></li>
              <li><a href="#">订单查询</a></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4>配送方式</h4>
            <ul>
              <li><a href="#">配送范围</a></li>
              <li><a href="#">配送时效</a></li>
              <li><a href="#">配送费用</a></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4>售后服务</h4>
            <ul>
              <li><a href="#">退换货政策</a></li>
              <li><a href="#">退款说明</a></li>
              <li><a href="#">售后保障</a></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4>客户服务</h4>
            <ul>
              <li>服务热线：400-888-8888</li>
              <li>服务时间：9:00-18:00</li>
              <li>客服邮箱：service@mall.com</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="container">
        <p>&copy; {{ currentYear }} Mall商城 版权所有</p>
        <p>
          <a href="#">隐私政策</a>
          <span class="divider">|</span>
          <a href="#">服务条款</a>
          <span class="divider">|</span>
          <a href="#">网站地图</a>
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.app-footer {
  background: #2c2c2c;
  color: #ccc;
  margin-top: auto;

  .footer-content {
    padding: 40px 0;
  }

  .footer-main {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 30px;
  }

  .footer-section {
    h4 {
      color: white;
      font-size: 16px;
      margin-bottom: 16px;
      font-weight: 500;
    }

    ul {
      list-style: none;

      li {
        margin-bottom: 10px;
        font-size: 13px;

        a {
          color: #ccc;
          transition: color 0.3s;

          &:hover {
            color: $primary-color;
          }
        }
      }
    }
  }

  .footer-bottom {
    background: #1c1c1c;
    padding: 20px 0;
    text-align: center;
    font-size: 13px;

    p {
      margin: 8px 0;

      a {
        color: #ccc;
        transition: color 0.3s;

        &:hover {
          color: $primary-color;
        }
      }

      .divider {
        margin: 0 12px;
        color: #666;
      }
    }
  }
}
</style>
