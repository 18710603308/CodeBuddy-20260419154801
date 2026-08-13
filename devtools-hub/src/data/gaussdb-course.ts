/**
 * GaussDB 在线学习课程数据
 * GaussDB 基于 PostgreSQL 内核，本教程所有 SQL 均可在浏览器内置的 PGlite (PostgreSQL WASM) 中运行
 */

// ============ 示例数据库初始化 SQL ============
export const INIT_SQL = `
-- 部门表
CREATE TABLE IF NOT EXISTS departments (
  dept_id     INT PRIMARY KEY,
  dept_name   VARCHAR(50) NOT NULL,
  location    VARCHAR(100)
);

-- 职位表
CREATE TABLE IF NOT EXISTS jobs (
  job_id      INT PRIMARY KEY,
  job_title   VARCHAR(50) NOT NULL,
  min_salary  NUMERIC(10,2),
  max_salary  NUMERIC(10,2)
);

-- 员工表
CREATE TABLE IF NOT EXISTS employees (
  emp_id      INT PRIMARY KEY,
  emp_name    VARCHAR(50) NOT NULL,
  gender      CHAR(1) CHECK (gender IN ('M','F')),
  hire_date   DATE,
  salary      NUMERIC(10,2),
  dept_id     INT,
  job_id      INT,
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id),
  FOREIGN KEY (job_id)  REFERENCES jobs(job_id)
);

INSERT INTO departments (dept_id, dept_name, location) VALUES
  (1, '研发部', '深圳'),
  (2, '产品部', '北京'),
  (3, '市场部', '上海'),
  (4, '销售部', '广州'),
  (5, '财务部', '深圳'),
  (6, '人力资源部', '北京');

INSERT INTO jobs (job_id, job_title, min_salary, max_salary) VALUES
  (1, '初级工程师', 8000, 15000),
  (2, '高级工程师', 15000, 30000),
  (3, '产品经理',   18000, 35000),
  (4, '市场专员',   6000, 12000),
  (5, '销售代表',   5000, 15000),
  (6, '财务专员',   7000, 15000),
  (7, 'HR专员',     6000, 12000);

INSERT INTO employees (emp_id, emp_name, gender, hire_date, salary, dept_id, job_id) VALUES
  (1,  '张伟', 'M', '2020-03-15', 22000, 1, 2),
  (2,  '李娜', 'F', '2021-06-01', 18000, 2, 3),
  (3,  '王强', 'M', '2019-11-20', 28000, 1, 2),
  (4,  '刘洋', 'F', '2022-02-14', 12000, 3, 4),
  (5,  '陈静', 'F', '2020-09-01', 15000, 4, 5),
  (6,  '杨帆', 'M', '2018-07-10', 32000, 1, 2),
  (7,  '赵磊', 'M', '2023-01-05', 10000, 2, 1),
  (8,  '孙丽', 'F', '2021-12-01', 9500, 3, 4),
  (9,  '周杰', 'M', '2019-04-22', 25000, 1, 2),
  (10, '吴敏', 'F', '2022-08-15', 13000, 5, 6),
  (11, '郑浩', 'M', '2020-10-01', 11000, 4, 5),
  (12, '王芳', 'F', '2023-05-20', 8500, 6, 7),
  (13, '冯军', 'M', '2021-03-08', 16000, 2, 3),
  (14, '蒋婷', 'F', '2022-11-30', 10500, 5, 6),
  (15, '沈鹏', 'M', '2020-06-18', 20000, 1, 2);
`

// ============ 内容块类型 ============
export type ContentBlock =
  | { type: 'p'; text: string }
  | { type: 'code'; title?: string; sql: string; desc?: string }
  | { type: 'list'; title?: string; items: string[] }
  | { type: 'note'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }

export interface Exercise {
  id: string
  title: string
  description: string
  hint?: string
  answer: string
  answerNote?: string
}

export interface Chapter {
  id: string
  title: string
  subtitle: string
  intro: string
  blocks: ContentBlock[]
  exercises: Exercise[]
}

