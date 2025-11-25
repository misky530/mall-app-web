# B2B托管交易系统 - 登录功能说明

## 功能概述

系统已实现完整的登录认证功能，采用**B2B强制登录模式**，不允许匿名访问。

## 登录实现方式

### 混合模式：线上API + 本地存储

系统采用智能降级策略：

1. **优先使用线上API**：
   - 首先尝试调用线上登录API (`https://portal-api.macrozheng.com`)
   - 如果API调用成功，使用真实的token和用户信息

2. **自动降级到Mock模式**：
   - 如果API调用失败（网络错误、服务器问题等）
   - 自动切换到本地Mock验证
   - 验证预设的演示账号（admin/macro123, test/123456）
   - 生成本地Mock token用于演示

3. **数据存储**：
   - 购物车数据：localStorage存储
   - 订单数据：localStorage存储
   - 商品信息：从线上公开API获取（无需认证）

## 演示账号

| 用户名 | 密码 | 说明 |
|--------|------|------|
| admin  | macro123 | 管理员账号 |
| test   | 123456   | 测试账号 |

## 技术实现

### 1. 路由守卫 ([router/index.js](src/router/index.js))

```javascript
router.beforeEach((to, from, next) => {
  // B2B模式：强制登录（排除登录页和注册页）
  if (to.path !== '/login' && to.path !== '/register') {
    const token = localStorage.getItem('token')
    if (!token) {
      // 未登录，跳转到登录页
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
  }
  next()
})
```

### 2. 用户Store ([stores/user.js](src/stores/user.js))

**登录流程**：
1. 尝试调用线上API
2. 失败时自动使用Mock验证
3. 验证成功后保存token到localStorage
4. 设置用户信息

**关键方法**：
- `login(loginData)`: 登录（支持API + Mock降级）
- `logout()`: 退出登录，清除token和用户信息
- `getUserInfo()`: 获取用户详细信息

### 3. 401错误处理 ([utils/request.js](src/utils/request.js))

智能401处理机制：
```javascript
// 只有发送了认证信息的请求返回401才触发登出
if (config?._hasAuth && status === 401) {
  // 清除token，跳转登录页
} else {
  // 未认证的公开API返回401，静默失败
  console.warn('未认证的API返回401，已忽略')
}
```

这样可以避免：
- 公开API的401错误导致用户被强制登出
- 商品信息获取失败影响用户体验

## 用户界面

### 登录页 ([views/Login.vue](src/views/Login.vue))

- 渐变背景，专业的B2B风格
- 表单验证（用户名必填，密码最少6位）
- 加载状态显示
- 演示账号提示
- 回车快捷登录

### Header组件 ([components/Layout/Header.vue](src/components/Layout/Header.vue))

**已登录状态**：
- 显示用户名
- 显示"退出登录"按钮
- 访问所有功能模块

**未登录状态**：
- 自动跳转到登录页

## 使用流程

### 正常登录流程

1. 访问任意页面（除登录/注册页）
2. 系统检测到未登录，自动跳转到登录页
3. 输入用户名密码（admin / macro123）
4. 点击登录或按回车
5. 系统尝试API登录，失败则使用Mock验证
6. 登录成功，跳转到之前访问的页面或首页
7. Header显示用户名和退出按钮

### 退出登录

1. 点击Header右上角"退出登录"
2. 系统清除token和用户信息
3. 自动跳转到登录页

## 安全特性

1. ✅ **强制登录**：所有页面（除登录/注册）都需要认证
2. ✅ **Token验证**：每个请求自动携带token
3. ✅ **会话管理**：退出登录清除所有会话数据
4. ✅ **401自动处理**：token过期自动跳转登录页
5. ✅ **重定向保护**：登录后跳转回原访问页面

## 数据隔离

- 每个用户的购物车数据独立存储
- 订单数据按用户隔离
- 退出登录时清空用户相关数据

## 演示模式说明

当线上API不可用时，系统自动进入演示模式：
- 使用本地Mock验证
- Token格式：`mock_token_<timestamp>`
- 提示信息：「登录成功（演示模式）」
- 所有功能正常使用，数据存储在localStorage

## 注意事项

1. **首次访问**：系统会自动跳转到登录页
2. **刷新页面**：token保存在localStorage，刷新后仍保持登录状态
3. **清除缓存**：清除浏览器localStorage会导致需要重新登录
4. **多标签页**：同一浏览器的多个标签页共享登录状态

## 开发者提示

### 添加新的受保护页面

新页面会自动受到路由守卫保护，无需额外配置。

### 自定义认证逻辑

修改 `src/stores/user.js` 中的 `login` 方法即可。

### 添加新的Mock账号

```javascript
const mockUsers = [
  { username: 'admin', password: 'macro123' },
  { username: 'test', password: '123456' },
  { username: 'newuser', password: 'password' } // 添加新账号
]
```

## 技术栈

- Vue 3 Composition API
- Pinia 状态管理
- Vue Router 路由管理
- Element Plus UI组件
- Axios HTTP客户端
- localStorage 数据持久化
