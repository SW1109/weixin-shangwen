# 接口文档

本文档按当前 `server/src/routes` 实现整理。接口统一挂载在 `/api` 下，前端通过 `uniapp/src/api` 调用。

## 基础约定

### 基础地址

本地开发：

```text
http://127.0.0.1:3000/api
```

服务器开发调试：

```text
http://服务器公网IP/api
```

正式上线：

```text
https://你的备案域名/api
```

### 响应结构

成功：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

失败：

```json
{
  "code": -1,
  "message": "错误信息",
  "data": null
}
```

### 鉴权

用户端接口使用用户 token：

```http
Authorization: Bearer <userToken>
```

商家端接口使用商家 token：

```http
Authorization: Bearer <merchantToken>
```

上传接口允许用户 token 或商家 token。

### 订单状态

| 状态值 | 含义 |
| --- | --- |
| `1` | 待支付 |
| `2` | 待配送 |
| `3` | 配送中 |
| `4` | 已完成 |
| `5` | 已取消 |

商家端允许的状态流转：

| 当前状态 | 可流转到 |
| --- | --- |
| `1` | `2`、`5` |
| `2` | `3`、`5` |
| `3` | `4` |
| `4` | 无 |
| `5` | 无 |

## 健康检查

### GET `/api/health`

用于检测 Node 服务是否启动。

返回示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "status": "ok"
  }
}
```

## 认证接口

### POST `/api/auth/wechat-login`

用户微信登录。开发阶段如果后端没有配置 `WECHAT_APP_ID` / `WECHAT_APP_SECRET`，或 `code` 以 `mock-` 开头，会生成 mock openid。

请求体：

```json
{
  "code": "mock-login-code",
  "nickName": "测试用户",
  "avatarUrl": "/static/logo.png"
}
```

返回 `data`：

```json
{
  "token": "jwt",
  "userInfo": {
    "id": 1,
    "openid": "mock-openid-mock-login-code",
    "nickName": "测试用户",
    "avatarUrl": "/static/logo.png",
    "phoneNumber": ""
  }
}
```

### POST `/api/auth/merchant-login`

商家登录。

请求体：

```json
{
  "username": "admin",
  "password": "123456"
}
```

返回 `data`：

```json
{
  "token": "jwt",
  "merchantInfo": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "storeName": "汤汤美食餐厅",
    "storePhone": "0755-12345678",
    "storeAddress": "深圳市南山区科技园",
    "status": 1
  }
}
```

### GET `/api/auth/me`

获取当前用户信息，需要用户 token。

### GET `/api/auth/merchant/me`

获取当前商家信息，需要商家 token。

### PUT `/api/auth/profile`

更新用户资料，需要用户 token。

请求体：

```json
{
  "nickName": "新昵称",
  "avatarUrl": "https://example.com/avatar.png",
  "phoneNumber": "13800000000"
}
```

## 公共接口

### GET `/api/categories`

获取启用状态的分类，按 `sort`、`id` 排序。

返回 `data`：

```json
[
  {
    "id": 1,
    "name": "热销推荐",
    "sort": 1,
    "icon": null,
    "status": 1
  }
]
```

### GET `/api/dishes`

获取上架菜品。

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `categoryId` | number | 否 | 分类 ID |
| `keyword` | string | 否 | 菜品名称关键词 |

示例：

```text
GET /api/dishes?categoryId=1&keyword=牛肉
```

返回 `data`：

```json
[
  {
    "id": 1,
    "categoryId": 1,
    "categoryName": "热销推荐",
    "name": "招牌牛肉饭",
    "image": "/static/logo.png",
    "price": 28,
    "originalPrice": 32,
    "description": "大片牛肉配秘制酱汁",
    "stock": 88,
    "sales": 126,
    "status": 1,
    "isRecommend": true,
    "tags": ["招牌", "热销"],
    "sort": 1
  }
]
```

### GET `/api/dishes/:id`

获取菜品详情。

### GET `/api/share/dishes/:id`

获取菜品 H5 分享落地页，返回 `text/html`，用于钉钉等外部 IM 读取 Open Graph 分享卡片信息。页面会包含商品标题、描述、封面图等 SEO meta，并自动跳转到 H5 菜品详情页。

示例：

```text
GET /api/share/dishes/1
```

后端需要配置 `PUBLIC_H5_BASE_URL`，例如 `http://服务器公网IP` 或 `https://你的域名`，用于生成最终跳转地址。

## 用户端接口

以下接口都需要用户 token。

### GET `/api/customer/addresses`

获取当前用户收货地址列表。

### POST `/api/customer/addresses`

新增收货地址。

请求体：

```json
{
  "name": "张三",
  "phone": "13800000000",
  "province": "广东省",
  "city": "深圳市",
  "district": "南山区",
  "detail": "科技园 1 号楼",
  "isDefault": true
}
```

### PUT `/api/customer/addresses/:id`

更新收货地址。请求体同新增地址。

### DELETE `/api/customer/addresses/:id`

删除收货地址。

### POST `/api/customer/addresses/:id/default`

设置默认地址。

### GET `/api/customer/cart`

