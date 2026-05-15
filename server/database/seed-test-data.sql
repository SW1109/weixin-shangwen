USE shangwen_ordering;

-- Test categories. Safe to run repeatedly; existing category names are not duplicated.
INSERT INTO categories (name, sort, icon, status, created_at, updated_at)
SELECT '热销推荐', 1, NULL, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '热销推荐');

INSERT INTO categories (name, sort, icon, status, created_at, updated_at)
SELECT '主食类', 2, NULL, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '主食类');

INSERT INTO categories (name, sort, icon, status, created_at, updated_at)
SELECT '小吃类', 3, NULL, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '小吃类');

INSERT INTO categories (name, sort, icon, status, created_at, updated_at)
SELECT '汤品类', 4, NULL, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '汤品类');

INSERT INTO categories (name, sort, icon, status, created_at, updated_at)
SELECT '饮品类', 5, NULL, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '饮品类');

INSERT INTO categories (name, sort, icon, status, created_at, updated_at)
SELECT '甜品类', 6, NULL, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '甜品类');

-- Test dishes. Images use the local mini-program logo path so local dev can render without adding extra image domains.
INSERT INTO dishes (
  category_id, name, image, price, original_price, description, stock, sales,
  status, is_recommend, tags, sort, created_at, updated_at
)
SELECT
  c.id, '招牌牛肉饭', '/static/logo.png', 28.00, 32.00,
  '大片牛肉配秘制酱汁，适合测试热销推荐和折扣价展示。',
  88, 126, 1, 1, '["招牌","热销"]', 1, NOW(), NOW()
FROM categories c
WHERE c.name = '热销推荐'
  AND NOT EXISTS (SELECT 1 FROM dishes WHERE name = '招牌牛肉饭');

INSERT INTO dishes (
  category_id, name, image, price, original_price, description, stock, sales,
  status, is_recommend, tags, sort, created_at, updated_at
)
SELECT
  c.id, '香辣鸡腿饭', '/static/logo.png', 24.00, 28.00,
  '微辣鸡腿饭，适合测试标签和销量排序。',
  64, 98, 1, 1, '["微辣","人气"]', 2, NOW(), NOW()
FROM categories c
WHERE c.name = '热销推荐'
  AND NOT EXISTS (SELECT 1 FROM dishes WHERE name = '香辣鸡腿饭');

INSERT INTO dishes (
  category_id, name, image, price, original_price, description, stock, sales,
  status, is_recommend, tags, sort, created_at, updated_at
)
SELECT
  c.id, '番茄鸡蛋盖饭', '/static/logo.png', 18.00, NULL,
  '经典家常口味，适合测试无原价菜品。',
  120, 76, 1, 0, '["家常","不辣"]', 1, NOW(), NOW()
FROM categories c
WHERE c.name = '主食类'
  AND NOT EXISTS (SELECT 1 FROM dishes WHERE name = '番茄鸡蛋盖饭');

INSERT INTO dishes (
  category_id, name, image, price, original_price, description, stock, sales,
  status, is_recommend, tags, sort, created_at, updated_at
)
SELECT
  c.id, '黑椒牛柳意面', '/static/logo.png', 26.00, NULL,
  '黑椒风味主食，适合测试较长菜品名称。',
  45, 52, 1, 0, '["黑椒","主食"]', 2, NOW(), NOW()
FROM categories c
WHERE c.name = '主食类'
  AND NOT EXISTS (SELECT 1 FROM dishes WHERE name = '黑椒牛柳意面');

INSERT INTO dishes (
  category_id, name, image, price, original_price, description, stock, sales,
  status, is_recommend, tags, sort, created_at, updated_at
)
SELECT
  c.id, '黄金炸鸡块', '/static/logo.png', 16.00, 20.00,
  '外酥里嫩，适合测试加购小吃。',
  100, 143, 1, 1, '["小吃","热销"]', 1, NOW(), NOW()
