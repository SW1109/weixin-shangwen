# 点餐微信小程序系统

一个完整的点餐系统，包含客户端和商家管理端两个小程序，使用微信小程序原生框架和腾讯云开发（CloudBase）。


#bc0bf6

## 📱 项目结构

```
weixin-shangwen/
├── customer-app/          # 客户小程序
│   ├── pages/            # 页面
│   ├── utils/            # 工具函数
│   ├── app.js           # 应用入口
│   ├── app.json         # 应用配置
│   ├── app.wxss         # 全局样式
    ├── cloudfunctions/        # 云函数
│   ├── login/            # 用户登录
│   ├── merchantLogin/    # 商家登录
│   ├── createOrder/      # 创建订单
│   ├── payOrder/         # 订单支付
│   ├── updateOrderStatus/# 更新订单状态
│   ├── manageDish/       # 管理菜品
│   └── getStatistics/    # 获取统计数据
├── 需求文档.md
├── 系统设计.md
└── README.md
```

## ✨ 功能特性

### 客户小程序
- ✅ 微信授权登录
- ✅ 菜品分类浏览
- ✅ 菜品搜索
- ✅ 购物车管理
- ✅ 订单提交
- ✅ 在线支付（模拟）
- ✅ 订单查看与追踪
- ✅ 收货地址管理
- ✅ 个人中心

### 商家管理小程序
- ✅ 商家账号登录
- ✅ 菜品增删改查
- ✅ 菜品上下架
- ✅ 库存管理
- ✅ 分类管理
- ✅ 实时接收新订单
- ✅ 订单状态管理
- ✅ 销售数据统计
- ✅ 热销菜品排行

### 数据实时同步
- ✅ 客户下单 → 商家端实时显示
- ✅ 商家修改菜品 → 客户端立即生效
- ✅ 订单状态更新双向同步

## 🚀 快速开始

### 1. 环境准备

- 微信开发者工具（最新版）
- 微信小程序账号（AppID）
- 腾讯云开发环境

### 2. 创建云开发环境

1. 打开微信开发者工具
2. 新建小程序项目，选择云开发模板
3. 在云开发控制台创建环境
4. 获取环境 ID（env-xxxxx）

### 3. 配置项目

#### 3.1 配置客户小程序

编辑 `customer-app/project.config.json`：
```json
{
  "appid": "wx21144b5e33c0dd44",
  "cloudfunctionRoot": "../cloudfunctions/"
}
```

编辑 `customer-app/app.js`：
```javascript
wx.cloud.init({
  env: 'your-env-id', // 替换为您的云环境 ID
  traceUser: true,
})
```

#### 3.2 配置商家管理小程序

编辑 `merchant-app/project.config.json`：
```json
{
  "appid": "your-merchant-appid",
  "cloudfunctionRoot": "../cloudfunctions/"
}
```

编辑 `merchant-app/app.js`：
```javascript
wx.cloud.init({
  env: 'your-env-id', // 使用相同的云环境 ID
  traceUser: true,
})
```

### 4. 上传云函数

在微信开发者工具中：

1. 右键点击 `cloudfunctions/login` → 上传并部署：云端安装依赖
2. 依次上传所有云函数：
   - login
   - merchantLogin
   - createOrder
   - payOrder
   - updateOrderStatus
   - manageDish
   - getStatistics

### 5. 初始化数据库

在云开发控制台 → 数据库 → 新建集合，创建以下集合：

- `users` - 用户信息
- `categories` - 菜品分类
- `dishes` - 菜品信息
- `orders` - 订单数据
- `addresses` - 收货地址
- `merchants` - 商家账号
- `carts` - 购物车

#### 5.1 创建商家账号

在 `merchants` 集合中添加记录：
```json
{
  "username": "admin",
  "password": "e10adc3949ba59abbe56e057f20f883e",
  "role": "admin",
  "storeName": "美食餐厅",
  "storePhone": "0755-12345678",
  "storeAddress": "深圳市南山区科技园",
  "status": 1,
  "createTime": "2024-01-07T00:00:00.000Z",
  "updateTime": "2024-01-07T00:00:00.000Z"
}
```
注：默认密码为 `123456`（MD5加密后）

#### 5.2 创建菜品分类

在 `categories` 集合中添加记录：
```json
[
  {
    "name": "热销推荐",
    "sort": 1,
    "status": 1,
    "createTime": "2024-01-07T00:00:00.000Z",
    "updateTime": "2024-01-07T00:00:00.000Z"
  },
  {
    "name": "主食类",
    "sort": 2,
    "status": 1,
    "createTime": "2024-01-07T00:00:00.000Z",
    "updateTime": "2024-01-07T00:00:00.000Z"
  },
  {
    "name": "小吃类",
    "sort": 3,
    "status": 1,
    "createTime": "2024-01-07T00:00:00.000Z",
    "updateTime": "2024-01-07T00:00:00.000Z"
  },
  {
    "name": "饮品类",
    "sort": 4,
    "status": 1,
    "createTime": "2024-01-07T00:00:00.000Z",
    "updateTime": "2024-01-07T00:00:00.000Z"
  }
]
```

### 6. 设置数据库权限

在云开发控制台 → 数据库 → 权限设置：

#### users 集合
```json
{
  "read": "auth.openid == doc._openid",
  "write": "auth.openid == doc._openid"
}
```

#### categories 集合
```json
{
  "read": true,
  "write": false
}
```

#### dishes 集合
```json
{
  "read": "doc.status == 1",
  "write": false
}
```

#### orders 集合
```json
{
  "read": "auth.openid == doc._openid",
  "write": "auth.openid == doc._openid"
}
```

