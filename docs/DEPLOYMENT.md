# 部署与运行文档

本文档覆盖本地开发、宝塔 Linux 部署、本地微信开发者工具调用公网后端、正式上线配置。

## 环境要求

### 本地开发

- Node.js 20+
- npm
- 微信开发者工具
- MySQL 5.7+/8.0

### 宝塔 Linux

- Nginx
- MySQL 5.7+/8.0
- Node.js 20.11+
- PM2 管理器

后端 `package.json` 已声明：

```json
{
  "engines": {
    "node": ">=20.11.0"
  }
}
```

## 本地后端运行

进入后端目录：

```bash
cd server
```

安装依赖：

```bash
npm install
```

创建环境变量：

```bash
cp .env.example .env
```

示例 `.env`：

```env
PORT=3000
HOST=0.0.0.0
JWT_SECRET=please-change-this-secret
CORS_ORIGIN=*

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=shangwen_ordering

WECHAT_APP_ID=
WECHAT_APP_SECRET=

UPLOAD_DIR=./uploads
PUBLIC_BASE_URL=http://127.0.0.1:3000
UPLOAD_MAX_FILE_SIZE=5242880
```

初始化数据库：

```bash
mysql -uroot -p < database/init.sql
```

启动开发服务：

```bash
npm run dev
```

健康检查：

```text
http://127.0.0.1:3000/api/health
```

## 本地前端运行

进入前端目录：

```bash
cd uniapp
```

安装依赖：

```bash
npm install
```

创建或编辑 `.env`：

```env
VITE_API_BASE_URL=http://127.0.0.1:3000/api
VITE_MOCK_WECHAT_LOGIN=true
```

运行微信小程序开发构建：

```bash
npm run dev:mp-weixin
```

微信开发者工具导入目录：

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

## 宝塔 Linux 后端部署

以下以部署目录 `/www/wwwroot/shangwen-api` 为例。

### 1. 上传代码

上传本地 `server/` 目录内容到：

```text
/www/wwwroot/shangwen-api
```

服务器上应存在：

```text
/www/wwwroot/shangwen-api/package.json
/www/wwwroot/shangwen-api/src/server.js
/www/wwwroot/shangwen-api/database/init.sql
/www/wwwroot/shangwen-api/ecosystem.config.cjs
```

不要上传本地 `node_modules`，服务器重新安装。

### 2. 创建数据库

宝塔面板：

```text
数据库 -> 添加数据库
```

推荐：

```text
数据库名：shangwen_ordering
用户名：shangwen_ordering
密码：自行生成强密码
访问权限：本地服务器
```

导入：

```text
/www/wwwroot/shangwen-api/database/init.sql
```

如果是旧库升级，再导入：

```text
/www/wwwroot/shangwen-api/database/upgrade-20260515-dish-sort.sql
```

如需测试数据，再导入：

```text
/www/wwwroot/shangwen-api/database/seed-test-data.sql
```

### 3. 配置后端 `.env`

宝塔文件管理打开：

```text
/www/wwwroot/shangwen-api/.env
```

如果没有，则复制：

```text
.env.example -> .env
```

开发阶段公网 IP 调试推荐：

```env
PORT=3000
HOST=127.0.0.1
JWT_SECRET=换成足够长的随机字符串
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

正式上线推荐：

```env
PORT=3000
HOST=127.0.0.1
JWT_SECRET=换成足够长的随机字符串
CORS_ORIGIN=*

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=shangwen_ordering
MYSQL_PASSWORD=数据库密码
MYSQL_DATABASE=shangwen_ordering

WECHAT_APP_ID=你的小程序AppID
WECHAT_APP_SECRET=你的小程序AppSecret

UPLOAD_DIR=/www/wwwroot/shangwen-api/uploads
PUBLIC_BASE_URL=https://api.example.com
UPLOAD_MAX_FILE_SIZE=5242880
```

说明：

- `HOST=127.0.0.1` 表示 Node 只在服务器本机监听，由 Nginx 对外代理。
- `PUBLIC_BASE_URL` 影响上传图片返回地址。
- 没有域名时只能用于开发调试，正式小程序必须使用 HTTPS 域名。

### 4. 安装依赖

SSH 进入目录：

```bash
cd /www/wwwroot/shangwen-api
npm ci --omit=dev
npm run check
```

### 5. PM2 启动

项目已提供：

```text
server/ecosystem.config.cjs
```

命令启动：

```bash
cd /www/wwwroot/shangwen-api
npm run pm2:start
pm2 save
```

宝塔页面启动：

```text
软件商店 -> PM2管理器 -> 添加项目/导入配置
```

配置：

```text
项目名称：shangwen-ordering-api
启动文件：src/server.js
项目目录：/www/wwwroot/shangwen-api
Node版本：20.11+
```

启动后访问服务器本机健康检查：

```text
http://127.0.0.1:3000/api/health
```

## Nginx 反向代理

目标：公网访问：

```text
http://服务器公网IP/api/health
```

转发到：

```text
http://127.0.0.1:3000/api/health
```

### 宝塔页面配置

1. 宝塔安全放行 `80` 端口。
2. 阿里云安全组放行 `80` 端口。
3. 宝塔 `网站 -> 添加站点`。
4. 没有域名时，域名填写公网 IP。
5. 站点设置为默认站点。
6. 进入站点 `设置 -> 反向代理 -> 添加反向代理`。

填写：

```text
代理名称：node-api
目标URL：http://127.0.0.1:3000
发送域名：$host
代理目录：/
缓存：关闭
```

保存后重载 Nginx。

测试：

```text
http://服务器公网IP/api/health
```

正常返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "status": "ok"
  }
}
```

## 本地微信开发者工具调用公网后端

前端 `uniapp/.env`：

```env
VITE_API_BASE_URL=http://服务器公网IP/api
VITE_MOCK_WECHAT_LOGIN=true
```

重新构建：

```bash
cd uniapp
npm run dev:mp-weixin
```

微信开发者工具导入：

```text
uniapp/dist/dev/mp-weixin
```

开发者工具勾选：

```text
详情 -> 本地设置 -> 不校验合法域名、TLS版本以及HTTPS证书
```

注意：

- `http://服务器公网IP` 只适合开发调试。
- 不要访问 `https://服务器公网IP:8888/api/...`，`8888` 是宝塔面板端口。

## 正式小程序上线要求

正式版不能直接请求公网 IP。必须配置：

1. 已备案域名，例如 `api.example.com`。
2. 域名解析到服务器公网 IP。
3. 宝塔/Nginx 配置 HTTPS 证书。
4. 微信公众平台配置合法 `request` 域名。
5. 前端 `.env`：

```env
VITE_API_BASE_URL=https://api.example.com/api
VITE_MOCK_WECHAT_LOGIN=false
```

6. 后端 `.env`：

```env
WECHAT_APP_ID=真实AppID
WECHAT_APP_SECRET=真实AppSecret
PUBLIC_BASE_URL=https://api.example.com
```

7. 重新构建小程序并上传审核。

## 常用验证命令

后端：

```bash
cd server
npm run check
```

前端：

```bash
cd uniapp
npm run type-check
npm run build:mp-weixin
```

服务器接口：

```text
GET /api/health
GET /api/categories
GET /api/dishes
```

商家端默认登录：

```text
账号：admin
密码：123456
```