FROM categories c
WHERE c.name = '小吃类'
  AND NOT EXISTS (SELECT 1 FROM dishes WHERE name = '黄金炸鸡块');

INSERT INTO dishes (
  category_id, name, image, price, original_price, description, stock, sales,
  status, is_recommend, tags, sort, created_at, updated_at
)
SELECT
  c.id, '手工春卷', '/static/logo.png', 12.00, NULL,
  '酥脆小食，适合测试低价菜品。',
  0, 31, 1, 0, '["售罄测试","小吃"]', 2, NOW(), NOW()
FROM categories c
WHERE c.name = '小吃类'
  AND NOT EXISTS (SELECT 1 FROM dishes WHERE name = '手工春卷');

INSERT INTO dishes (
  category_id, name, image, price, original_price, description, stock, sales,
  status, is_recommend, tags, sort, created_at, updated_at
)
SELECT
  c.id, '菌菇鸡汤', '/static/logo.png', 15.00, NULL,
  '清淡汤品，适合测试汤品分类。',
  35, 43, 1, 0, '["清淡","汤品"]', 1, NOW(), NOW()
FROM categories c
WHERE c.name = '汤品类'
  AND NOT EXISTS (SELECT 1 FROM dishes WHERE name = '菌菇鸡汤');

INSERT INTO dishes (
  category_id, name, image, price, original_price, description, stock, sales,
  status, is_recommend, tags, sort, created_at, updated_at
)
SELECT
  c.id, '冬瓜排骨汤', '/static/logo.png', 18.00, NULL,
  '经典汤品，适合测试套餐搭配。',
  28, 39, 1, 0, '["汤品","滋补"]', 2, NOW(), NOW()
FROM categories c
WHERE c.name = '汤品类'
  AND NOT EXISTS (SELECT 1 FROM dishes WHERE name = '冬瓜排骨汤');

INSERT INTO dishes (
  category_id, name, image, price, original_price, description, stock, sales,
  status, is_recommend, tags, sort, created_at, updated_at
)
SELECT
  c.id, '冰柠檬茶', '/static/logo.png', 9.00, NULL,
  '清爽饮品，适合测试饮品分类。',
  200, 166, 1, 1, '["冰饮","热销"]', 1, NOW(), NOW()
FROM categories c
WHERE c.name = '饮品类'
  AND NOT EXISTS (SELECT 1 FROM dishes WHERE name = '冰柠檬茶');

INSERT INTO dishes (
  category_id, name, image, price, original_price, description, stock, sales,
  status, is_recommend, tags, sort, created_at, updated_at
)
SELECT
  c.id, '桂花酸梅汤', '/static/logo.png', 10.00, NULL,
  '酸甜解腻，适合测试搜索关键词。',
  160, 112, 1, 0, '["酸甜","饮品"]', 2, NOW(), NOW()
FROM categories c
WHERE c.name = '饮品类'
  AND NOT EXISTS (SELECT 1 FROM dishes WHERE name = '桂花酸梅汤');

INSERT INTO dishes (
  category_id, name, image, price, original_price, description, stock, sales,
  status, is_recommend, tags, sort, created_at, updated_at
)
SELECT
  c.id, '芒果布丁', '/static/logo.png', 13.00, NULL,
  '甜品测试数据。',
  50, 68, 1, 0, '["甜品","芒果"]', 1, NOW(), NOW()
FROM categories c
WHERE c.name = '甜品类'
  AND NOT EXISTS (SELECT 1 FROM dishes WHERE name = '芒果布丁');

INSERT INTO dishes (
  category_id, name, image, price, original_price, description, stock, sales,
  status, is_recommend, tags, sort, created_at, updated_at
)
SELECT
  c.id, '下架测试菜品', '/static/logo.png', 99.00, NULL,
  '商家端可见，用户端不可见，用于测试上下架状态。',
  10, 0, 0, 0, '["下架"]', 99, NOW(), NOW()
