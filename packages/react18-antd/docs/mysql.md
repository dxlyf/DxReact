MySQL常用的SQL语句可以分为以下几类，以下是详细整理：

## 一、数据库操作
```sql
-- 查看所有数据库
SHOW DATABASES;

-- 创建数据库
CREATE DATABASE database_name;

-- 删除数据库
DROP DATABASE database_name;

-- 使用数据库
USE database_name;

-- 查看当前数据库
SELECT DATABASE();
```

## 二、表操作
### 1. 创建表
```sql
CREATE TABLE table_name (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    age INT DEFAULT 0,
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. 修改表结构
```sql
-- 添加列
ALTER TABLE table_name ADD COLUMN new_column VARCHAR(50);

-- 修改列
ALTER TABLE table_name MODIFY COLUMN name VARCHAR(100);

-- 删除列
ALTER TABLE table_name DROP COLUMN column_name;

-- 重命名表
RENAME TABLE old_name TO new_name;
```

### 3. 删除表
```sql
DROP TABLE table_name;

-- 清空表数据（更快，不可恢复）
TRUNCATE TABLE table_name;
```

## 三、数据操作（CRUD）
### 1. 插入数据
```sql
-- 插入单条
INSERT INTO table_name (column1, column2) VALUES (value1, value2);

-- 插入多条
INSERT INTO table_name (column1, column2) 
VALUES 
    (value1, value2),
    (value3, value4);

-- 插入查询结果
INSERT INTO table1 SELECT * FROM table2;
```

### 2. 查询数据
```sql
-- 基本查询
SELECT * FROM table_name;

-- 选择特定列
SELECT column1, column2 FROM table_name;

-- 条件查询
SELECT * FROM table_name WHERE condition;

-- 模糊查询
SELECT * FROM table_name WHERE name LIKE '%张%';

-- 排序
SELECT * FROM table_name ORDER BY column1 DESC, column2 ASC;

-- 分组聚合
SELECT department, COUNT(*), AVG(salary) 
FROM employees 
GROUP BY department 
HAVING COUNT(*) > 5;

-- 限制结果
SELECT * FROM table_name LIMIT 10 OFFSET 20;
-- 或简写
SELECT * FROM table_name LIMIT 20, 10;
```

### 3. 更新数据
```sql
UPDATE table_name 
SET column1 = value1, column2 = value2 
WHERE condition;

-- 示例
UPDATE users SET status = 1 WHERE last_login < '2024-01-01';
```

### 4. 删除数据
```sql
DELETE FROM table_name WHERE condition;

-- 删除所有数据
DELETE FROM table_name;
```

## 四、数据查询进阶
### 1. 连接查询
```sql
-- 内连接
SELECT * FROM table1 
INNER JOIN table2 ON table1.id = table2.table1_id;

-- 左连接
SELECT * FROM table1 
LEFT JOIN table2 ON table1.id = table2.table1_id;

-- 右连接
SELECT * FROM table1 
RIGHT JOIN table2 ON table1.id = table2.table1_id;

-- 全外连接（MySQL需使用UNION实现）
SELECT * FROM table1 LEFT JOIN table2 ON ...
UNION
SELECT * FROM table1 RIGHT JOIN table2 ON ...;
```

### 2. 子查询
```sql
-- 标量子查询
SELECT * FROM products 
WHERE price > (SELECT AVG(price) FROM products);

-- IN子查询
SELECT * FROM users 
WHERE id IN (SELECT user_id FROM orders);

-- EXISTS子查询
SELECT * FROM departments d
WHERE EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.id);
```

### 3. 联合查询
```sql
SELECT column1 FROM table1
UNION [ALL]
SELECT column1 FROM table2;
```

## 五、索引操作
```sql
-- 创建索引
CREATE INDEX idx_name ON table_name(column_name);

-- 创建唯一索引
CREATE UNIQUE INDEX idx_email ON users(email);

-- 创建复合索引
CREATE INDEX idx_name_age ON users(name, age);

