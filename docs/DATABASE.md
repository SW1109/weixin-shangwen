# 数据库文档

当前后端使用 MySQL。初始化、升级和测试数据脚本位于 `server/database/`。

## 数据库文件

| 文件 | 用途 |
| --- | --- |
| `server/database/init.sql` | 创建数据库、表、索引、默认商家账号、基础分类 |
| `server/database/upgrade-20260515-dish-sort.sql` | 为旧库补充 `dishes.sort` 字段和索引 |
| `server/database/seed-test-data.sql` | 测试分类、菜品、用户、地址、购物车、订单 |

## 默认数据库

```text
shangwen_ordering
```

字符集：

```text
utf8mb4 / utf8mb4_unicode_ci
```

## 初始化

本地命令：

```bash
cd server
mysql -uroot -p < database/init.sql
```

宝塔页面：

```text
数据库 -> 选择 shangwen_ordering -> 导入 -> 选择 init.sql
```

初始化后默认商家账号：

```text
账号：admin
密码：123456
```

## 数据表说明

### `users`

用户表，对应用户微信登录后的账号。

| 字段 | 说明 |
| --- | --- |
| `id` | 用户 ID |
| `openid` | 微信 openid，唯一 |
| `nick_name` | 昵称 |
| `avatar_url` | 头像 |
| `phone_number` | 手机号 |
| `created_at` / `updated_at` | 创建和更新时间 |

### `merchants`

商家账号表。

| 字段 | 说明 |
| --- | --- |
| `id` | 商家 ID |
| `username` | 登录账号，唯一 |
| `password_hash` | bcrypt 密码哈希 |
| `role` | 角色，默认 `admin` |
| `store_name` | 店铺名称 |
| `store_phone` | 店铺电话 |
| `store_address` | 店铺地址 |
| `status` | `1` 启用，`0` 禁用 |

### `categories`

菜品分类表。

| 字段 | 说明 |
| --- | --- |
| `id` | 分类 ID |
| `name` | 分类名称 |
| `sort` | 排序，越小越靠前 |
| `icon` | 分类图标，当前可为空 |
| `status` | `1` 启用，`0` 禁用 |

用户端只查询 `status=1` 的分类。商家端查询全部分类。

### `dishes`

菜品表。

| 字段 | 说明 |
| --- | --- |
| `id` | 菜品 ID |
| `category_id` | 分类 ID |
| `name` | 菜品名称 |
| `image` | 菜品图片地址 |
| `price` | 售价 |
| `original_price` | 原价，可为空 |
| `description` | 描述 |
| `stock` | 库存，`-1` 表示不限库存 |
| `sales` | 销量 |
| `status` | `1` 上架，`0` 下架 |
| `is_recommend` | 是否推荐 |
| `tags` | JSON 标签数组 |
| `sort` | 排序，越小越靠前 |

当前后端读取 `tags` 时兼容两种历史数据：

```json
["热销", "辣"]
```

```text
热销,辣
```

新数据建议统一保存为 JSON 数组。

### `addresses`

收货地址表。

| 字段 | 说明 |
| --- | --- |
| `id` | 地址 ID |
| `user_id` | 用户 ID |
| `name` | 收货人 |
| `phone` | 手机号 |
| `province` / `city` / `district` | 省市区 |
| `detail` | 详细地址 |
| `is_default` | 是否默认地址 |

### `carts`

购物车主表。一个用户只有一个购物车。

| 字段 | 说明 |
| --- | --- |
| `id` | 购物车 ID |
| `user_id` | 用户 ID，唯一 |

### `cart_items`

购物车明细表。

| 字段 | 说明 |
| --- | --- |
| `cart_id` | 购物车 ID |
| `dish_id` | 菜品 ID |
| `quantity` | 数量 |

`cart_items.cart_id` 关联 `carts.id`，购物车删除时明细自动删除。

### `orders`

订单主表。订单创建时会冗余保存用户信息和收货地址，避免用户后续修改资料影响历史订单。

| 字段 | 说明 |
| --- | --- |
| `order_no` | 订单号，唯一 |
| `user_id` / `user_openid` | 下单用户 |
| `user_nickname` / `user_avatar_url` / `user_phone_number` | 下单时用户信息 |
| `total_amount` | 订单总额 |
| `address_name` / `address_phone` | 下单时收货人信息 |
| `address_province` / `address_city` / `address_district` / `address_detail` | 下单时地址 |
| `remark` | 备注 |
| `status` | 订单状态 |
| `pay_status` | 支付状态，`0` 未支付，`1` 已支付 |
| `pay_time` | 支付时间 |
| `complete_time` | 完成时间 |

### `order_items`

订单菜品明细表。下单时会冗余保存菜品名称、图片和价格。

| 字段 | 说明 |
| --- | --- |
| `order_id` | 订单 ID |
| `dish_id` | 菜品 ID |
| `dish_name` | 下单时菜品名称 |
| `dish_image` | 下单时菜品图片 |
| `price` | 下单时单价 |
| `quantity` | 数量 |

## 订单状态

| 状态值 | 含义 |
| --- | --- |
| `1` | 待支付 |
| `2` | 待配送 |
| `3` | 配送中 |
| `4` | 已完成 |
| `5` | 已取消 |

支付状态：

| 状态值 | 含义 |
| --- | --- |
| `0` | 未支付 |
| `1` | 已支付 |

## 旧库升级

如果已有旧版数据库，查询菜品时报：

```text
Unknown column 'd.sort'
```

执行升级脚本：

```bash
cd server
mysql -uroot -p shangwen_ordering < database/upgrade-20260515-dish-sort.sql
```

宝塔页面：

```text
数据库 -> shangwen_ordering -> 导入 -> 选择 upgrade-20260515-dish-sort.sql
```

该脚本会先检查字段和索引是否存在，重复执行不会重复添加。

## 测试数据

导入测试数据：

```bash
cd server
mysql -uroot -p shangwen_ordering < database/seed-test-data.sql
```

宝塔页面：

```text
数据库 -> shangwen_ordering -> 导入 -> 选择 seed-test-data.sql
```

测试数据内容：

| 类型 | 内容 |
| --- | --- |
| 分类 | 热销推荐、主食类、小吃类、汤品类、饮品类、甜品类 |
| 菜品 | 12 个测试菜品，包含上架、下架、售罄、折扣、推荐、标签 |
| 用户 | 2 个测试用户 |
| 地址 | 2 条测试地址 |
| 购物车 | 用户 A 的购物车明细 |
| 订单 | 5 个订单，覆盖待支付、待配送、配送中、已完成、已取消 |

`seed-test-data.sql` 使用 `WHERE NOT EXISTS` 避免重复插入同名测试数据，不包含 `DROP`、`DELETE`、`TRUNCATE`。

## 备份建议

宝塔页面备份：

```text
数据库 -> shangwen_ordering -> 备份
```

命令备份：

```bash
mysqldump -uroot -p shangwen_ordering > shangwen_ordering_backup.sql
```

执行升级脚本或导入大量测试数据前，建议先备份。