FROM categories c
WHERE c.name = '甜品类'
  AND NOT EXISTS (SELECT 1 FROM dishes WHERE name = '下架测试菜品');

-- Test users and addresses.
INSERT INTO users (openid, nick_name, avatar_url, phone_number, created_at, updated_at)
SELECT 'seed-openid-001', '测试用户A', '/static/logo.png', '13800000001', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE openid = 'seed-openid-001');

INSERT INTO users (openid, nick_name, avatar_url, phone_number, created_at, updated_at)
SELECT 'seed-openid-002', '测试用户B', '/static/logo.png', '13800000002', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE openid = 'seed-openid-002');

INSERT INTO addresses (
  user_id, name, phone, province, city, district, detail, is_default, created_at, updated_at
)
SELECT u.id, '测试用户A', '13800000001', '广东省', '深圳市', '南山区', '科技园测试大厦 8 楼', 1, NOW(), NOW()
FROM users u
WHERE u.openid = 'seed-openid-001'
  AND NOT EXISTS (
    SELECT 1 FROM addresses a
    WHERE a.user_id = u.id AND a.phone = '13800000001' AND a.detail = '科技园测试大厦 8 楼'
  );

INSERT INTO addresses (
  user_id, name, phone, province, city, district, detail, is_default, created_at, updated_at
)
SELECT u.id, '测试用户B', '13800000002', '广东省', '深圳市', '福田区', '中心区测试花园 3 栋 1201', 1, NOW(), NOW()
FROM users u
WHERE u.openid = 'seed-openid-002'
  AND NOT EXISTS (
    SELECT 1 FROM addresses a
    WHERE a.user_id = u.id AND a.phone = '13800000002' AND a.detail = '中心区测试花园 3 栋 1201'
  );

-- Test cart for user A.
INSERT INTO carts (user_id, created_at, updated_at)
SELECT u.id, NOW(), NOW()
FROM users u
WHERE u.openid = 'seed-openid-001'
  AND NOT EXISTS (SELECT 1 FROM carts c WHERE c.user_id = u.id);

INSERT INTO cart_items (cart_id, dish_id, quantity, created_at, updated_at)
SELECT c.id, d.id, 2, NOW(), NOW()
FROM carts c
JOIN users u ON u.id = c.user_id
JOIN dishes d ON d.name = '招牌牛肉饭'
WHERE u.openid = 'seed-openid-001'
  AND NOT EXISTS (
    SELECT 1 FROM cart_items ci WHERE ci.cart_id = c.id AND ci.dish_id = d.id
  );

INSERT INTO cart_items (cart_id, dish_id, quantity, created_at, updated_at)
SELECT c.id, d.id, 1, NOW(), NOW()
FROM carts c
JOIN users u ON u.id = c.user_id
JOIN dishes d ON d.name = '冰柠檬茶'
WHERE u.openid = 'seed-openid-001'
  AND NOT EXISTS (
    SELECT 1 FROM cart_items ci WHERE ci.cart_id = c.id AND ci.dish_id = d.id
  );

-- Test orders: 1 unpaid, 1 paid/to deliver, 1 delivering, 1 completed, 1 cancelled.
INSERT INTO orders (
  order_no, user_id, user_openid, user_nickname, user_avatar_url, user_phone_number,
  total_amount, address_name, address_phone, address_province, address_city,
  address_district, address_detail, remark, status, pay_status, pay_time,
  complete_time, created_at, updated_at
)
SELECT
  'TEST202605150001', u.id, u.openid, u.nick_name, u.avatar_url, u.phone_number,
  37.00, '测试用户A', '13800000001', '广东省', '深圳市', '南山区',
  '科技园测试大厦 8 楼', '测试备注：待支付订单', 1, 0, NULL, NULL,
  DATE_SUB(NOW(), INTERVAL 35 MINUTE), DATE_SUB(NOW(), INTERVAL 35 MINUTE)