-- 删除索引
DROP INDEX idx_name ON table_name;
```

## 六、事务控制
```sql
-- 开始事务
START TRANSACTION;
-- 或
BEGIN;

-- 提交事务
COMMIT;

-- 回滚事务
ROLLBACK;

-- 设置保存点
SAVEPOINT savepoint_name;

-- 回滚到保存点
ROLLBACK TO savepoint_name;
```

## 七、用户和权限管理
```sql
-- 创建用户
CREATE USER 'username'@'host' IDENTIFIED BY 'password';

-- 授予权限
GRANT SELECT, INSERT ON database.* TO 'username'@'host';

-- 授予所有权限
GRANT ALL PRIVILEGES ON database.* TO 'username'@'host';

-- 撤销权限
REVOKE INSERT ON database.* FROM 'username'@'host';

-- 刷新权限
FLUSH PRIVILEGES;

-- 查看用户权限
SHOW GRANTS FOR 'username'@'host';
```

## 八、实用函数
### 日期函数
```sql
SELECT NOW(), CURDATE(), CURTIME();
SELECT DATE_ADD(NOW(), INTERVAL 1 DAY);
SELECT DATEDIFF('2024-12-31', '2024-01-01');
SELECT DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s');
```

### 字符串函数
```sql
SELECT CONCAT('Hello', ' ', 'World');
SELECT SUBSTRING('Hello World', 1, 5);
SELECT UPPER('hello'), LOWER('WORLD');
SELECT LENGTH('Hello');
SELECT REPLACE('Hello World', 'World', 'MySQL');
```

### 聚合函数
```sql
SELECT COUNT(*), SUM(salary), AVG(age), MAX(score), MIN(price)
FROM table_name;
```

## 九、视图操作
```sql
-- 创建视图
CREATE VIEW view_name AS 
SELECT column1, column2 FROM table_name WHERE condition;

-- 使用视图
SELECT * FROM view_name;

-- 删除视图
DROP VIEW view_name;
```

## 十、存储过程和函数
```sql
-- 创建存储过程
DELIMITER //
CREATE PROCEDURE procedure_name()
BEGIN
    -- SQL语句
END //
DELIMITER ;

-- 调用存储过程
CALL procedure_name();

-- 创建函数
DELIMITER //
CREATE FUNCTION function_name(param INT) RETURNS INT
BEGIN
    RETURN param * 2;
END //
DELIMITER ;
```

## 实用技巧
1. **查看表结构**：`DESC table_name;` 或 `SHOW CREATE TABLE table_name;`
2. **查看进程**：`SHOW PROCESSLIST;`
3. **导入导出**：
   ```sql
   -- 导出
   mysqldump -u username -p database > backup.sql
   
   -- 导入
   mysql -u username -p database < backup.sql
   ```

## 一、查看数据库所有表

### 1. 查看当前数据库的所有表
```sql
-- 切换到目标数据库
USE database_name;

-- 查看所有表
SHOW TABLES;

-- 或查看所有表（含视图）
SHOW FULL TABLES;

-- 查看所有表，并显示表类型
SHOW FULL TABLES WHERE Table_type = 'BASE TABLE';
```

### 2. 不切换数据库查看指定数据库的表
```sql
-- 查看指定数据库的所有表
SHOW TABLES FROM database_name;

-- 或
SHOW TABLES IN database_name;

-- 查看指定数据库的所有表（含视图）
SHOW FULL TABLES FROM database_name;

-- 查看指定数据库中所有基表
SHOW FULL TABLES FROM database_name WHERE Table_type = 'BASE TABLE';
```

### 3. 查看表详细信息
```sql
-- 查看表的详细信息（包括注释等）
SHOW TABLE STATUS FROM database_name;

-- 查看当前数据库的表状态
SHOW TABLE STATUS;

-- 模糊匹配表名
SHOW TABLES LIKE 'user%';