获取远程购物车。

### PUT `/api/customer/cart`

同步购物车，会覆盖服务端当前购物车明细。

请求体：

```json
{
  "items": [
    {
      "dishId": 1,
      "quantity": 2
    }
  ]
}
```

### POST `/api/customer/orders`

创建订单。创建时会校验菜品是否存在、是否上架、库存是否足够，并扣减库存、增加销量。

请求体：

```json
{
  "addressId": 1,
  "remark": "少辣",
  "dishes": [
    {
      "dishId": 1,
      "quantity": 2
    }
  ]
}
```

返回 `data`：

```json
{
  "orderId": 1,
  "orderNo": "202605151230000001"
}
```

### GET `/api/customer/orders`

获取当前用户订单列表。

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | number | 否 | 订单状态，不传表示全部 |

### GET `/api/customer/orders/:id`

获取当前用户订单详情。

### POST `/api/customer/orders/:id/pay`

模拟支付。只有 `status=1` 且 `payStatus=0` 的订单可以支付。支付成功后订单变为 `status=2`、`payStatus=1`。

### POST `/api/customer/orders/:id/cancel`

取消订单。用户只能取消 `status=1` 或 `status=2` 的订单。取消成功后会回滚销量和库存。

## 商家端接口

以下接口都需要商家 token。

### GET `/api/merchant/dashboard`

获取商家工作台数据。

返回 `data`：

```json
{
  "todayStats": {
    "totalSales": 100,
    "totalOrders": 3,
    "paidOrders": 2,
    "totalDishes": 5,
    "avgOrderAmount": 33.33,
    "ordersByStatus": {
      "1": 0,
      "2": 1,
      "3": 1,
      "4": 1
    },
    "topDishes": []
  },
  "orderStats": {
    "unpaid": 0,
    "toDeliver": 1,
    "delivering": 1
  },
  "recentOrders": []
}
```

### GET `/api/merchant/orders`

获取全部订单。

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | number | 否 | 订单状态，不传表示全部 |

### GET `/api/merchant/orders/:id`

获取订单详情。

### POST `/api/merchant/orders/:id/status`

更新订单状态。

请求体：

```json
{
  "status": 3
}
```

### GET `/api/merchant/dishes`

获取菜品列表。商家端包含上架和下架菜品。

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `categoryId` | number | 否 | 分类 ID |

### POST `/api/merchant/dishes`

新增菜品。

请求体：

```json
{
  "categoryId": 1,
  "name": "招牌牛肉饭",
  "image": "https://example.com/uploads/a.jpg",
  "price": 28,
  "originalPrice": 32,
  "description": "大片牛肉配秘制酱汁",
  "stock": 88,
  "status": 1,
  "isRecommend": true,
  "tags": ["招牌", "热销"],
  "sort": 1
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `categoryId` | number | 是 | 分类 ID |
| `name` | string | 是 | 菜品名称 |
| `image` | string | 是 | 菜品图片地址 |
| `price` | number | 是 | 售价 |
| `originalPrice` | number/null | 否 | 原价 |
| `description` | string | 否 | 描述 |
| `stock` | number | 是 | 库存，`-1` 表示不限库存 |
| `status` | number | 是 | `1` 上架，`0` 下架 |
| `isRecommend` | boolean | 否 | 是否推荐 |
| `tags` | string[] | 否 | 标签 |
| `sort` | number | 否 | 排序值，越小越靠前 |

### PUT `/api/merchant/dishes/:id`

更新菜品。请求体同新增菜品。

### DELETE `/api/merchant/dishes/:id`

删除菜品。

### POST `/api/merchant/dishes/:id/status`

更新菜品上下架状态。

请求体：

```json
{
  "status": 0
}
```

### GET `/api/merchant/categories`

获取全部分类，包含启用和禁用分类。

### POST `/api/merchant/categories`

新增分类。

请求体：

```json
{
  "name": "主食类",
  "sort": 2,
  "icon": null,
  "status": 1
}
```

### PUT `/api/merchant/categories/:id`

更新分类。请求体同新增分类。

### DELETE `/api/merchant/categories/:id`

删除分类。如果分类下存在菜品，会返回：

```json
{
  "code": -1,
  "message": "请先删除该分类下的菜品",
  "data": null
}
```

### GET `/api/merchant/statistics`

获取经营统计。

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `range` | string | 否 | `today`、`week`、`month` |
| `startDate` | string | 否 | 自定义开始日期，例如 `2026-05-01` |
| `endDate` | string | 否 | 自定义结束日期，例如 `2026-05-15` |

如果传了 `startDate` 或 `endDate`，优先使用自定义日期范围。

## 上传接口

### POST `/api/upload/image`

上传图片，需要用户 token 或商家 token。

请求类型：

```text
multipart/form-data
```

字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | file | 是 | 图片文件 |

支持格式：

```text
jpg、png、webp、gif
```

返回 `data`：

```json
{
  "url": "https://api.example.com/uploads/1710000000000-abcd1234.jpg"
}
```

图片最大大小由后端 `.env` 的 `UPLOAD_MAX_FILE_SIZE` 控制，默认 5MB。
