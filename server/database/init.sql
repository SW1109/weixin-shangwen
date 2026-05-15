CREATE DATABASE IF NOT EXISTS shangwen_ordering
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE shangwen_ordering;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) NOT NULL UNIQUE,
  nick_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(255) NOT NULL,
  phone_number VARCHAR(32) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS merchants (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'admin',
  store_name VARCHAR(100) NOT NULL,
  store_phone VARCHAR(50) NOT NULL,
  store_address VARCHAR(255) NOT NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  icon VARCHAR(255) NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS dishes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  category_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  image VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2) NULL,
  description TEXT,
  stock INT NOT NULL DEFAULT 0,
  sales INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  is_recommend TINYINT NOT NULL DEFAULT 0,
  tags JSON NULL,
  sort INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_dishes_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS addresses (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  province VARCHAR(100) NOT NULL DEFAULT '',
  city VARCHAR(100) NOT NULL DEFAULT '',
  district VARCHAR(100) NOT NULL DEFAULT '',
  detail VARCHAR(255) NOT NULL,
  is_default TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS carts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  cart_id BIGINT NOT NULL,
  dish_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_dish FOREIGN KEY (dish_id) REFERENCES dishes(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(64) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  user_openid VARCHAR(64) NOT NULL,
  user_nickname VARCHAR(100) NOT NULL,
  user_avatar_url VARCHAR(255) NOT NULL,
  user_phone_number VARCHAR(50) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  address_name VARCHAR(100) NOT NULL,
  address_phone VARCHAR(50) NOT NULL,
  address_province VARCHAR(100) NOT NULL,
  address_city VARCHAR(100) NOT NULL,
  address_district VARCHAR(100) NOT NULL,
  address_detail VARCHAR(255) NOT NULL,
  remark VARCHAR(255) NOT NULL DEFAULT '',
  status TINYINT NOT NULL DEFAULT 1,
  pay_status TINYINT NOT NULL DEFAULT 0,
  pay_time DATETIME NULL,
  complete_time DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  dish_id BIGINT NOT NULL,
  dish_name VARCHAR(100) NOT NULL,
  dish_image VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_dish FOREIGN KEY (dish_id) REFERENCES dishes(id)
);

CREATE INDEX idx_categories_sort ON categories(sort);
CREATE INDEX idx_dishes_category_status ON dishes(category_id, status);
CREATE INDEX idx_dishes_sort_sales ON dishes(sort, sales);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_addresses_user_default ON addresses(user_id, is_default);

INSERT INTO merchants (
  username,
  password_hash,
  role,
  store_name,
  store_phone,
  store_address,
  status,
  created_at,
  updated_at
)
SELECT
  'admin',
  '$2b$10$AHGez0MEVPFw6SUQv7/uruZy6UK21l3T3wlFxqTJvCnxqzrfzcpY2',
  'admin',
  '上文美食餐厅',
  '0755-12345678',
  '深圳市南山区科技园',
  1,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM merchants WHERE username = 'admin'
);

INSERT INTO categories (name, sort, icon, status, created_at, updated_at)
SELECT * FROM (
  SELECT '热销推荐', 1, NULL, 1, NOW(), NOW()
  UNION ALL SELECT '主食类', 2, NULL, 1, NOW(), NOW()
  UNION ALL SELECT '小吃类', 3, NULL, 1, NOW(), NOW()
  UNION ALL SELECT '汤品类', 4, NULL, 1, NOW(), NOW()
  UNION ALL SELECT '饮品类', 5, NULL, 1, NOW(), NOW()
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);
