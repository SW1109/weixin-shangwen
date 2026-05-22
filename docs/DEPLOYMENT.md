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

H5 构建：

```bash
npm run build:h5
```

H5 构建产物：

```text
uniapp/dist/build/h5
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

## 宝塔部署 H5 前端

当前 H5 是纯静态文件，可以部署到宝塔网站目录，通过公网 IP 直接访问。推荐结构：

| 路径 | 用途 |
| --- | --- |
| `/www/wwwroot/shangwen-h5` | H5 静态页面 |
| `/www/wwwroot/shangwen-api` | Node 后端服务 |

目标访问方式：

```text
http://服务器公网IP/
```

接口继续走同一个 IP 的 `/api`：

```text
http://服务器公网IP/api
```

上传图片继续走同一个 IP 的 `/uploads`：

```text
http://服务器公网IP/uploads/文件名
```

### 1. 配置前端接口地址

备案域名未完成前，建议 H5 构建时使用同源接口：

```env
VITE_API_BASE_URL=/api
VITE_MOCK_WECHAT_LOGIN=true
```

也可以直接写公网 IP：

```env
VITE_API_BASE_URL=http://服务器公网IP/api
VITE_MOCK_WECHAT_LOGIN=true
```

区别：

| 配置 | 说明 |
| --- | --- |
| `/api` | 推荐，H5 页面和接口同源，后续换域名时前端可少改 |
| `http://服务器公网IP/api` | 明确指向 IP，适合临时测试 |

正式域名启用后改为：

```env
VITE_API_BASE_URL=https://你的域名/api
VITE_MOCK_WECHAT_LOGIN=false
```

### 2. 本地构建 H5

```bash
cd uniapp
npm install
npm run build:h5
```

构建完成后上传这个目录里面的所有内容：

```text
uniapp/dist/build/h5/
```

注意是上传 `h5` 目录里面的文件，不是把 `h5` 文件夹整体套一层上传。

### 3. 宝塔创建 H5 站点

宝塔页面：

```text
网站 -> 添加站点
```

填写：

```text
域名：服务器公网IP
根目录：/www/wwwroot/shangwen-h5
PHP版本：纯静态
数据库：不创建
```

如果这个公网 IP 已经有站点，直接使用现有站点也可以，但根目录应指向：

```text
/www/wwwroot/shangwen-h5
```

### 4. 上传前端文件

宝塔页面：

```text
文件 -> /www/wwwroot/shangwen-h5
```

上传本地：

```text
uniapp/dist/build/h5/
```

上传后服务器目录应类似：

```text
/www/wwwroot/shangwen-h5/index.html
/www/wwwroot/shangwen-h5/assets/
```

### 5. 调整反向代理

如果之前为了后端调试，把站点 `/` 全部反向代理到了 Node，需要改掉。H5 部署后：

| 路径 | 处理方式 |
| --- | --- |
| `/` | 静态文件，指向 `/www/wwwroot/shangwen-h5` |
| `/api` | 反向代理到 `http://127.0.0.1:3000` |
| `/uploads` | 反向代理到 `http://127.0.0.1:3000` |

宝塔页面：

```text
网站 -> 当前站点 -> 设置 -> 反向代理
```

删除或关闭代理目录为 `/` 的反向代理。

新增 `/api` 反向代理：

```text
代理名称：node-api
代理目录：/api
目标URL：http://127.0.0.1:3000
发送域名：$host
缓存：关闭
```

新增 `/uploads` 反向代理：

```text
代理名称：node-uploads
代理目录：/uploads
目标URL：http://127.0.0.1:3000
发送域名：$host
缓存：关闭
```

保存后重载 Nginx。

### 6. 配置 H5 伪静态

宝塔页面：

```text
网站 -> 当前站点 -> 设置 -> 伪静态
```

填写：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

如果宝塔提示和反向代理冲突，以最终 Nginx 配置为准：`/api` 和 `/uploads` 必须优先反代到 Node，其他路径才走 `index.html`。

### 7. 后端 `.env`

备案域名未完成前：

```env
PUBLIC_BASE_URL=http://服务器公网IP
PUBLIC_H5_BASE_URL=http://服务器公网IP
HOST=127.0.0.1
PORT=3000
```

`PUBLIC_H5_BASE_URL` 只填写 H5 前端根地址，不带 `/api`。商品分享到钉钉时，前端会复制或调用 `/api/share/dishes/菜品ID`，该接口返回带 Open Graph 信息的 HTML 卡片页，再跳转到 H5 菜品详情。

修改后重启 PM2：

```bash
pm2 restart shangwen-ordering-api
```

### 8. 验证

浏览器访问：

```text
http://服务器公网IP/
```

接口验证：

```text
http://服务器公网IP/api/health
http://服务器公网IP/api/categories
```

图片验证：

```text
http://服务器公网IP/uploads/文件名
```

如果首页能打开但刷新页面 404，检查伪静态。  
如果首页能打开但接口 404/502，检查 `/api` 反向代理。  
如果上传后图片打不开，检查 `/uploads` 反向代理和后端 `PUBLIC_BASE_URL`。

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
