# B2B 担保交易流程数据衔接修复说明

## 修复内容

### 1. 数据流转修复

#### 买家上传凭证 → 经办人审核
- **修复前**：买家上传凭证后，订单状态更新为 `PAID_PENDING_VERIFY`，但经办人页面使用的是 Mock 数据，无法看到买家上传的凭证
- **修复后**：
  - 买家提交付款凭证时，订单数据（包括 `paymentVouchers`）保存到 `localStorage`
  - 经办人页面从 `localStorage` 读取所有状态为 `PAID_PENDING_VERIFY` 的订单
  - 只显示有付款凭证的订单

#### 经办人确认收款 → 卖家发货
- **修复前**：经办人确认收款后，只更新了内存中的订单对象，没有保存到 `localStorage`，卖家看不到
- **修复后**：
  - 经办人确认收款后，订单状态更新为 `PROCESSING`，并保存到 `localStorage`
  - 经办人驳回后，订单状态回退为 `CREATED`，清空付款凭证，并保存到 `localStorage`
  - 卖家页面从 `localStorage` 读取状态为 `PROCESSING` 的订单（待发货）

#### 卖家发货 → 买家验收
- **修复前**：发货页面使用 Mock 数据
- **修复后**：
  - 发货页面从 `localStorage` 读取真实订单数据
  - 发货后，订单状态更新为 `SHIPPED`，并保存到 `localStorage`
  - 买家可以在订单列表中看到已发货的订单，进行验收操作

### 2. 页面数据读取优化

#### 经办人页面 (`/agent/payment/verify`)
- 从 `localStorage` 读取所有订单
- 过滤出状态为 `PAID_PENDING_VERIFY` 且有付款凭证的订单
- 按付款时间倒序排列

#### 卖家订单列表 (`/seller/order/list`)
- 从 `localStorage` 读取所有订单
- 过滤出状态为 `PROCESSING`（待发货）、`SHIPPED`（已发货）、`COMPLETED`（待结算）、`SETTLED`（已结算）的订单

#### 卖家发货页面 (`/seller/order/ship/:id`)
- 从 `localStorage` 读取指定订单
- 验证订单状态为 `PROCESSING` 才能发货
- 发货后更新订单状态为 `SHIPPED` 并保存

### 3. 数据字段兼容性处理

- 处理了地址字段的兼容性（`receiverAddress` vs `receiverProvince/City/Region/DetailAddress`）
- 处理了商品图片字段的兼容性（`productPic` vs `pic`）
- 添加了图片加载错误处理

## 完整流程演示

### 步骤 1：买家下单并上传凭证
1. 买家在购物车选择商品，点击"结算"
2. 填写收货地址和发票信息，提交订单
3. 订单状态：`CREATED`（待付款）
4. 跳转到支付页面，显示收款账户信息
5. 上传付款凭证（图片/PDF）
6. 点击"我已付款，提交凭证"
7. 订单状态更新为：`PAID_PENDING_VERIFY`（待确认收款）
8. 订单数据保存到 `localStorage`

### 步骤 2：经办人审核收款
1. 点击 Header 中的"经办人"链接，进入 `/agent/payment/verify`
2. 页面显示所有待确认收款的订单（从 `localStorage` 读取）
3. 查看订单信息和付款凭证
4. 选择操作：
   - **确认到账**：订单状态更新为 `PROCESSING`（待发货），保存到 `localStorage`
   - **驳回**：订单状态回退为 `CREATED`，清空付款凭证，保存到 `localStorage`

### 步骤 3：卖家发货
1. 点击 Header 中的"卖家中心"链接，进入 `/seller/order/list`
2. 页面显示所有待发货的订单（状态为 `PROCESSING`）
3. 点击"发货"按钮，进入发货页面
4. 填写物流信息（物流公司、物流单号、备注）
5. 提交发货
6. 订单状态更新为 `SHIPPED`（待验收），保存到 `localStorage`

### 步骤 4：买家验收
1. 买家在"我的订单"中看到已发货的订单
2. 点击"去验收"按钮
3. 选择验收结果：
   - **验收通过**：订单状态更新为 `COMPLETED`（待结算）
   - **验收失败**：填写失败原因和证据，订单状态更新为 `INSPECTION_FAIL`

## 关于经办人页面

### 当前实现
- 经办人页面已在 PC 端前台实现（`/agent/payment/verify`）
- 可以通过 Header 中的"经办人"链接访问
- 功能完整，可以正常演示流程

### 需求说明
根据 `req/担保交易需求.md`，经办人端应该在**管理后台（Admin Panel）**实现，而不是 PC 端前台。

### 建议
1. **演示阶段**：保留当前 PC 端的经办人页面，方便演示完整流程
2. **正式上线**：
   - 将经办人功能迁移到独立的管理后台系统
   - 从 PC 端移除经办人入口和路由
   - 管理后台需要实现：
     - 财务审核（收款确认/驳回）
     - 售后/仲裁（验收异议处理）
     - 结算管理（待结算/已结算）

### 如需移除经办人页面
如果现在就想移除 PC 端的经办人页面，可以：
1. 删除 `mall-pc/src/views/Agent/PaymentVerify.vue`
2. 删除 `mall-pc/src/router/routes.js` 中的经办人路由配置
3. 删除 `mall-pc/src/components/Layout/Header.vue` 中的"经办人"链接

## 数据存储说明

所有订单数据目前存储在 `localStorage` 中，格式为：
- Key: `order_{orderId}`
- Value: JSON 格式的订单对象

订单对象包含的字段：
- `id`: 订单ID
- `orderSn`: 订单号
- `status`: 订单状态（`CREATED`, `PAID_PENDING_VERIFY`, `PROCESSING`, `SHIPPED`, `COMPLETED`, `SETTLED`, `INSPECTION_FAIL`）
- `statusName`: 订单状态显示名称
- `paymentVouchers`: 付款凭证数组（图片URL）
- `items`: 订单商品列表
- `receiverName`, `receiverPhone`, `receiverAddress`: 收货信息
- `deliveryCompany`, `deliverySn`, `deliveryTime`: 物流信息
- 其他订单相关字段

## 注意事项

1. **数据持久化**：`localStorage` 的数据在浏览器清除缓存后会丢失，正式环境需要使用后端 API
2. **权限控制**：当前没有实现角色权限控制，任何人都可以访问经办人和卖家页面。正式环境需要添加权限验证
3. **数据同步**：多个标签页之间不会自动同步数据，刷新页面后数据会更新