-- 查看指定前缀的表
SHOW TABLES FROM database_name LIKE 'temp_%';
```

### 4. 从 INFORMATION_SCHEMA 查询（最详细）
```sql
-- 查看指定数据库的所有表和注释
SELECT 
    TABLE_NAME AS '表名',
    TABLE_COMMENT AS '表注释',
    TABLE_TYPE AS '表类型',
    ENGINE AS '存储引擎',
    TABLE_ROWS AS '行数',
    CREATE_TIME AS '创建时间'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'database_name'
ORDER BY TABLE_NAME;

-- 查看所有数据库的表统计
SELECT 
    TABLE_SCHEMA AS '数据库',
    TABLE_NAME AS '表名',
    TABLE_ROWS AS '行数',
    DATA_LENGTH AS '数据大小(字节)',
    INDEX_LENGTH AS '索引大小(字节)',
    (DATA_LENGTH + INDEX_LENGTH) AS '总大小(字节)',
    TABLE_COLLATION AS '字符集'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys')
ORDER BY TABLE_SCHEMA, TABLE_NAME;
```

## 二、查看数据库的结构

### 1. 查看数据库基本信息
```sql
-- 查看所有数据库
SHOW DATABASES;

-- 查看数据库创建语句
SHOW CREATE DATABASE database_name;

-- 查看数据库字符集和排序规则
SELECT 
    SCHEMA_NAME AS '数据库名',
    DEFAULT_CHARACTER_SET_NAME AS '默认字符集',
    DEFAULT_COLLATION_NAME AS '默认排序规则'
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME = 'database_name';
```

### 2. 查看数据库的完整结构（表+字段）
```sql
-- 查看数据库所有表及其字段信息
SELECT 
    t.TABLE_NAME AS '表名',
    t.TABLE_COMMENT AS '表注释',
    c.COLUMN_NAME AS '字段名',
    c.COLUMN_TYPE AS '字段类型',
    c.IS_NULLABLE AS '是否可空',
    c.COLUMN_DEFAULT AS '默认值',
    c.COLUMN_COMMENT AS '字段注释',
    c.EXTRA AS '额外信息',
    c.COLUMN_KEY AS '索引类型'
FROM information_schema.TABLES t
LEFT JOIN information_schema.COLUMNS c 
    ON t.TABLE_SCHEMA = c.TABLE_SCHEMA 
    AND t.TABLE_NAME = c.TABLE_NAME
WHERE t.TABLE_SCHEMA = 'database_name'
ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION;
```

### 3. 查看数据库各表大小统计
```sql
SELECT 
    TABLE_SCHEMA AS '数据库',
    TABLE_NAME AS '表名',
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS '总大小(MB)',
    ROUND(DATA_LENGTH / 1024 / 1024, 2) AS '数据大小(MB)',
    ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS '索引大小(MB)',
    TABLE_ROWS AS '行数',
    ROUND(DATA_LENGTH / TABLE_ROWS, 2) AS '平均行大小(字节)'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'database_name'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;
```

### 4. 查看数据库的索引结构
```sql
SELECT 
    TABLE_NAME AS '表名',
    INDEX_NAME AS '索引名',
    COLUMN_NAME AS '字段名',
    SEQ_IN_INDEX AS '索引顺序',
    INDEX_TYPE AS '索引类型',
    NON_UNIQUE AS '是否唯一'
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'database_name'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
```

### 5. 查看数据库的外键关系
```sql
SELECT 
    CONSTRAINT_NAME AS '外键名',
    TABLE_NAME AS '表名',
    COLUMN_NAME AS '字段名',
    REFERENCED_TABLE_NAME AS '引用表名',
    REFERENCED_COLUMN_NAME AS '引用字段'
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'database_name'
    AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### 6. 导出完整数据库结构（DDL）