FROM users u
WHERE u.openid = 'seed-openid-001'
  AND NOT EXISTS (SELECT 1 FROM orders WHERE order_no = 'TEST202605150001');

INSERT INTO order_items (order_id, dish_id, dish_name, dish_image, price, quantity, created_at, updated_at)
SELECT o.id, d.id, d.name, d.image, d.price, 1, o.created_at, o.updated_at
FROM orders o
JOIN dishes d ON d.name = '招牌牛肉饭'
WHERE o.order_no = 'TEST202605150001'
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.dish_id = d.id);

INSERT INTO order_items (order_id, dish_id, dish_name, dish_image, price, quantity, created_at, updated_at)
SELECT o.id, d.id, d.name, d.image, d.price, 1, o.created_at, o.updated_at
FROM orders o
JOIN dishes d ON d.name = '冰柠檬茶'
WHERE o.order_no = 'TEST202605150001'
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.dish_id = d.id);

INSERT INTO orders (
  order_no, user_id, user_openid, user_nickname, user_avatar_url, user_phone_number,
  total_amount, address_name, address_phone, address_province, address_city,
  address_district, address_detail, remark, status, pay_status, pay_time,
  complete_time, created_at, updated_at
)
SELECT
  'TEST202605150002', u.id, u.openid, u.nick_name, u.avatar_url, u.phone_number,
  56.00, '测试用户B', '13800000002', '广东省', '深圳市', '福田区',
  '中心区测试花园 3 栋 1201', '测试备注：待配送订单', 2, 1,
  DATE_SUB(NOW(), INTERVAL 20 MINUTE), NULL,
  DATE_SUB(NOW(), INTERVAL 22 MINUTE), DATE_SUB(NOW(), INTERVAL 20 MINUTE)
FROM users u
WHERE u.openid = 'seed-openid-002'
  AND NOT EXISTS (SELECT 1 FROM orders WHERE order_no = 'TEST202605150002');

INSERT INTO order_items (order_id, dish_id, dish_name, dish_image, price, quantity, created_at, updated_at)
SELECT o.id, d.id, d.name, d.image, d.price, 2, o.created_at, o.updated_at
FROM orders o
JOIN dishes d ON d.name = '香辣鸡腿饭'
WHERE o.order_no = 'TEST202605150002'
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.dish_id = d.id);

INSERT INTO order_items (order_id, dish_id, dish_name, dish_image, price, quantity, created_at, updated_at)
SELECT o.id, d.id, d.name, d.image, d.price, 1, o.created_at, o.updated_at
FROM orders o
JOIN dishes d ON d.name = '桂花酸梅汤'
WHERE o.order_no = 'TEST202605150002'
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.dish_id = d.id);

INSERT INTO orders (
  order_no, user_id, user_openid, user_nickname, user_avatar_url, user_phone_number,
  total_amount, address_name, address_phone, address_province, address_city,
  address_district, address_detail, remark, status, pay_status, pay_time,
  complete_time, created_at, updated_at
)
SELECT
  'TEST202605150003', u.id, u.openid, u.nick_name, u.avatar_url, u.phone_number,
  44.00, '测试用户A', '13800000001', '广东省', '深圳市', '南山区',
  '科技园测试大厦 8 楼', '测试备注：配送中订单', 3, 1,
  DATE_SUB(NOW(), INTERVAL 50 MINUTE), NULL,
  DATE_SUB(NOW(), INTERVAL 55 MINUTE), DATE_SUB(NOW(), INTERVAL 10 MINUTE)
FROM users u
WHERE u.openid = 'seed-openid-001'
  AND NOT EXISTS (SELECT 1 FROM orders WHERE order_no = 'TEST202605150003');

