# Mall商城 - PC端

基于 Vue 3 + Vite + Element Plus 构建的现代化电商平台PC端项目

## 🚀 技术栈

- **Vue 3.5+** - 渐进式JavaScript框架
- **Vite 7.2+** - 新一代前端构建工具
- **Element Plus 2.11+** - Vue 3 UI组件库
- **Vue Router 4** - 官方路由管理器
- **Pinia 3** - 新一代状态管理
- **Axios** - HTTP客户端
- **SCSS** - CSS预处理器

## 📁 项目结构

```
mall-pc/
├── src/
│   ├── api/                     # API接口模块
│   ├── assets/styles/           # 全局样式
│   ├── components/Layout/       # 布局组件
│   ├── router/                  # 路由配置
│   ├── stores/                  # Pinia状态管理
│   ├── utils/                   # 工具函数
│   └── views/                   # 页面组件
├── .env.development            # 开发环境变量
├── .env.production             # 生产环境变量
└── vite.config.js              # Vite配置
```

## 🛠️ 开发环境搭建

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:8080

### 构建生产版本

```bash
npm run build
```

## 🌐 API配置

后端API地址：`https://portal-api.macrozheng.com`

开发环境通过Vite代理配置实现跨域访问

## 📦 核心功能

- ✅ 用户认证（登录/注册/退出）
- ✅ 商品浏览（分类/搜索/详情）
- ✅ 购物车管理（添加/删除/数量调整）
- ✅ 订单管理（创建/支付/查看/取消）
- ✅ 用户中心（个人信息/收货地址/收藏/历史）
- ✅ 响应式布局

## 🎨 样式规范

主题色：`#fa436a`

项目提供了丰富的CSS工具类，位于 `src/assets/styles/common.scss`

## 📄 License

MIT License
