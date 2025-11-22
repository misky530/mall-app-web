/**
 * 路由配置
 */
export default [
  {
    path: '/',
    component: () => import('@/components/Layout/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home/index.vue'),
        meta: {
          title: '首页'
        }
      },
      {
        path: 'product/list',
        name: 'ProductList',
        component: () => import('@/views/Product/List.vue'),
        meta: {
          title: '商品列表'
        }
      },
      {
        path: 'product/detail/:id',
        name: 'ProductDetail',
        component: () => import('@/views/Product/Detail.vue'),
        meta: {
          title: '商品详情'
        }
      },
      {
        path: 'product/search',
        name: 'ProductSearch',
        component: () => import('@/views/Product/Search.vue'),
        meta: {
          title: '搜索结果'
        }
      },
      {
        path: 'cart',
        name: 'Cart',
        component: () => import('@/views/Cart/index.vue'),
        meta: {
          title: '购物车',
          requiresAuth: true
        }
      },
      {
        path: 'order/confirm',
        name: 'OrderConfirm',
        component: () => import('@/views/Order/Confirm.vue'),
        meta: {
          title: '确认订单',
          requiresAuth: true
        }
      },
      {
        path: 'order/list',
        name: 'OrderList',
        component: () => import('@/views/Order/List.vue'),
        meta: {
          title: '我的订单',
          requiresAuth: true
        }
      },
      {
        path: 'order/detail/:id',
        name: 'OrderDetail',
        component: () => import('@/views/Order/Detail.vue'),
        meta: {
          title: '订单详情',
          requiresAuth: true
        }
      },
      {
        path: 'order/pay/:id',
        name: 'OrderPay',
        component: () => import('@/views/Order/Pay.vue'),
        meta: {
          title: '支付订单',
          requiresAuth: true
        }
      },
      {
        path: 'order/pay/success',
        name: 'PaySuccess',
        component: () => import('@/views/Order/PaySuccess.vue'),
        meta: {
          title: '支付成功'
        }
      },
      {
        path: 'user/profile',
        name: 'UserProfile',
        component: () => import('@/views/User/Profile.vue'),
        meta: {
          title: '个人信息',
          requiresAuth: true
        }
      },
      {
        path: 'user/address',
        name: 'UserAddress',
        component: () => import('@/views/User/Address.vue'),
        meta: {
          title: '收货地址',
          requiresAuth: true
        }
      },
      {
        path: 'user/favorite',
        name: 'UserFavorite',
        component: () => import('@/views/User/Favorite.vue'),
        meta: {
          title: '我的收藏',
          requiresAuth: true
        }
      },
      {
        path: 'user/history',
        name: 'UserHistory',
        component: () => import('@/views/User/History.vue'),
        meta: {
          title: '浏览历史',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Auth/Register.vue'),
    meta: {
      title: '注册'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '404'
    }
  }
]
