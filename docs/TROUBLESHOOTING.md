# 常见问题

本文档记录当前项目开发、部署、微信开发者工具调试中已经遇到过的问题和处理方式。

## 接口 500：`ER_ACCESS_DENIED_ERROR`

错误示例：

```text
Access denied for user 'shangwen_ordering'@'localhost' (using password: YES)
```

原因：

| 可能原因 | 处理方式 |
| --- | --- |
| `.env` 中 `MYSQL_USER` 写错 | 改成宝塔数据库用户名 |
| `.env` 中 `MYSQL_PASSWORD` 写错 | 改成宝塔数据库密码 |
| 宝塔数据库权限不是本地服务器 | 宝塔数据库页面检查访问权限 |
| 改完 `.env` 没重启 Node | PM2 重启项目 |

服务器上修改：

```text
/www/wwwroot/shangwen-api/.env
```

重启：

```bash
pm2 restart shangwen-ordering-api
```

## 接口 400：`categoryId=undefined&keyword=undefined`

错误示例：

```text
GET /api/dishes?categoryId=undefined&keyword=undefined 400
```

原因：

| 可能原因 | 处理方式 |
| --- | --- |
| 前端请求层没有过滤 `undefined` 参数 | 当前 `uniapp/src/utils/request.ts` 已处理 |
| 微信开发者工具还在运行旧包 | 重新执行 `npm run dev:mp-weixin` |
| 开发者工具缓存旧代码 | 微信开发者工具清缓存并重新编译 |

处理步骤：

```bash
cd uniapp
npm run dev:mp-weixin
```

微信开发者工具：

```text
工具 -> 清缓存 -> 清除全部缓存
```

## 删除接口报：`Body cannot be empty when content-type is set to 'application/json'`

常见于：

```text
DELETE /api/merchant/categories/:id
DELETE /api/merchant/dishes/:id
```

原因是旧前端在无请求体的 `DELETE` 请求中仍设置了 JSON 请求头，但没有传 body。

当前前端请求层已经对非 GET 请求自动补 `{}`：

```text
uniapp/src/utils/request.ts
```

如果仍然出现，说明微信开发者工具运行的还是旧构建产物。重新构建并清缓存。

## 接口 500：`Unexpected token '热', "热销,辣" is not valid JSON`

原因：

| 可能原因 | 处理方式 |
| --- | --- |
| 数据库 `dishes.tags` 存了历史逗号字符串 | 当前后端 mapper 已兼容 |
| 服务器代码没更新 | 重新上传 `server/src/lib/mappers.js` |
| 上传后 PM2 没重启 | 重启 PM2 |

重启：

```bash
pm2 restart shangwen-ordering-api
```

当前后端兼容：

```text
["热销","辣"]
热销,辣
热销，辣
```

## 接口 500：`Unknown column 'd.sort'`

原因：旧库缺少菜品排序字段。

处理：

```bash
cd /www/wwwroot/shangwen-api
mysql -u数据库用户 -p shangwen_ordering < database/upgrade-20260515-dish-sort.sql
```

宝塔页面：

```text
数据库 -> shangwen_ordering -> 导入 -> upgrade-20260515-dish-sort.sql
```

执行后重启后端。

## `/api/health` 正常，`/api/categories` 500

`/api/health` 不访问数据库，能返回只说明 Node 服务启动了。`/api/categories` 会访问 MySQL。

排查顺序：

| 检查项 | 说明 |
| --- | --- |
| `.env` 数据库账号密码 | `MYSQL_USER`、`MYSQL_PASSWORD`、`MYSQL_DATABASE` |
| 数据库是否导入 | 是否执行过 `init.sql` |
| 数据表是否存在 | 宝塔数据库页面查看 `categories` 表 |
| PM2 是否重启 | `.env` 改动必须重启 |

## 502 Bad Gateway

原因通常在 Nginx 代理和 Node 进程之间。

排查：

| 检查项 | 正确值 |
| --- | --- |
| PM2 进程 | `online` |
| Node 监听端口 | `3000` |
| Nginx 代理目标 | `http://127.0.0.1:3000` |
| 宝塔安全 | 放行 `80` |
| 阿里云安全组 | 放行 `80` |

命令检查：

```bash
pm2 list
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1/api/health
```

## 本地微信开发者工具不能请求公网 IP

开发阶段如果使用：

```text
http://39.97.44.248/api
```

微信开发者工具需要勾选：

```text
详情 -> 本地设置 -> 不校验合法域名、TLS版本以及HTTPS证书
```

注意：

| 场景 | 是否可以用 IP |
| --- | --- |
| 微信开发者工具本地调试 | 可以，需关闭校验 |
| 真机预览 | 不稳定，不建议 |
| 提交审核和正式版 | 不可以 |

正式版必须使用备案域名、HTTPS，并在微信公众平台配置合法 `request` 域名。

## 不能访问 `https://服务器IP:8888/api`

`8888` 是宝塔面板端口，不是业务接口端口。

业务接口应访问：

```text
http://服务器公网IP/api/health
```

如果已经配置正式域名和 HTTPS：

```text
https://api.example.com/api/health
```

## 上传图片后图片地址打不开

排查：

| 检查项 | 说明 |
| --- | --- |
| `UPLOAD_DIR` | 是否是服务器真实可写目录 |
| `PUBLIC_BASE_URL` | 是否是前端能访问的域名或 IP |
| 文件是否存在 | 查看 `uploads` 目录 |
| Nginx 是否代理到 Node | `/uploads/文件名` 需要能访问 Node 静态服务 |

开发阶段 `.env` 示例：

```env
UPLOAD_DIR=/www/wwwroot/shangwen-api/uploads
PUBLIC_BASE_URL=http://39.97.44.248
```

正式上线：

```env
PUBLIC_BASE_URL=https://api.example.com
```

## 商家登录失败

默认账号：

```text
admin / 123456
```

如果登录失败：

| 检查项 | 说明 |
| --- | --- |
| 是否导入 `init.sql` | 默认商家账号由初始化 SQL 创建 |
| `merchants.status` | 必须为 `1` |
| 密码哈希是否被改过 | 可重新导入或手动更新哈希 |

恢复默认密码：

```sql
UPDATE merchants
SET password_hash = '$2b$10$AHGez0MEVPFw6SUQv7/uruZy6UK21l3T3wlFxqTJvCnxqzrfzcpY2',
    status = 1,
    updated_at = NOW()
WHERE username = 'admin';
```

## Node 版本过低

项目要求：

```text
Node.js >= 20.11.0
```

低版本可能导致：

| 问题 | 说明 |
| --- | --- |
| `vue-tsc` 报语法错误 | 依赖包使用了新语法 |
| Fastify 启动失败 | 后端依赖要求较新 Node |
| 宝塔 PM2 启动异常 | PM2 使用的 Node 版本不是 20+ |

检查：

```bash
node -v
pm2 list
```

宝塔中要确认 PM2 项目选择的是 Node 20.11+。

## 改了前端代码，微信开发者工具没变化

uni-app 需要先把源码编译到微信小程序目录。

开发命令：

```bash
cd uniapp
npm run dev:mp-weixin
```

微信开发者工具导入目录：

```text
uniapp/dist/dev/mp-weixin
```

如果 `dev:mp-weixin` 正在运行，通常保存源码后会自动重新编译。开发者工具仍没变化时，点击编译或清缓存。

正式构建：

```bash
npm run build:mp-weixin
```

正式产物：

```text
uniapp/dist/build/mp-weixin
```