INSERT INTO order_items (order_id, dish_id, dish_name, dish_image, price, quantity, created_at, updated_at)
SELECT o.id, d.id, d.name, d.image, d.price, 1, o.created_at, o.updated_at
FROM orders o
JOIN dishes d ON d.name = '黑椒牛柳意面'
WHERE o.order_no = 'TEST202605150003'
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.dish_id = d.id);

INSERT INTO order_items (order_id, dish_id, dish_name, dish_image, price, quantity, created_at, updated_at)
SELECT o.id, d.id, d.name, d.image, d.price, 1, o.created_at, o.updated_at
FROM orders o
JOIN dishes d ON d.name = '冬瓜排骨汤'
WHERE o.order_no = 'TEST202605150003'
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.dish_id = d.id);

INSERT INTO orders (
  order_no, user_id, user_openid, user_nickname, user_avatar_url, user_phone_number,
  total_amount, address_name, address_phone, address_province, address_city,
  address_district, address_detail, remark, status, pay_status, pay_time,
  complete_time, created_at, updated_at
)
SELECT
  'TEST202605150004', u.id, u.openid, u.nick_name, u.avatar_url, u.phone_number,
  61.00, '测试用户B', '13800000002', '广东省', '深圳市', '福田区',
  '中心区测试花园 3 栋 1201', '测试备注：已完成订单', 4, 1,
  DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 65 MINUTE),
  DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 65 MINUTE)
FROM users u
WHERE u.openid = 'seed-openid-002'
  AND NOT EXISTS (SELECT 1 FROM orders WHERE order_no = 'TEST202605150004');

INSERT INTO order_items (order_id, dish_id, dish_name, dish_image, price, quantity, created_at, updated_at)
SELECT o.id, d.id, d.name, d.image, d.price, 1, o.created_at, o.updated_at
FROM orders o
JOIN dishes d ON d.name = '番茄鸡蛋盖饭'
WHERE o.order_no = 'TEST202605150004'
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.dish_id = d.id);

INSERT INTO order_items (order_id, dish_id, dish_name, dish_image, price, quantity, created_at, updated_at)
SELECT o.id, d.id, d.name, d.image, d.price, 2, o.created_at, o.updated_at
FROM orders o
JOIN dishes d ON d.name = '黄金炸鸡块'
WHERE o.order_no = 'TEST202605150004'
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.dish_id = d.id);

INSERT INTO order_items (order_id, dish_id, dish_name, dish_image, price, quantity, created_at, updated_at)
SELECT o.id, d.id, d.name, d.image, d.price, 1, o.created_at, o.updated_at
FROM orders o
JOIN dishes d ON d.name = '菌菇鸡汤'
WHERE o.order_no = 'TEST202605150004'
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.dish_id = d.id);

INSERT INTO orders (
  order_no, user_id, user_openid, user_nickname, user_avatar_url, user_phone_number,
  total_amount, address_name, address_phone, address_province, address_city,
  address_district, address_detail, remark, status, pay_status, pay_time,
  complete_time, created_at, updated_at
)
SELECT
  'TEST202605150005', u.id, u.openid, u.nick_name, u.avatar_url, u.phone_number,
  28.00, '测试用户A', '13800000001', '广东省', '深圳市', '南山区',
  '科技园测试大厦 8 楼', '测试备注：已取消订单', 5, 0,
  NULL, NULL,
  DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 160 MINUTE)
FROM users u
WHERE u.openid = 'seed-openid-001'
  AND NOT EXISTS (SELECT 1 FROM orders WHERE order_no = 'TEST202605150005');

INSERT INTO order_items (order_id, dish_id, dish_name, dish_image, price, quantity, created_at, updated_at)
SELECT o.id, d.id, d.name, d.image, d.price, 1, o.created_at, o.updated_at
FROM orders o
JOIN dishes d ON d.name = '招牌牛肉饭'
WHERE o.order_no = 'TEST202605150005'
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.dish_id = d.id);
