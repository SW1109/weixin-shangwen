USE shangwen_ordering;

SET @column_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'dishes'
    AND COLUMN_NAME = 'sort'
);

SET @add_column_sql := IF(
  @column_exists = 0,
  'ALTER TABLE dishes ADD COLUMN sort INT NOT NULL DEFAULT 0 AFTER tags',
  'SELECT "dishes.sort already exists"'
);

PREPARE add_column_stmt FROM @add_column_sql;
EXECUTE add_column_stmt;
DEALLOCATE PREPARE add_column_stmt;

SET @index_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'dishes'
    AND INDEX_NAME = 'idx_dishes_sort_sales'
);

SET @add_index_sql := IF(
  @index_exists = 0,
  'CREATE INDEX idx_dishes_sort_sales ON dishes(sort, sales)',
  'SELECT "idx_dishes_sort_sales already exists"'
);

PREPARE add_index_stmt FROM @add_index_sql;
EXECUTE add_index_stmt;
DEALLOCATE PREPARE add_index_stmt;