export const COURSE_CHAPTERS: Chapter[] = [
  {
    id: 'gaussdb-intro',
    title: 'GaussDB 数据库概述',
    subtitle: '了解 GaussDB 是什么、能做什么',
    intro: '华为云 GaussDB 是企业级分布式关系型数据库，基于 PostgreSQL 内核演进，兼容 SQL 标准，广泛应用于金融、政务、电信等关键行业。',
    blocks: [
      {
        type: 'p',
        text: 'GaussDB 是华为自研的企业级 AI-Native 数据库，核心特点如下：',
      },
      {
        type: 'list',
        title: '核心特性',
        items: [
          '分布式架构：支持集中式与分布式两种部署形态，弹性扩缩容',
          '高性能：NUMA 化内核、SQL 引擎优化，性能可达传统数据库数倍',
          '高可用：RPO=0 的同城双活容灾，故障切换秒级完成',
          'SQL 兼容：高度兼容 PostgreSQL 语法，也兼容 MySQL 常用协议',
          'AI-Native：内置智能优化器、自动索引推荐等数据库智能化能力',
          '安全可靠：全密态、防篡改、等保四级认证',
        ],
      },
      {
        type: 'note',
        text: '本教程所有示例基于 GaussDB 兼容的 PostgreSQL 语法，内置了浏览器版数据库引擎，你可以放心逐条运行练习。',
      },
      {
        type: 'p',
        text: 'GaussDB 的 SQL 语法与 PostgreSQL 高度一致。我们来看一个最简单的查询，验证数据库引擎已就绪：',
      },
      {
        type: 'code',
        title: '验证数据库版本',
        sql: 'SELECT version();',
        desc: '查看数据库版本信息，确认引擎已启动。',
      },
      {
        type: 'table',
        headers: ['术语', '说明'],
        rows: [
          ['数据库 Database', '数据的集合，一个实例可包含多个数据库'],
          ['模式 Schema', '数据库内的命名空间，用于组织表、视图等对象'],
          ['表 Table', '二维结构存储数据，由行（记录）和列（字段）组成'],
          ['行 Row', '表中的一条完整记录'],
          ['列 Column', '表中的一个字段，有确定的数据类型'],
        ],
      },
    ],
    exercises: [
      {
        id: 'intro-1',
        title: '查看当前数据库与用户',
        description: 'GaussDB 中如何查看当前连接的是哪个数据库、当前用户是谁？运行一条 SQL 同时查询当前数据库名和当前用户名。',
        hint: '使用 SELECT current_database(), current_user;',
        answer: 'SELECT current_database() AS 当前数据库, current_user AS 当前用户;',
        answerNote: 'current_database() 返回当前库名，current_user 返回当前登录用户。',
      },
      {
        id: 'intro-2',
        title: '体验算术表达式',
        description: 'GaussDB 支持直接在 SELECT 中进行运算。请计算员工的年薪计算方式：月薪 22000 元，计算年薪（含 12 个月工资 + 年底 2 个月奖金）。',
        hint: 'SELECT 22000 * 14 AS 年薪;',
        answer: 'SELECT 22000 * (12 + 2) AS 年薪;',
        answerNote: 'SELECT 不仅可以查表，也可以直接计算表达式，这里算出的年薪是 308000。',
      },
    ],
  },
  {
    id: 'sql-data-types',
    title: 'SQL 基础与数据类型',
    subtitle: '认识 SQL 语言分类与 GaussDB 常用数据类型',
    intro: 'SQL（Structured Query Language）是关系数据库的标准语言。掌握 SQL 四大家族（DDL / DML / DQL / DCL）是学习 GaussDB 的第一步。',
    blocks: [
      {
        type: 'p',
        text: 'SQL 按功能分为以下几类：',
      },
      {
        type: 'table',
        headers: ['分类', '作用', '常见语句'],
        rows: [
          ['DDL', '定义数据结构', 'CREATE、ALTER、DROP'],
          ['DML', '操作数据内容', 'INSERT、UPDATE、DELETE'],
          ['DQL', '查询数据', 'SELECT'],
          ['DCL', '权限控制', 'GRANT、REVOKE'],
        ],
      },
      {
        type: 'p',
        text: 'GaussDB 提供了丰富的数据类型，常用如下：',
      },
      {
        type: 'table',
        headers: ['类型', '说明', '示例'],
        rows: [
          ['INTEGER / INT', '4 字节整数', '42'],
          ['NUMERIC(p,s)', '高精度定点数', '22000.00'],
          ['VARCHAR(n)', '可变长字符串', '张伟'],
          ['CHAR(n)', '定长字符串', 'M'],
          ['DATE', '日期', '2020-03-15'],
          ['TIMESTAMP', '日期时间', '2026-08-13 10:30:00'],
          ['BOOLEAN', '布尔值', 'TRUE / FALSE'],
          ['TEXT', '长文本', '备注信息'],
        ],
      },
      {
        type: 'code',
        title: '查看示例库中的表',
        sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;",
        desc: '查询当前数据库中的用户表（departments、jobs、employees）。',
      },
    ],
    exercises: [
      {
        id: 'types-1',
        title: '查看员工表的表结构',
        description: '使用 \d 命令对应的 SQL 方式查看 employees 表的字段定义：请通过 information_schema.columns 查询 employees 表的列名和数据类型。',
        hint: 'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'employees\';',
        answer: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'employees' ORDER BY ordinal_position;",
        answerNote: 'information_schema 是系统元数据视图，记录了所有对象的结构信息。',
      },
      {
        id: 'types-2',
        title: '数据类型转换',
        description: '将字符串 \'2024-06-01\' 转换为 DATE 类型，并将整数 12345 转换为 NUMERIC(8,2)。',
        hint: '使用 :: 语法，如 \'2024-06-01\'::DATE',
        answer: "SELECT '2024-06-01'::DATE AS 日期, 12345::NUMERIC(8,2) AS 金额;",
        answerNote: 'GaussDB/PostgreSQL 支持 :: 类型转换语法，也支持 CAST(expr AS type)。',
      },
    ],
  },
  {
    id: 'ddl',
    title: '表结构设计 DDL',
    subtitle: '创建表、修改表、删除表',
    intro: 'DDL（数据定义语言）用于创建和调整数据库对象。良好的表结构设计是数据库性能与可维护性的基础。',
    blocks: [
      {
        type: 'p',
        text: 'CREATE TABLE 是 DDL 的核心语句，语法要点：',
      },
      {
        type: 'code',
        title: '创建一张项目表',
        sql: `CREATE TABLE projects (
  project_id  INT PRIMARY KEY,
  project_name VARCHAR(100) NOT NULL,
  budget      NUMERIC(12,2) DEFAULT 0,
  start_date  DATE
);

INSERT INTO projects VALUES
  (1, 'GaussDB 分布式改造', 500000, '2026-01-15'),
  (2, '智能推荐平台', 800000, '2026-03-01'),
  (3, '数据中台建设', 1200000, '2026-05-20');

SELECT * FROM projects;`,
        desc: '运行后创建 projects 表并插入 3 条示例数据。注意 DEFAULT 提供了默认值。',
      },
      {
        type: 'list',
        title: '常见 DDL 操作',
        items: [
          'ALTER TABLE 表名 ADD COLUMN 列名 类型;   -- 新增列',
          'ALTER TABLE 表名 DROP COLUMN 列名;      -- 删除列',
          'ALTER TABLE 表名 ALTER COLUMN 列名 TYPE 新类型;  -- 修改类型',
          'DROP TABLE 表名;                        -- 删除表',
          'TRUNCATE TABLE 表名;                    -- 清空数据（保留结构）',
        ],
      },
    ],
    exercises: [
      {
        id: 'ddl-1',
        title: '创建一张客户表',
        description: '为电商系统创建 customers 客户表，包含：customer_id（整型主键）、customer_name（varchar(50) 非空）、email（varchar(100)）、level（varchar(10) 默认 \'普通\'）、created_at（DATE）。',
        hint: 'CREATE TABLE customers (...) 即可',
        answer: `CREATE TABLE customers (
  customer_id   INT PRIMARY KEY,
  customer_name VARCHAR(50) NOT NULL,
  email         VARCHAR(100),
  level         VARCHAR(10) DEFAULT '普通',
  created_at    DATE
);
SELECT * FROM customers;`,
        answerNote: 'PRIMARY KEY 定义了主键；DEFAULT 为未显式赋值的列提供默认值。',
      },
      {
        id: 'ddl-2',
        title: '修改表结构',
        description: '基于上一题创建的 customers 表（如果上题未执行，请先执行建表语句）：① 新增一列 phone VARCHAR(20)；② 把 email 改为 VARCHAR(120)；③ 删除 created_at 列。',
        hint: '连续使用三条 ALTER TABLE 语句',
        answer: `CREATE TABLE IF NOT EXISTS customers (
  customer_id INT PRIMARY KEY,
  customer_name VARCHAR(50) NOT NULL,
  email VARCHAR(100)
);

ALTER TABLE customers ADD COLUMN phone VARCHAR(20);
ALTER TABLE customers ALTER COLUMN email TYPE VARCHAR(120);
ALTER TABLE customers DROP COLUMN created_at;

SELECT column_name FROM information_schema.columns
WHERE table_name = 'customers' ORDER BY ordinal_position;`,
        answerNote: 'ALTER TABLE 可以叠加多个子句，如 ALTER TABLE t ADD COLUMN ..., DROP COLUMN ...;',
      },
    ],
  },
  {
    id: 'dml',
    title: '数据操作 DML',
    subtitle: 'INSERT / UPDATE / DELETE',
    intro: 'DML（数据操作语言）负责数据的增删改。GaussDB 的 DML 语法与 PostgreSQL 一致，并支持多行插入、RETURNING 等高级特性。',
    blocks: [
      {
        type: 'code',
        title: '插入、修改、删除',
        sql: `-- 多行插入
INSERT INTO departments (dept_id, dept_name, location) VALUES
  (7, '客服部', '成都'),
  (8, '物流部', '武汉');

-- 修改数据
UPDATE departments SET location = '西安' WHERE dept_id = 8;

-- 删除数据
DELETE FROM departments WHERE dept_id = 7;

-- RETURNING 返回被影响的行（GaussDB/PostgreSQL 特色）
UPDATE departments SET dept_name = '供应链部' WHERE dept_id = 8
RETURNING *;

SELECT * FROM departments ORDER BY dept_id;`,
        desc: '注意 UPDATE/DELETE 的 WHERE 条件一定要写清楚，否则会操作全表。',
      },
      {
        type: 'note',
        text: '请勿在生产环境不带 WHERE 执行 UPDATE/DELETE！本练习环境可以随时点击「重置数据」恢复初始状态。',
      },
    ],
    exercises: [
      {
        id: 'dml-1',
        title: '新增一名员工',
        description: '向 employees 表插入一名新员工：emp_id=16，姓名"钱多多"，性别 M，入职日期 2026-08-01，月薪 12500，部门 3（市场部），职位 4（市场专员）。',
        hint: 'INSERT INTO employees (emp_id, emp_name, gender, hire_date, salary, dept_id, job_id) VALUES (...);',
        answer: "INSERT INTO employees (emp_id, emp_name, gender, hire_date, salary, dept_id, job_id)\nVALUES (16, '钱多多', 'M', '2026-08-01', 12500, 3, 4)\nRETURNING *;",
        answerNote: 'RETURNING * 可以立刻看到刚插入的完整记录。',
      },
      {
        id: 'dml-2',
        title: '批量加薪 + 调岗',
        description: '① 给研发部（dept_id=1）的所有员工加薪 10%；② 把孙丽（emp_id=8）的职位调整为 6（财务专员）。',
        hint: 'UPDATE employees SET salary = salary * 1.1 WHERE dept_id = 1;',
        answer: `UPDATE employees SET salary = salary * 1.1 WHERE dept_id = 1;
UPDATE employees SET job_id = 6 WHERE emp_id = 8;
SELECT emp_id, emp_name, salary, job_id FROM employees WHERE dept_id = 1 OR emp_id = 8 ORDER BY emp_id;`,
        answerNote: 'salary = salary * 1.1 是在原值基础上计算新值，这是加薪的常见写法。',
      },
    ],
  },
  {
    id: 'select-basics',
    title: '查询入门 SELECT',
    subtitle: 'SELECT / WHERE / ORDER BY / LIMIT',
    intro: 'SELECT 是使用频率最高的 SQL 语句。GaussDB 的查询优化器会为你的查询自动选择最优执行计划。',
    blocks: [
      {
        type: 'p',
        text: 'SELECT 基本语法：SELECT 列 FROM 表 [WHERE 条件] [ORDER BY 列] [LIMIT n]。',
      },
      {
        type: 'code',
        title: '基础查询组合',
        sql: `-- 查询所有员工姓名与薪资
SELECT emp_name, salary FROM employees;

-- 带条件：薪资超过 20000
SELECT emp_name, salary FROM employees
WHERE salary > 20000;

-- 排序 + 限制条数：按薪资从高到低取前 5
SELECT emp_name, salary FROM employees
ORDER BY salary DESC
LIMIT 5;

-- 去重：有哪些部门分布
SELECT DISTINCT location FROM departments ORDER BY location;`,
        desc: 'WHERE 过滤行，ORDER BY 排序，LIMIT 限制返回行数，DISTINCT 去重。',
      },
      {
        type: 'list',
        title: '常用运算符',
        items: [
          '比较：=、<>、>、>=、<、<=',
          '逻辑：AND、OR、NOT',
          '范围：BETWEEN x AND y',
          '集合：IN (a, b, c)',
          '模糊：LIKE \'张%\'（% 任意多字符，_ 单字符）',
          '空值：IS NULL、IS NOT NULL',
        ],
      },
    ],
    exercises: [
      {
        id: 'select-1',
        title: '查询研发部高薪员工',
        description: '查询研发部（dept_id=1）中薪资在 20000 以上的员工姓名和薪资，按薪资从高到低排序。',
        hint: 'WHERE dept_id = 1 AND salary > 20000',
        answer: `SELECT emp_name, salary FROM employees
WHERE dept_id = 1 AND salary > 20000
ORDER BY salary DESC;`,
        answerNote: '多个条件用 AND 连接，注意 dept_id=1 的部门是研发部。',
      },
      {
        id: 'select-2',
        title: '模糊查询与空值判断',
        description: '① 查询所有姓"王"的员工；② 查询没有入职日期的员工（本题结果可能为空，请确认语法正确）。',
        hint: "LIKE '王%'；IS NULL",
        answer: `SELECT emp_name FROM employees WHERE emp_name LIKE '王%';
SELECT emp_name FROM employees WHERE hire_date IS NULL;`,
        answerNote: 'LIKE 中 % 匹配任意长度字符；空值判断必须用 IS NULL 而不能用 = NULL。',
      },
    ],
  },
  {
    id: 'aggregation',
    title: '聚合与分组',
    subtitle: 'GROUP BY / HAVING / 聚合函数',
    intro: '聚合函数把多行数据汇总为一行结果，配合 GROUP BY 可以对分组数据分别汇总，是数据分析的核心技能。',
    blocks: [
      {
        type: 'table',
        headers: ['聚合函数', '作用'],
        rows: [
          ['COUNT(*)', '统计行数'],
          ['SUM(列)', '求和'],
          ['AVG(列)', '求平均值'],
          ['MAX(列) / MIN(列)', '最大值 / 最小值'],
        ],
      },
      {
        type: 'code',
        title: '统计各部门薪资情况',
        sql: `SELECT dept_id,
       COUNT(*)     AS 员工数,
       ROUND(AVG(salary), 0) AS 平均薪资,
       MAX(salary)  AS 最高薪资,
       MIN(salary)  AS 最低薪资
FROM employees
GROUP BY dept_id
ORDER BY dept_id;`,
        desc: 'GROUP BY 按部门分组后，每个部门输出一行汇总。',
      },
      {
        type: 'code',
        title: 'HAVING 过滤分组',
        sql: `-- 找出平均薪资超过 15000 的部门
SELECT dept_id, ROUND(AVG(salary), 0) AS 平均薪资
FROM employees
GROUP BY dept_id
HAVING AVG(salary) > 15000
ORDER BY 平均薪资 DESC;`,
        desc: 'WHERE 过滤行，HAVING 过滤分组（必须配合 GROUP BY 使用）。',
      },
    ],
    exercises: [
      {
        id: 'agg-1',
        title: '统计各部门员工数',
        description: '按部门统计员工人数，只显示员工数大于等于 3 的部门，并按人数降序排列。',
        hint: 'GROUP BY dept_id HAVING COUNT(*) >= 3',
        answer: `SELECT dept_id, COUNT(*) AS 员工数
FROM employees
GROUP BY dept_id
HAVING COUNT(*) >= 3
ORDER BY 员工数 DESC;`,
        answerNote: 'HAVING 中可以使用聚合函数 COUNT(*)，WHERE 中不可以。',
      },
      {
        id: 'agg-2',
        title: '统计全公司薪资',
        description: '计算全公司员工总数、薪资总和、平均薪资（保留两位小数）。',
        hint: 'SELECT COUNT(*), SUM(salary), ROUND(AVG(salary), 2) FROM employees;',
        answer: `SELECT COUNT(*)      AS 员工总数,
       SUM(salary)   AS 薪资总额,
       ROUND(AVG(salary), 2) AS 平均薪资
FROM employees;`,
        answerNote: '不写 GROUP BY 时聚合函数作用于整张表，只返回一行。',
      },
    ],
  },
  {
    id: 'join',
    title: '多表连接 JOIN',
    subtitle: 'INNER JOIN / LEFT JOIN / RIGHT JOIN',
    intro: '真实业务的数据分散在多张表中，JOIN 通过关联键把它们连接起来，得到完整信息。',
    blocks: [
      {
        type: 'p',
        text: '连接类型：',
      },
      {
        type: 'table',
        headers: ['连接类型', '返回结果'],
        rows: [
          ['INNER JOIN', '只返回两表匹配的行'],
          ['LEFT JOIN', '返回左表全部行，右表无匹配则为 NULL'],
          ['RIGHT JOIN', '返回右表全部行，左表无匹配则为 NULL'],
          ['FULL JOIN', '返回两表所有行'],
        ],
      },
      {
        type: 'code',
        title: '查询员工及其部门信息',
        sql: `SELECT e.emp_name, d.dept_name, d.location
FROM employees e
INNER JOIN departments d ON e.dept_id = d.dept_id
ORDER BY e.emp_id
LIMIT 5;`,
        desc: '使用表别名 e / d 简化书写，ON 指定关联条件。',
      },
      {
        type: 'code',
        title: 'LEFT JOIN 显示未匹配数据',
        sql: `-- 左连接：右表无匹配时补 NULL
SELECT d.dept_name, COUNT(e.emp_id) AS 员工数
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
GROUP BY d.dept_name
ORDER BY 员工数 DESC;`,
        desc: 'LEFT JOIN + 聚合，统计每个部门人数（含暂无员工的部门）。',
      },
    ],
    exercises: [
      {
        id: 'join-1',
        title: '三表连接查询',
        description: '查询员工姓名、部门名称、职位名称，按员工编号排序，返回前 8 条。需要连接 employees、departments、jobs 三张表。',
        hint: 'JOIN departments ON ... JOIN jobs ON ...',
        answer: `SELECT e.emp_name, d.dept_name, j.job_title
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
JOIN jobs j ON e.job_id = j.job_id
ORDER BY e.emp_id
LIMIT 8;`,
        answerNote: '连续 JOIN 多张表时，每张表都要写清 ON 关联条件。',
      },
      {
        id: 'join-2',
        title: '统计各部门平均薪资',
        description: '用 JOIN 把部门名带出来，统计每个部门的平均薪资（保留整数），按平均薪资从高到低排序，返回前 3 名。',
        hint: 'SELECT d.dept_name, ROUND(AVG(e.salary),0) ... GROUP BY d.dept_name ORDER BY ... DESC LIMIT 3',
        answer: `SELECT d.dept_name, ROUND(AVG(e.salary), 0) AS 平均薪资
FROM departments d
JOIN employees e ON e.dept_id = d.dept_id
GROUP BY d.dept_name
ORDER BY 平均薪资 DESC
LIMIT 3;`,
        answerNote: 'GROUP BY 的列必须出现在 SELECT 列表中（除聚合函数外）。',
      },
    ],
  },
  {
    id: 'subquery',
    title: '子查询',
    subtitle: '嵌套查询解决复杂问题',
    intro: '子查询是嵌套在另一个查询中的 SELECT，可以出现在 WHERE、FROM、SELECT 等位置，用于解决"先算一步再比较"的问题。',
    blocks: [
      {
        type: 'code',
        title: 'WHERE 子查询：找比平均薪资高的员工',
        sql: `SELECT emp_name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees)
ORDER BY salary DESC;`,
        desc: '括号内的子查询先执行（算出平均薪资），再与每个员工的薪资比较。',
      },
      {
        type: 'code',
        title: 'IN / EXISTS 子查询',
        sql: `-- IN：所在部门位于北京或深圳的员工
SELECT emp_name FROM employees
WHERE dept_id IN (
  SELECT dept_id FROM departments WHERE location IN ('北京', '深圳')
);

-- EXISTS：有员工且员工数超过 2 的部门
SELECT dept_name FROM departments d
WHERE EXISTS (
  SELECT 1 FROM employees e
  WHERE e.dept_id = d.dept_id
  GROUP BY e.dept_id
  HAVING COUNT(*) > 2
);`,
        desc: 'EXISTS 关注"是否存在"，比 IN 在大数据量下通常更高效。',
      },
    ],
    exercises: [
      {
        id: 'sub-1',
        title: '查询薪资最高员工的姓名',
        description: '不使用 ORDER BY LIMIT，用子查询找出薪资最高的员工姓名和薪资。',
        hint: 'WHERE salary = (SELECT MAX(salary) FROM employees)',
        answer: `SELECT emp_name, salary
FROM employees
WHERE salary = (SELECT MAX(salary) FROM employees);`,
        answerNote: 'MAX(salary) 子查询返回全表最高薪资，再匹配出对应员工。',
      },
      {
        id: 'sub-2',
        title: '查询没有员工的市场部',
        description: '用 NOT EXISTS 找出没有任何员工的部门（dept_name）。',
        hint: 'WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.dept_id)',
        answer: `SELECT d.dept_name
FROM departments d
WHERE NOT EXISTS (
  SELECT 1 FROM employees e
  WHERE e.dept_id = d.dept_id
);`,
        answerNote: 'NOT EXISTS 返回不存在匹配行的部门。结合示例数据，可验证哪些部门暂无员工。',
      },
    ],
  },
  {
    id: 'functions',
    title: '常用函数',
    subtitle: '字符串 / 数值 / 日期 / CASE',
    intro: '函数让 SQL 具备数据处理能力。GaussDB 内置数百个函数，掌握常用函数可大幅提升开发效率。',
    blocks: [
      {
        type: 'code',
        title: '字符串与数值函数',
        sql: `SELECT
  UPPER('gaussdb')            AS 大写,
  LENGTH('GaussDB')           AS 长度,
  CONCAT('华为', ' GaussDB')  AS 拼接,
  ROUND(123.456, 2)           AS 四舍五入,
  ABS(-88)                    AS 绝对值,
  MOD(17, 5)                  AS 取余;`,
        desc: 'UPPER/LOWER/LENGTH/CONCAT 处理字符串，ROUND/ABS/MOD 处理数值。',
      },
      {
        type: 'code',
        title: '日期函数与 CASE 表达式',
        sql: `-- 员工入职时长（年）
SELECT emp_name,
       EXTRACT(YEAR FROM hire_date) AS 入职年份,
       ROUND((CURRENT_DATE - hire_date) / 365.0, 1) AS 入职年数
FROM employees
ORDER BY 入职年份
LIMIT 5;

-- CASE 薪资等级
SELECT emp_name,
  CASE
    WHEN salary >= 25000 THEN '高薪'
    WHEN salary >= 15000 THEN '中等'
    ELSE '一般'
  END AS 薪资等级
FROM employees
ORDER BY salary DESC
LIMIT 8;`,
        desc: 'CASE 表达式实现 if-else 逻辑，EXTRACT 提取日期部分。',
      },
    ],
    exercises: [
      {
        id: 'func-1',
        title: '生成邮箱地址',
        description: '把员工姓名转为小写拼音风格：用 LOWER() 处理 emp_name，并拼接 @company.com 生成模拟邮箱，如 zhangwei@company.com。',
        hint: "SELECT emp_name, LOWER(emp_name) || '@company.com' AS 邮箱 FROM employees;",
        answer: `SELECT emp_name,
       LOWER(emp_name) || '@company.com' AS 模拟邮箱
FROM employees
ORDER BY emp_id;`,
        answerNote: '|| 是字符串连接运算符，与 CONCAT() 功能类似。',
      },
      {
        id: 'func-2',
        title: '员工工龄分组',
        description: '用 EXTRACT 提取入职年份，统计每年入职的人数，按年份降序排列。',
        hint: 'SELECT EXTRACT(YEAR FROM hire_date) AS 年份, COUNT(*) AS 人数 FROM employees GROUP BY 年份 ORDER BY 年份 DESC;',
        answer: `SELECT EXTRACT(YEAR FROM hire_date) AS 入职年份,
       COUNT(*) AS 人数
FROM employees
GROUP BY EXTRACT(YEAR FROM hire_date)
ORDER BY 入职年份 DESC;`,
        answerNote: 'GROUP BY 中可以直接使用函数表达式，SELECT 中的别名也可以用于 ORDER BY。',
      },
    ],
  },
  {
    id: 'view-transaction',
    title: '视图与事务',
    subtitle: 'CREATE VIEW / BEGIN / COMMIT / ROLLBACK',
    intro: '视图是虚拟表，封装复杂查询供复用；事务保证一组操作要么全部成功、要么全部回滚，是数据一致性的基石。',
    blocks: [
      {
        type: 'code',
        title: '创建视图',
        sql: `CREATE OR REPLACE VIEW v_dept_salary AS
SELECT d.dept_name,
       COUNT(e.emp_id)   AS 员工数,
       ROUND(AVG(e.salary), 2) AS 平均薪资
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
GROUP BY d.dept_name;

-- 使用视图（像查表一样简单）
SELECT * FROM v_dept_salary ORDER BY 平均薪资 DESC;`,
        desc: '视图本身不存储数据，查询时实时执行背后的 SQL。',
      },
      {
        type: 'code',
        title: '事务：回滚示例',
        sql: `BEGIN;
UPDATE employees SET salary = salary * 2 WHERE dept_id = 1;
SELECT emp_name, salary FROM employees WHERE dept_id = 1 LIMIT 2;  -- 薪资翻倍生效
ROLLBACK;
SELECT emp_name, salary FROM employees WHERE dept_id = 1 LIMIT 2;  -- 已恢复原值`,
        desc: 'BEGIN 开启事务，ROLLBACK 撤销所有未提交的修改。改为 COMMIT 则永久生效。',
      },
    ],
    exercises: [
      {
        id: 'vt-1',
        title: '创建视图并查询',
        description: '创建视图 v_emp_detail 展示：员工名、部门名、职位名、薪资（四列），然后查询薪资最高的前 5 名。',
        hint: 'CREATE VIEW v_emp_detail AS SELECT ... JOIN ...',
        answer: `CREATE OR REPLACE VIEW v_emp_detail AS
SELECT e.emp_name, d.dept_name, j.job_title, e.salary
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
JOIN jobs j ON e.job_id = j.job_id;

SELECT * FROM v_emp_detail ORDER BY salary DESC LIMIT 5;`,
        answerNote: '视图封装了三表连接，后续只需简单 SELECT 即可复用。',
      },
      {
        id: 'vt-2',
        title: '事务提交与回滚',
        description: '开启一个事务：把销售部（dept_id=4）所有员工加薪 20%，然后 COMMIT 提交；再开启一个事务把研发部（dept_id=1）所有员工薪资清零，然后 ROLLBACK 回滚。最后确认销售部薪资已变、研发部薪资未变。',
        hint: 'BEGIN; UPDATE ...; COMMIT; 和 BEGIN; UPDATE ...; ROLLBACK;',
        answer: `BEGIN;
UPDATE employees SET salary = salary * 1.2 WHERE dept_id = 4;
COMMIT;

BEGIN;
UPDATE employees SET salary = 0 WHERE dept_id = 1;
ROLLBACK;

-- 验证：销售部(4)已加薪，研发部(1)未变
SELECT dept_id, ROUND(SUM(salary), 2) AS 部门薪资合计
FROM employees
WHERE dept_id IN (1, 4)
GROUP BY dept_id
ORDER BY dept_id;`,
        answerNote: 'COMMIT 使修改永久生效，ROLLBACK 丢弃未提交的修改。',
      },
    ],
  },
]

// ============ 数据库元数据展示 ============
export const SCHEMA_INFO = `
-- 本练习环境内置三张业务表：
--  departments(部门表): dept_id, dept_name, location
--  jobs(职位表):       job_id, job_title, min_salary, max_salary
--  employees(员工表):  emp_id, emp_name, gender, hire_date, salary, dept_id, job_id
`
