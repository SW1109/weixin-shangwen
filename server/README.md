# 上文点餐 Node 后端

这是上文点餐小程序的 HTTP 后端服务，使用 Node.js + Fastify + MySQL 实现，替代原生微信小程序云函数。

## 功能范围

| 模块 | 功能 |
| --- | --- |
| 认证 | 用户微信登录、商家账号登录、当前会话、用户资料更新 |
| 公共数据 | 分类、菜品列表、菜品详情 |
| 用户端 | 地址、购物车、下单、订单列表、订单详情、模拟支付、取消订单 |
| 商家端 | 工作台、订单处理、菜品管理、分类管理、经营统计 |
| 上传 | 图片上传，支持用户和商家 token |

## 环境要求

```text
Node.js >= 20.11.0
MySQL 5.7+ / 8.0
```

## 本地运行

```bash
npm install
cp .env.example .env
mysql -uroot -p < database/init.sql
npm run dev
```

健康检查：

```text
http://127.0.0.1:3000/api/health
```

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 本地开发，使用 Node watch |
| `npm run start` | 普通启动 |
| `npm run check` | JS 语法检查 |
| `npm run pm2:start` | 使用 `ecosystem.config.cjs` 启动 PM2 |

## 环境变量

复制 `.env.example` 为 `.env` 后修改：

```env
PORT=3000
HOST=127.0.0.1
JWT_SECRET=please-change-this-secret
CORS_ORIGIN=*

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=shangwen_ordering
MYSQL_PASSWORD=数据库密码
MYSQL_DATABASE=shangwen_ordering

WECHAT_APP_ID=
WECHAT_APP_SECRET=

UPLOAD_DIR=/www/wwwroot/shangwen-api/uploads
PUBLIC_BASE_URL=http://服务器公网IP
UPLOAD_MAX_FILE_SIZE=5242880
```

正式上线时 `PUBLIC_BASE_URL` 应改为 HTTPS 域名，并配置真实微信小程序 `AppID` / `AppSecret`。

## 数据库

| 文件 | 说明 |
| --- | --- |
| `database/init.sql` | 初始化库表和默认商家账号 |
| `database/upgrade-20260515-dish-sort.sql` | 旧库升级脚本 |
| `database/seed-test-data.sql` | 测试数据脚本 |

默认商家账号：

```text
admin / 123456
```

## 部署

宝塔 Linux 推荐部署目录：

```text
/www/wwwroot/shangwen-api
```

部署方式：

| 步骤 | 操作 |
| --- | --- |
| 1 | 上传 `server/` 内容到部署目录 |
| 2 | 宝塔创建 MySQL 数据库并导入 `database/init.sql` |
| 3 | 配置 `.env` |
| 4 | 执行 `npm ci --omit=dev` |
| 5 | 使用 PM2 启动 |
| 6 | Nginx 反向代理到 `http://127.0.0.1:3000` |

详细部署、接口、数据库和排错文档见项目根目录：

| 文档 | 路径 |
| --- | --- |
| 项目总览 | `../README.md` |
| 部署文档 | `../docs/DEPLOYMENT.md` |
| 前端说明 | `../docs/FRONTEND.md` |
| 接口文档 | `../docs/API.md` |
| 数据库文档 | `../docs/DATABASE.md` |
| 常见问题 | `../docs/TROUBLESHOOTING.md` |
