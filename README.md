# 汤汤点餐小程序

汤汤点餐是一个从原生微信小程序重构而来的点餐系统，当前版本由两部分组成：

- `uniapp/`：Vue 3 + TypeScript + uni-app 微信小程序前端。
- `server/`：Node.js + Fastify + MySQL 后端服务，适配宝塔 Linux + PM2 + Nginx 部署。

当前项目同时覆盖用户点餐端和商家管理端。用户端用于浏览菜品、购物车、下单、支付模拟、订单查询和地址管理；商家端用于订单处理、菜品管理、分类管理、图片上传和经营统计。

## 功能概览

### 用户端

- 菜品分类、搜索、详情页。
- 购物车增减、清空、结算。
- 用户登录，支持本地 mock 微信登录和真实微信 `code2session`。
- 收货地址新增、编辑、删除、默认地址。
- 创建订单、模拟支付、取消订单。
- 订单列表、订单详情、不同状态筛选。
- 个人中心、资料编辑、头像上传。

### 商家端

- 商家账号登录，默认账号见数据库说明。
- 工作台：今日销售额、订单数、菜品数、订单状态、热销菜品、最近订单。
- 订单管理：待支付、待配送、配送中、已完成等状态筛选。
- 订单详情：客户信息、配送地址、菜品清单、订单状态流转。
- 菜品管理：新增、编辑、删除、上下架、排序、标签、推荐菜、图片上传。
- 分类管理：新增、编辑、删除、启用/禁用、排序。
- 经营统计：今日、近 7 天、近 30 天销售统计与热销排行。
- 商家订单页面已用可见页面轮询适配原生云数据库 `watchOrders` 的准实时体验。

## 技术栈

### 前端

- Vue 3
- TypeScript
- uni-app
- Pinia
- SCSS
- 微信小程序构建目标：`mp-weixin`

### 后端

- Node.js `>=20.11.0`
- Fastify 5
- MySQL 5.7+/8.0
- JWT 鉴权
- Fastify multipart/static 图片上传与静态访问
- PM2 常驻运行

## 目录结构

```text
weixin-shangwen/
├── README.md                         # 项目总说明
├── docs/                             # 详细文档
│   ├── DEPLOYMENT.md                 # 本地、宝塔、微信开发者工具部署
│   ├── FRONTEND.md                   # 前端页面、构建、主题说明
│   ├── API.md                        # 后端接口清单
│   ├── DATABASE.md                   # 数据库、升级、测试数据
│   └── TROUBLESHOOTING.md            # 常见问题
├── server/                           # Node.js 后端
│   ├── src/
│   │   ├── routes/                   # auth/common/customer/merchant/upload
│   │   ├── lib/                      # DB、认证、订单、数据映射
│   │   ├── app.js                    # Fastify app
│   │   └── server.js                 # 启动入口
│   ├── database/
│   │   ├── init.sql                  # 初始化库表和默认商家
│   │   ├── upgrade-20260515-dish-sort.sql
│   │   └── seed-test-data.sql        # 测试数据
│   ├── .env.example
│   └── ecosystem.config.cjs          # PM2 配置
├── uniapp/                           # uni-app 前端
│   ├── src/
│   │   ├── api/                      # HTTP API 封装
│   │   ├── components/               # 公共组件
│   │   ├── composables/              # 登录守卫、可见轮询等
│   │   ├── pages/customer/           # 用户端页面
│   │   ├── pages/merchant/           # 商家端页面
│   │   ├── stores/                   # Pinia store
│   │   └── utils/                    # 格式化、请求、订单工具
│   ├── pages.json
│   └── package.json
└── 重构实施说明.md                    # 历史重构说明
```

## 快速开始

### 1. 启动后端

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

后端默认地址：

```text
http://127.0.0.1:3000/api
```

健康检查：

```text
GET http://127.0.0.1:3000/api/health
```

数据库初始化、`.env` 配置和宝塔部署见 [部署文档](docs/DEPLOYMENT.md) 与 [数据库文档](docs/DATABASE.md)。

### 2. 启动前端

编辑 `uniapp/.env`：

```env
VITE_API_BASE_URL=http://127.0.0.1:3000/api
VITE_MOCK_WECHAT_LOGIN=true
```

运行：

```bash
cd uniapp
npm install
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

生产构建产物：

```text
uniapp/dist/build/mp-weixin
```

## 默认账号与测试数据

初始化 SQL 会创建默认商家账号：

```text
账号：admin
密码：123456
```

测试菜品、用户、地址、订单可导入：

```text
server/database/seed-test-data.sql
```

详情见 [数据库文档](docs/DATABASE.md)。

## 部署建议

开发阶段可以用公网 IP + 微信开发者工具关闭合法域名校验：

```text
VITE_API_BASE_URL=http://服务器公网IP/api
```

正式版必须使用：

- 已备案域名。
- HTTPS。
- 微信公众平台配置合法 `request` 域名。
- 前端关闭 mock 登录：`VITE_MOCK_WECHAT_LOGIN=false`。
- 后端配置真实 `WECHAT_APP_ID` / `WECHAT_APP_SECRET`。

详细步骤见 [部署文档](docs/DEPLOYMENT.md)。

## 当前验证状态

已验证：

```bash
cd server && npm run check
cd uniapp && vue-tsc --noEmit
cd uniapp && npm run build:mp-weixin
```

注意：前端类型检查和构建建议使用 Node.js 20+。如果本机默认 Node 是 14，会因为依赖包语法较新而失败。

## 相关文档

- [部署文档](docs/DEPLOYMENT.md)
- [前端说明](docs/FRONTEND.md)
- [接口文档](docs/API.md)
- [数据库文档](docs/DATABASE.md)
- [常见问题](docs/TROUBLESHOOTING.md)