```sql
-- 查看所有表的创建语句
SELECT TABLE_NAME, CREATE_TABLE 
FROM (
    SELECT 
        TABLE_NAME,
        CONCAT(
            '-- 表: ', TABLE_NAME, 
            IF(TABLE_COMMENT != '', CONCAT(' (', TABLE_COMMENT, ')'), ''), '\n',
            'CREATE TABLE ', TABLE_NAME, ' (\n',
            GROUP_CONCAT(
                CONCAT(
                    '  ', COLUMN_NAME, ' ', COLUMN_TYPE,
                    IF(IS_NULLABLE = 'NO', ' NOT NULL', ''),
                    IF(COLUMN_DEFAULT IS NOT NULL, CONCAT(' DEFAULT ', QUOTE(COLUMN_DEFAULT)), ''),
                    IF(EXTRA != '', CONCAT(' ', EXTRA), ''),
                    IF(COLUMN_COMMENT != '', CONCAT(' COMMENT ', QUOTE(COLUMN_COMMENT)), '')
                )
                ORDER BY ORDINAL_POSITION SEPARATOR ',\n'
            ),
            IFNULL(
                CONCAT(
                    ',\n',
                    (SELECT 
                        GROUP_CONCAT(
                            CONCAT(
                                '  ', 
                                CASE 
                                    WHEN CONSTRAINT_TYPE = 'PRIMARY KEY' THEN 'PRIMARY KEY'
                                    WHEN CONSTRAINT_TYPE = 'UNIQUE' THEN 'UNIQUE KEY'
                                    ELSE CONSTRAINT_TYPE
                                END,
                                ' (', GROUP_CONCAT(kcu.COLUMN_NAME ORDER BY kcu.ORDINAL_POSITION), ')'
                            )
                            SEPARATOR ',\n'
                        )
                     FROM information_schema.TABLE_CONSTRAINTS tc
                     JOIN information_schema.KEY_COLUMN_USAGE kcu 
                        ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
                     WHERE tc.TABLE_SCHEMA = c.TABLE_SCHEMA 
                        AND tc.TABLE_NAME = c.TABLE_NAME
                        AND tc.CONSTRAINT_TYPE IN ('PRIMARY KEY', 'UNIQUE')
                     GROUP BY tc.TABLE_NAME, tc.CONSTRAINT_NAME
                    )
                ),
                ''
            ),
            '\n) ENGINE=', ENGINE, 
            ' DEFAULT CHARSET=', CHARACTER_SET_NAME,
            IF(COLLATION_NAME IS NOT NULL, CONCAT(' COLLATE=', COLLATION_NAME), ''),
            IF(TABLE_COMMENT != '', CONCAT(' COMMENT=', QUOTE(TABLE_COMMENT)), ''),
            ';'
        ) AS CREATE_TABLE
    FROM information_schema.COLUMNS c
    JOIN information_schema.TABLES t 
        ON c.TABLE_SCHEMA = t.TABLE_SCHEMA 
        AND c.TABLE_NAME = t.TABLE_NAME
    WHERE c.TABLE_SCHEMA = 'database_name'
    GROUP BY c.TABLE_SCHEMA, c.TABLE_NAME, t.ENGINE, t.TABLE_COMMENT, t.CHARACTER_SET_NAME, t.COLLATION_NAME
) AS tables_ddl
ORDER BY TABLE_NAME;
```

### 7. 实用的一键查看数据库结构脚本
```sql
-- 查看数据库概览
SELECT 
    '数据库信息' AS '类别',
    SCHEMA_NAME AS '名称',
    DEFAULT_CHARACTER_SET_NAME AS '字符集',
    DEFAULT_COLLATION_NAME AS '排序规则'
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME = 'database_name'

UNION ALL

SELECT 
    '表统计' AS '类别',
    CONCAT('总表数: ', COUNT(*)) AS '名称',
    CONCAT('总行数: ', SUM(TABLE_ROWS)) AS '字符集',
    CONCAT('总大小: ', ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2), ' MB') AS '排序规则'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'database_name';
```

## 三、命令行工具查看
```bash
# 使用 mysqldump 仅导出结构（不包含数据）
mysqldump -u username -p --no-data database_name > structure.sql

# 使用 mysqlshow 查看数据库信息
mysqlshow -u username -p
mysqlshow -u username -p database_name

# 查看特定表结构
mysqlshow -u username -p database_name table_name
```

这些方法可以帮你全面了解数据库的结构，从宏观的表列表到微观的字段定义，都能清晰展示。