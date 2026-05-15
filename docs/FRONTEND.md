# 前端说明

当前前端位于 `uniapp/`，使用 Vue 3 + TypeScript + uni-app 开发，构建目标是微信小程序 `mp-weixin`。

## 技术栈

| 技术 | 用途 |
| --- | --- |
| Vue 3 | 页面和组件 |
| TypeScript | 类型约束 |
| uni-app | 多端编译，当前主要编译微信小程序 |
| Pinia | 登录、购物车、菜品等状态管理 |
| SCSS | 全局主题和页面样式 |

## 目录结构

```text
uniapp/
├── src/
│   ├── api/                  # auth/customer/merchant/upload 接口封装
│   ├── components/           # 通用组件、用户端组件、商家端组件
│   ├── composables/          # 登录守卫、商家守卫、页面可见轮询
│   ├── config/               # 环境变量读取
│   ├── pages/customer/       # 用户端页面
│   ├── pages/merchant/       # 商家端页面
│   ├── stores/               # Pinia store
│   ├── types/                # 前端模型类型
│   └── utils/                # 请求、格式化、订单、缓存工具
├── src/pages.json            # 页面和 tabBar 配置
├── src/App.vue               # 全局样式和主题变量
├── package.json
└── .env
```

## 环境变量

文件：

```text
uniapp/.env
```

本地后端：

```env
VITE_API_BASE_URL=http://127.0.0.1:3000/api
VITE_MOCK_WECHAT_LOGIN=true
```

公网 IP 调试：

```env
VITE_API_BASE_URL=http://39.97.44.248/api
VITE_MOCK_WECHAT_LOGIN=true
```

正式上线：

```env
VITE_API_BASE_URL=https://你的备案域名/api
VITE_MOCK_WECHAT_LOGIN=false
```

说明：

| 变量 | 说明 |
| --- | --- |
| `VITE_API_BASE_URL` | 后端接口基础地址，必须包含 `/api` |
| `VITE_MOCK_WECHAT_LOGIN` | 是否启用本地 mock 微信登录 |

## 运行和构建

安装依赖：

```bash
cd uniapp
npm install
```

开发构建：

```bash
npm run dev:mp-weixin
```

微信开发者工具导入：

```text
uniapp/dist/dev/mp-weixin
```

生产构建：

```bash
npm run build:mp-weixin
```

生产产物：

```text
uniapp/dist/build/mp-weixin
```

类型检查：

```bash
npm run type-check
```

如果 `dev:mp-weixin` 一直运行，修改源码后通常会自动重新编译。微信开发者工具没刷新时，点击“编译”或清缓存。

## 用户端页面

| 页面 | 路径 | 功能 |
| --- | --- | --- |
| 首页点餐 | `src/pages/customer/home/index.vue` | 分类、搜索、菜品列表、加购入口 |
| 菜品详情 | `src/pages/customer/dish/index.vue` | 菜品图片、价格、标签、库存、加入购物车 |
| 购物车 | `src/pages/customer/cart/index.vue` | 数量增减、清空、结算 |
| 确认订单 | `src/pages/customer/order-confirm/index.vue` | 选择地址、备注、提交订单 |
| 订单列表 | `src/pages/customer/order/index.vue` | 状态筛选、订单卡片 |
| 订单详情 | `src/pages/customer/order-detail/index.vue` | 订单信息、支付、取消 |
| 地址列表 | `src/pages/customer/address/index.vue` | 地址增删改、默认地址 |
| 地址编辑 | `src/pages/customer/address-edit/index.vue` | 新增或编辑收货地址 |
| 用户登录 | `src/pages/customer/login/index.vue` | mock 登录或微信登录 |
| 个人中心 | `src/pages/customer/profile/index.vue` | 用户资料、地址、订单入口 |
| 资料编辑 | `src/pages/customer/profile-edit/index.vue` | 昵称、头像、手机号 |

## 商家端页面

| 页面 | 路径 | 功能 |
| --- | --- | --- |
| 商家登录 | `src/pages/merchant/login/index.vue` | 商家账号密码登录 |
| 工作台 | `src/pages/merchant/dashboard/index.vue` | 今日数据、订单状态、最近订单 |
| 订单管理 | `src/pages/merchant/order/index.vue` | 订单状态筛选、准实时刷新 |
| 订单详情 | `src/pages/merchant/order-detail/index.vue` | 客户信息、菜品、状态流转 |
| 菜品管理 | `src/pages/merchant/dish/index.vue` | 菜品列表、上下架、删除 |
| 菜品编辑 | `src/pages/merchant/dish-edit/index.vue` | 新增、编辑、图片上传、排序、标签 |
| 分类管理 | `src/pages/merchant/category/index.vue` | 分类新增、编辑、删除、启用状态 |
| 经营统计 | `src/pages/merchant/statistics/index.vue` | 今日、近 7 天、近 30 天统计 |

## 状态管理

| Store | 路径 | 说明 |
| --- | --- | --- |
| Auth | `src/stores/auth.ts` | 用户 token、商家 token、登录状态 |
| Cart | `src/stores/cart.ts` | 本地购物车、远程同步、总价数量 |
| Catalog | `src/stores/catalog.ts` | 分类、菜品列表、菜品加载 |

## 请求封装

请求封装位于：

```text
src/utils/request.ts
```

已处理的问题：

| 问题 | 当前处理 |
| --- | --- |
| GET 参数出现 `undefined` | 请求前递归过滤 `undefined` |
| DELETE 无 body 但带 JSON 头 | 非 GET 请求自动补 `{}` |
| 用户和商家鉴权 | 根据 `auth` 参数自动携带对应 token |
| 后端统一响应结构 | 自动解析 `code/message/data` |

## 登录策略

开发阶段：

| 配置 | 行为 |
| --- | --- |
| `VITE_MOCK_WECHAT_LOGIN=true` | 前端生成 mock code，后端生成 mock openid |
| 后端未配置微信密钥 | 即使传真实 code，也会走 mock openid |

正式上线：

| 配置 | 行为 |
| --- | --- |
| `VITE_MOCK_WECHAT_LOGIN=false` | 使用微信登录 code |
| `WECHAT_APP_ID` / `WECHAT_APP_SECRET` | 后端调用微信 `code2session` |

## UI 主题

当前 UI 使用 `#AC27ED` 作为紫色主色，同时控制背景色饱和度，避免大面积背景过重或过亮。主要视觉方向：

| 项 | 说明 |
| --- | --- |
| 主色 | `#AC27ED` 紫色，用于导航、按钮、选中态和强调文字 |
| 背景 | 低饱和浅紫灰，用于页面、分区和底部浮层 |
| 按钮 | 增大点击区域，强调主操作 |
| 图标 | 放大关键 icon，避免显示过小 |
| 卡片 | 控制背景对比度，避免文字看不清 |

主要位置：

```text
src/App.vue
src/uni.scss
src/pages.json
```

## 真实机和上线注意事项

开发者工具调试公网 IP 时需要勾选：

```text
详情 -> 本地设置 -> 不校验合法域名、TLS版本以及HTTPS证书
```

正式小程序必须满足：

| 要求 | 说明 |
| --- | --- |
| 域名 | 不能使用纯 IP |
| HTTPS | 必须配置有效证书 |
| 微信后台 | 配置合法 `request` 域名 |
| mock 登录 | 必须关闭 |
| 后端微信密钥 | 必须配置真实 `AppID` / `AppSecret` |