#### addresses 集合
```json
{
  "read": "auth.openid == doc._openid",
  "write": "auth.openid == doc._openid"
}
```

#### merchants 集合
```json
{
  "read": false,
  "write": false
}
```

#### carts 集合
```json
{
  "read": "auth.openid == doc._openid",
  "write": "auth.openid == doc._openid"
}
```

### 7. 运行项目

#### 7.1 运行客户小程序
1. 打开微信开发者工具
2. 导入 `customer-app` 目录
3. 点击编译运行

#### 7.2 运行商家管理小程序
1. 打开微信开发者工具
2. 导入 `merchant-app` 目录
3. 点击编译运行
4. 使用默认账号登录：
   - 账号：`admin`
   - 密码：`123456`

## 📖 使用说明

### 客户端使用流程

1. **登录**：打开小程序，点击授权登录
2. **浏览菜品**：在首页浏览各分类菜品
3. **加入购物车**：点击"+"按钮将菜品加入购物车
4. **提交订单**：
   - 点击底部购物车按钮
   - 确认商品信息
   - 选择/添加收货地址
   - 提交订单
5. **支付订单**：点击支付按钮完成支付
6. **查看订单**：在"订单"标签页查看订单状态

### 商家端使用流程

1. **登录**：使用商家账号登录
2. **查看订单**：
   - 在"订单"标签页查看所有订单
   - 点击订单卡片查看详情
   - 更新订单状态
3. **管理菜品**：
   - 在"菜品"标签页查看所有菜品
   - 点击"添加"按钮添加新菜品
   - 点击菜品卡片进行编辑或删除
4. **查看统计**：在"统计"标签页查看销售数据

## 🔧 技术栈

- **前端框架**：微信小程序原生
- **后端服务**：腾讯云开发 CloudBase
- **数据库**：CloudBase 云数据库（NoSQL）
- **云存储**：CloudBase 云存储
- **云函数**：Node.js

## 📊 数据库结构

### users - 用户信息
```javascript
{
  _id: "auto",
  _openid: "user_openid",
  nickName: "张三",
  avatarUrl: "https://...",
  phoneNumber: "13800138000",
  createTime: Date,
  updateTime: Date
}
```

### dishes - 菜品信息
```javascript
{
  _id: "auto",
  name: "宫保鸡丁",
  categoryId: "category_id",
  categoryName: "热销推荐",
  image: "cloud://...",
  price: 28.00,
  description: "经典川菜...",
  stock: 100,
  sales: 256,
  status: 1,
  isRecommend: false,
  tags: ["辣", "热销"],
  createTime: Date,
  updateTime: Date
}
```

### orders - 订单信息
```javascript
{
  _id: "auto",
  orderNo: "202401070001",
  _openid: "user_openid",
  userInfo: { nickName, avatarUrl, phoneNumber },
  dishes: [{ dishId, name, image, price, quantity }],
  totalAmount: 56.00,
  address: { name, phone, province, city, district, detail },
  remark: "少放辣",
  status: 1, // 1-待支付，2-待配送，3-配送中，4-已完成，5-已取消
  payStatus: 0, // 0-未支付，1-已支付
  payTime: Date,
  createTime: Date,
  updateTime: Date,
  completeTime: Date
}
```

## 🎯 核心功能实现

### 数据实时同步

使用 CloudBase 数据库 watch 功能实现实时同步：

```javascript
// 客户端监听订单状态变化
const watcher = db.collection('orders')
  .doc(orderId)
  .watch({
    onChange: (snapshot) => {
      // 订单状态更新时自动刷新
      this.setData({ order: snapshot.docs[0] })
    }
  })

// 商家端监听新订单
const watcher = db.collection('orders')
  .where({ status: 1 })
  .watch({
    onChange: (snapshot) => {
      // 有新订单时提醒商家
      wx.showToast({ title: '收到新订单' })
    }
  })
```

### 库存管理

创建订单时使用云函数扣减库存，防止超卖：

```javascript
// 扣减库存（原子操作）
await db.collection('dishes')
  .doc(dishId)
  .update({
    data: {
      stock: _.inc(-quantity),
      sales: _.inc(quantity)
    }
  })
```

## 🔐 安全说明

1. **数据库权限**：使用 CloudBase 安全规则限制数据访问
2. **敏感操作**：通过云函数执行，防止客户端篡改
3. **商家验证**：商家操作需要身份验证
4. **金额验证**：订单金额在服务端计算和验证

## 📝 待优化项

- [ ] 接入真实微信支付
- [ ] 添加订单退款功能
- [ ] 实现优惠券系统
- [ ] 添加菜品评价功能
- [ ] 实现多商家支持
- [ ] 添加配送员端
- [ ] 地图配送追踪
- [ ] 数据报表导出

## 🐛 常见问题

### 1. 云函数调用失败
- 检查云函数是否上传成功
- 检查云环境 ID 是否配置正确
- 查看云函数日志排查错误

### 2. 图片无法显示
- 检查云存储权限是否设置为公开读
- 确认图片路径格式正确（cloud://...）

### 3. 数据库操作失败
- 检查数据库权限设置
- 确认集合名称正确
- 查看控制台错误信息

### 4. 商家无法登录
- 确认 merchants 集合中已添加商家账号
- 检查密码是否为 MD5 加密后的值
- 默认密码 `123456` 的 MD5 值：`e10adc3949ba59abbe56e057f20f883e`

## 📄 许可证

MIT License

## 👥 联系方式

如有问题或建议，欢迎提Issue或PR。
